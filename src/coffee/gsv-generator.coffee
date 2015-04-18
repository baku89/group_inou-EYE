#------------------------------------------------------------
# constants
MAX_PTS = 100
DIST_BETWEEN_PTS = 5

API_KEY = "AIzaSyBQ2dzDfyF8Y0Dwe-Q6Jzx4_G62ANrTotQ"


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

#------------------------------------------------------------
# init

#------------------------------------------------------------
# functions

updateSettings = ->
	settings.name 	= $('#name').val()
	settings.dir 	= $('#dir').val()
	settings.url 	= $('#url').val()
	settings.lookat	= $('#lookat').val()
	settings.step	= $('#step').val()
	settings.heading= $('input[name=heading]:checked').val()
	settings.lookat = $('#lookat').val()
	settings.quality= if $('#flg-proxy').prop('checked') then 2 else 3

#------------------------------------------------------------
# on load

$ ->

	canvas = $('#panorama')[0]

	$('#create').on 'click', create

	GSVHyperlapse.onMessage = onMessage
	GSVHyperlapse.onPanoramaLoad = onPanoramaLoad

#------------------------------------------------------------
create = ->

	updateSettings()

	index = tasks.length

	$('.tasks').append("
		<li id='task-#{index}'>
			<h1>#{settings.name}</h1>
			<button class='action' data-index='#{index}'>Cancel</button>
			<p>requesting route..<br></p>
			<progress max='1' value='0'>ダウンロード中</progress>
		</li>
	")

	hyperlapse = new GSVHyperlapse( settings )
	hyperlapse.create()

	$("#task-#{index} button").on 'click', ->
		$elm = $(@)
		index = $elm.attr('data-index')
		tasks[index].bCancel = true
		$elm.next().append('canceled')


	tasks.push( hyperlapse )

#------------------------------------------------------------
onMessage = (message) ->
	index = tasks.indexOf( @ )
	$elm = $("#task-#{index}")

	$elm.children('p').append( message + "<br>" )

#------------------------------------------------------------
onPanoramaLoad = (canvas, loaded, total) ->
	index = tasks.indexOf( @ )
	$elm = $("#task-#{index}")

	$elm.children("progress")
		.attr
			value: loaded
			max: total
			'data-label':  "[#{loaded}/#{total}]"

	$elm.append( canvas )

	# save image
	params =
		name: @name
		directory: settings.dir
		number: @numPanorama
		image: canvas.toDataURL('image/png')

	console.log params.image

	self = @

	$.ajax 
		type: "POST"
		url: './save.php'
		data: params
		success: (json) ->
			result = $.parseJSON( json )
			if result.status != "success"
				self.bCancel = true
				$elm.children('p').append("an error occured" + "<br>")
