#------------------------------------------------------------
# constants
MAX_PTS = 100
DIST_BETWEEN_PTS = 5

API_KEY = "AIzaSyBQ2dzDfyF8Y0Dwe-Q6Jzx4_G62ANrTotQ"
VERSION = '0.3'

TAG_HEIGHT = 40.0
PROXY_HEIGHT = 832.0
V_SCALE = (TAG_HEIGHT + PROXY_HEIGHT) / PROXY_HEIGHT

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


#------------------------------------------------------------
# functions

updateSettings = ->
	$('#gsv-generator').find('input, textarea').each ->
		type = $(this).attr('type')
		console.log type
		if type == 'checkbox'
			settings[this.name] = $(this).is(':checked')
		else if type == 'radio'
			if $(this).is(':checked')
				settings[this.name] = $(this).val()
		else
			settings[this.name] = $(this).val()
		return true
	return

#------------------------------------------------------------
# on load

sisyphus = null

$ ->
	canvas = document.createElement('canvas')

	$('#create').on 'click', create

	GSVHyperlapse.onMessage = onMessage
	GSVHyperlapse.onPanoramaLoad = onPanoramaLoad
	GSVHyperlapse.onProgress = onProgress
	GSVHyperlapse.onAnalyzeComplete = onAnalyzeComplete
	GSVHyperlapse.onComposeComplete = onComposeComplete
	GSVHyperlapse.onCancel = onCancel

	sisyphus = $('#gsv-generator').sisyphus()

	$('#gsv-generator').find('[data-parent]').each ->

		$this = $(@)
		$parent = $( $this.attr('data-parent') )
		name = $parent.attr('name')

		$("[name=#{name}").on 'change', =>
			$(@).toggle( $parent.prop('checked') )
		.trigger('change')

#------------------------------------------------------------
create = (e)->
	e.preventDefault()

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
			hyperlapse.createFromDirection( settings.url )

		else if settings.method == 'panoid'
			list = $.parseJSON( settings.panoid )
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

	# on click "compose" button
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

	if @method == GSVHyperlapseMethod.DIRECTION
		txtReport = """
					method: direction
					url: #{@sourceUrl}
					step: #{@step}
					searchRadius: #{@searchRadius}
					"""
	else if @method = GSVHyperlapseMethod.PANOID 
		txtReport = "method: panoid"

	txtPanoIds = JSON.stringify( (pano.id for pano in @panoList) )
	txtPanoList = JSON.stringify( @panoList )

	FILE.saveText txtReport, "#{dir}/_report.txt", (res) =>
		$p.append('report saved<br>')

	FILE.saveText txtPanoIds, "#{dir}/_pano-ids.json", (res) =>
		$p.append('pano-ids.json saved<br>')

	FILE.saveText txtPanoList, "#{dir}/_pano-data.json", (res) =>
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
onPanoramaLoad = (idx, pano, data) ->
	index = tasks.indexOf( @ )
	$elm = $("#task-#{index}")

	canvas.width = pano.width
	canvas.height = pano.height * V_SCALE

	ctx = canvas.getContext('2d')
	ctx.fillStyle = '#000000'
	ctx.fillRect(0, 0, canvas.width, canvas.height)
	ctx.drawImage(pano, 0, 0)

	tag =
		uid: @uid
		id: data.id
		heading: data.heading
		rotation: data.rotation
		pitch: data.pitch
		date: data.date
		latLng: data.latLng.toString()

	CanvasMatrixCode.draw(canvas, tag, 0, pano.height + 10, canvas.width, TAG_HEIGHT - 10)

	$elm.append(canvas)

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
