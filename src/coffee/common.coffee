fs 		= require 'fs'
path	= require 'path'
gui 	= require 'nw.gui'
mkdirp 	= require 'mkdirp'
notifier= require 'node-notifier'

TAG_HEIGHT = 40.0

API_KEY = "AIzaSyBQ2dzDfyF8Y0Dwe-Q6Jzx4_G62ANrTotQ"

PROXY_HEIGHT = 832.0
V_SCALE = (TAG_HEIGHT + PROXY_HEIGHT) / PROXY_HEIGHT

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
saveCanvas = (canvas, dest) ->
	base64 = canvas.toDataURL().replace(/^data:image\/\w+;base64,/, "")

	dir = path.dirname(dest)

	mkdirp dir, (err) ->
		if err
			console.error err
		else
			fs.writeFileSync(dest, base64, 'base64')