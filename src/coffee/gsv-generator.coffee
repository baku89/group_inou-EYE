#------------------------------------------------------------
# constants
MAX_PTS = 100
DIST_BETWEEN_PTS = 5

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
# functions

updateSettings = ->
	$('#gsv-generator').find('input, textarea').each ->
		type = $(this).attr('type')
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

	$('[name=dirFile]').on 'change', ->
		$('[name=dir]').val( $('[name=dirFile]').val() )
		sisyphus.saveAllData()

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

	dirname = "#{settings.dir}/#{settings.name}"
	if fs.existsSync(dirname)

		suffix = 2
		loop
			dirname = "#{settings.dir}/#{settings.name}_#{suffix}"
			if !fs.existsSync(dirname)
				settings.name = "#{settings.name}_#{suffix}"
				break
			suffix++

	mkdirp.sync(dirname)

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

	$elm.children('.control').remove()
	@name = $elm.find('[name=name]').prop('disabled', true).val()
	@compose()

	# save data
	index = tasks.indexOf( @ )
	$elm = $("#task-#{index}")
	$p = $elm.children('p')

	$p.append('composing..<br>')

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

	txtReport += """

				 headingMode: #{@headingMode}
				 lookat: #{@lookat}
				 zoom: #{@zoom}
				 """

	txtPanoIds = JSON.stringify( (pano.id for pano in @panoList) )

	mkdirp dir, ->
		fs.writeFile "#{dir}/_report.txt", txtReport, ->
			$p.append('report saved<br>')

		fs.writeFile "#{dir}/_pano-ids.json", txtPanoIds, ->
			$p.append('pano-ids.json saved<br>')

#------------------------------------------------------------
onComposeComplete = ->
	index = tasks.indexOf( @ )
	$elm = $("#task-#{index}")
	$p = $elm.children('p')

	dir = "#{settings.dir}/#{@name}"
	txtPanoList = JSON.stringify( @panoList )

	fs.writeFile "#{dir}/_pano-data.json", txtPanoList, ->
		$p.append('pano-data.json saved<br>')

		notifier.notify
			title: "GSV Generator"
			message: "All done!"
			sound: true

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

	# heading marker
	ctx.fillStyle = '#ffffff'
	ctx.fillRect(0, pano.height + 3, 12, 3)

	# code
	tag =
		uid: @uid
		id: data.id
		heading: data.heading
		latLng: data.latLng.toString()
	
	CanvasMatrixCode.draw(canvas, tag, 0, pano.height + 10, canvas.width, TAG_HEIGHT - 10)




	$elm.append(canvas)

	path = "#{settings.dir}/#{@name}/#{@name}_#{('000000' + idx).substr(-6, 6)}.png"

	saveCanvas(canvas, path)