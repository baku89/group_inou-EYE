fs 		= require 'fs'
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

img = new Image()

panoIds = []

canvas = ctx = null

$ ->
	canvas = $('#pv')[0]
	ctx = canvas.getContext('2d')

	$('#decode').on 'click', decode


#------------------------------------------------------------
decode = ->
	srcDir = $('#source').val()

	if srcDir == ""
		alert "please select source directory"
		return

	fs.readdir srcDir, (err, files) ->
		if err then throw err

		list = (f for f in files when /\.png$/.test(f))

		load(srcDir, list)


#------------------------------------------------------------
load = (dir, list) ->

	next = (idx) ->
		img.onload = ->

			canvas.width = img.width
			canvas.height = img.height

			ctx.drawImage(img, 0, 0)

			pano = CanvasMatrixCode.decode(canvas, 0, canvas.height - 30, canvas.width, 30)

			console.log pano

			if ++idx < list.length
				next(idx)

		img.src = "#{dir}/#{list[idx]}"

	next(0)


