#------------------------------------------------------------
# constants
MAX_PTS = 100
DIST_BETWEEN_PTS = 5

API_KEY = "AIzaSyBQ2dzDfyF8Y0Dwe-Q6Jzx4_G62ANrTotQ"
VERSION = '0.1'

#------------------------------------------------------------
# variables
loader = null
dirService = new google.maps.DirectionsService({})

# each res
res = null

rawPts = []
panoIds = []
totalDist = 0

canvas = null

tasks = []

settings = {}

storage = localStorage



#------------------------------------------------------------
# init

restoreSettings = ->
	$elm = $('nav')

	if storage.version == VERSION
		# restore all settings
		$('#name').val( storage.name )
		$('#dir').val( storage.dir )
		$('#url').val( storage.url )
		$("input[value=#{storage.travelMode}]").prop('checked', true)
		$("input[value=#{storage.heading}]").prop('checked', true)
		$('#lookat').val( storage.lookat )
		$('#zoom').val( storage.zoom )
		$('#step').val( storage.step )
		$('#search-radius').val( storage.searchRadius )

	# bind
	$elm.find('input[data-onchecked], textarea[data-onchecked]').each ->
		
		$this = $(@)
		console.log $this

		$parent = $( $this.attr('data-onchecked') )
		name = $parent.attr('name')

		$( "[name=#{name}").on 'change', ->
			console.log $parent.prop('checked')
			$this.prop('disabled', !$parent.prop('checked'))


#------------------------------------------------------------
# functions

updateSettings = ->
	settings.name 	        = $('#name').val()
	settings.dir 	        = $('#dir').val()
	settings.url 	        = $('#url').val()
	settings.travelMode     = $('input[name=travel]:checked').val()
	settings.heading        = $('input[name=heading]:checked').val()
	settings.lookat         = $('#lookat').val()
	settings.zoom	        = $('#zoom').val()
	settings.step	        = $('#step').val()
	settings.searchRadius	= $('#search-radius').val()
	settings.version 		= VERSION

	# save to web storage
	$.extend(storage, settings)

#------------------------------------------------------------
# on load

$ ->

	canvas = $('#panorama')[0]

	$('#create').on 'click', create

	GSVHyperlapse.onMessage = onMessage
	GSVHyperlapse.onPanoramaLoad = onPanoramaLoad
	GSVHyperlapse.onProgress = onProgress
	GSVHyperlapse.onAnalyzeComplete = onAnalyzeComplete
	GSVHyperlapse.onCancel = onCancel

	restoreSettings()

	$('input').on 'change', updateSettings

#------------------------------------------------------------
create = ->

	updateSettings()

	index = tasks.length

	$('.tasks').append("
		<li id='task-#{index}'>
			<h1>#{settings.name}</h1>
			<button class='action' data-index='#{index}'>Cancel</button>
			<p>requesting route..<br></p>
			<div id='map-#{index}' style='width: 48%; height: 0; padding-top: 26%; background:gray; display: inline-block;'></div>
		</li>
	")

	hyperlapse = new GSVHyperlapse( settings )
	hyperlapse.setMap( $("#map-#{index}")[0] )
	hyperlapse.create()

	$("#task-#{index} button").on 'click', ->
		$elm = $(@)
		index = $elm.attr('data-index')
		tasks[index].cancel()


	tasks.push( hyperlapse )

#------------------------------------------------------------
onCancel = ->
	index = tasks.indexOf( @ )
	$elm = $("#task-#{index}")

	$btn = $('<button>delete</button><br>');

	$btn.on 'click', ->
		$elm.remove();

	$elm.children('p')
		.append('canceled<br>')
		.append( $btn );

#------------------------------------------------------------
onAnalyzeComplete = ->
	index = tasks.indexOf( @ )
	$elm = $("#task-#{index}")


	$btnGen = $('<button>generate hyperlapse</button><br>');

	$btnGen.on 'click', ->
		tasks[index].compose()

	$elm.children('p').append( $btnGen );

#------------------------------------------------------------
onProgress = (loaded, total) ->
	index = tasks.indexOf( @ )
	$elm = $("#task-#{index}")

	if loaded < 1
		$elm.children('p').append( $('<progress></progress>'))

	$elm.find("progress").last()
		.attr
			value: loaded
			max: total
			'data-label':  "[#{loaded}/#{total}]"

#------------------------------------------------------------
onMessage = (message) ->
	index = tasks.indexOf( @ )
	$elm = $("#task-#{index}")

	$elm.children('p').append( message + "<br>" )

#------------------------------------------------------------
onPanoramaLoad = (idx, canvas) ->
	index = tasks.indexOf( @ )
	$elm = $("#task-#{index}")

	$elm.append( canvas )

	# save image
	params =
		name: @name
		directory: settings.dir
		number: idx
		image: canvas.toDataURL('image/png')

	$.ajax 
		type: "POST"
		url: './save.php'
		data: params
		success: (json) =>
			result = $.parseJSON( json )
			if result.status != "success"
				@cancel()
				$elm.children('p').append("an error occured" + "<br>")
