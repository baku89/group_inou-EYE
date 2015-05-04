#------------------------------------------------------------
# constants
MAX_PTS = 100
DIST_BETWEEN_PTS = 5

API_KEY = "AIzaSyBQ2dzDfyF8Y0Dwe-Q6Jzx4_G62ANrTotQ"
VERSION = '0.3'

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
		$("input[value=#{storage.method}]").prop('checked', true)
		$('#url').val( storage.url )
		$('#panoid').val( storage.panoid )
		$("input[value=#{storage.travelMode}]").prop('checked', true)
		$("input[value=#{storage.headingMode}]").prop('checked', true)
		$('#lookat').val( storage.lookat )
		$('#zoom').val( storage.zoom )
		$('#step').val( storage.step )
		$('#search-radius').val( storage.searchRadius )

	$elm.find('[data-parent]').each ->

		$this = $(@)
		$parent = $( $this.attr('data-parent') )
		name = $parent.attr('name')

		$("[name=#{name}").on 'change', =>
			$(@).toggle( $parent.prop('checked') )
		.trigger('change')


#------------------------------------------------------------
# functions

updateSettings = ->
	settings.name 	        = $('#name').val()
	settings.dir 	        = $('#dir').val()
	settings.method			= $('input[name=method]:checked').val()
	settings.url 	        = $('#url').val()
	settings.panoid 		= $('#panoid').val()
	settings.travelMode     = $('input[name=travel]:checked').val()
	settings.headingMode    = $('input[name=heading]:checked').val()
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
	GSVHyperlapse.onComposeComplete = onComposeComplete
	GSVHyperlapse.onCancel = onCancel

	restoreSettings()

	$('input').on 'change', updateSettings

#------------------------------------------------------------
create = ->

	updateSettings()

	FILE.exists "#{settings.dir}/#{settings.name}", (flg) ->

		if flg
			alert 'destination folder is already exists.'
			return
		

		index = tasks.length

		$('.tasks').append("
			<li id='task-#{index}'>
				<h1><input type='text' name='name' value='#{settings.name}'></h1>
				<button class='cancel action' data-index='#{index}'>Cancel</button>
				<p>mode: #{settings.method}<br></p>
				<div id='map-#{index}' style='width: 48%; height: 0; padding-top: 26%; background:gray; display: inline-block;'></div>
			</li>
		")

		hyperlapse = new GSVHyperlapse(settings.name, $("#map-#{index}")[0])
		hyperlapse.setParameters(settings)

		if settings.method == 'direction'
			hyperlapse.createFromDirection(settings.url)

		else if settings.method == 'panoid'
			list = $.parseJSON( $('#panoid').val() )
			hyperlapse.createFromPanoId(list)

		$("#task-#{index} .cancel").on 'click', ->
			index = $(@).attr('data-index')
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
	$p = $elm.children('p')

	$btnGen = $('<button>generate hyperlapse</button><br>');

	$elm.children('p').append( $btnGen )

	$btnGen.on 'click', =>
		$elm.children('.control').remove()
		@compose(settings)

		

#------------------------------------------------------------
onComposeComplete = ->
	index = tasks.indexOf( @ )
	$elm = $("#task-#{index}")
	$p = $elm.children('p')

	@name = $elm.find('[name=name]').prop('disabled', true).val()

	dir = "#{settings.dir}/#{@name}"

	FILE.saveText @report.settings, "#{dir}/_report.txt", (res) =>
		$p.append('report saved<br>')

	FILE.saveText @report.panoIds, "#{dir}/_pano-ids.json", (res) =>
		$p.append('pano-ids.json saved<br>')

	FILE.saveText @report.panoList, "#{dir}/_pano-data.json", (res) =>
		$p.append('pano-data.json saved<br>')

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
