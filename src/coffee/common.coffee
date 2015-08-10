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

#------------------------------------------------------------
# search nearest pano
searchRadius = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 400, 800]
searchNearestPano = (origin, callback) ->

	radius = 1

	result = []
	remain = searchRadius.length

	console.log "searchNearestPano: #{origin}"

	for r, i in searchRadius
		console.log r
		setTimeout ->
			ss.getPanoramaByLocation origin, r, (data, status) ->
				if status == google.maps.StreetViewStatus.OK
					data =
						id: data.location.pano
						latLng: data.location.latLng
						distance: google.maps.geometry.spherical.computeDistanceBetween(origin, data.location.latLng)

					result.push( data )

				if --remain == 0
					complete()

		, 50 * i

	complete = ->
		
		minDist = 100000000
		pano = null
		latLng = null

		for r in result
			if r.distance < minDist
				minDist = r.distance
				pano = r.id
				latLng = r.latLng

		callback(pano, latLng, minDist)