fs 		= require 'fs'
path	= require 'path'
gui 	= require 'nw.gui'

#------------------------------------------------------------
# window setup

win = gui.Window.get()
nativeMenuBar = new gui.Menu({type: 'menubar'})

try
	nativeMenuBar.createMacBuiltin('gi-eye')
	win.menu = nativeMenuBar
catch err
	console.log err.message

#------------------------------------------------------------
panoList = []
canvas = ctx = null
srcDir = null
fileList = null

gsvh = null

canvas = document.cleateElement('canvas')

basename = null
$console = null

log = (str) ->
	$console.append("#{str}\n")
	$console.scrollTop = $console.scrollHeight

$ ->
	$console = $('#console')

	$('#replace-proxy').sisyphus()

	canvas = $('#pv')[0]
	ctx = canvas.getContext('2d')

	$('#decode').on 'click', decode

	$('[name=file]').on 'change', ->
		$('[name=source]')
			.val( $('[name=file]').val() )
		sisyphus.saveAllData()




#------------------------------------------------------------
decode = ->
	srcDir = $('[name=source]').val()

	if srcDir == ""
		alert "please select source directory"
		return

	fs.readdir srcDir, (err, files) ->
		if err then throw err

		fileList = (f for f in files when /\.png$/.test(f))
		basename = path.basename( srcDir )

		load()


#------------------------------------------------------------
load = () ->
	log("loading..")

	# make new directory
	try
		fs.mkdirSync("#{path.dirname(srcDir)}/#{basename}.HQ")
	catch e
		console.log e

	img = new Image()

	next = (idx) ->
		img.onload = ->

			canvas.width = img.width
			canvas.height = img.height

			ctx.drawImage(img, 0, 0)

			pano = CanvasMatrixCode.decode(canvas, 0, canvas.height - 30, canvas.width, 30)
			pano.filename = filename

			panoList.push( pano )

			if ++idx < fileList.length
				next(idx)
			else 
				compose()

		filename = fileList[idx]
		img.src = "file:///#{srcDir}/#{filename}"

	next(0)

#------------------------------------------------------------
compose = ->
	log("composing..")

	gsvh = new GSVHyperlapse( basename, $('#pv')[0] )
	gsvh.setParameters
		zoom: 4
	gsvh.panoList = panoList

	GSVHyperlapse.onMessage = log
	GSVHyperlapse.onProgress = (loaded, total) ->
		log("composed (#{loaded}/#{total})")

	GSVHyperlapse.onPanoramaLoad =  savePano
	GSVHyperlapse.onComposeComplete = onComplete

	gsvh.compose()


#------------------------------------------------------------
savePano = (idx, pano, data) ->

	$('#pano').append( pano )

#------------------------------------------------------------
onComplete = ->
	null


	


