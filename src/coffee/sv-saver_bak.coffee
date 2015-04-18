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

# loader.onPanoramaLoad = () ->
# 	console.log "finished"
# 	$('body').append( loader.canvas )


# loader.load( new google.maps.LatLng( 42.216188,-75.72657859999998 ), ->
# 	loader.composePanorama( loader.id )
# )

#------------------------------------------------------------
# init

#------------------------------------------------------------
# functions

trace = (args...) ->
	console.log args...
	# str = ""
	# for arg of args
	# 	str += arg + " "
	# str += "\n"
	# $('#console').append( str )

getOriginLatLng = ->
	originLat 	= $('#origin-lat').val()
	originLng 	= $('#origin-lng').val()
	return new google.maps.LatLng(originLat, originLng)

getDestLatLng = ->
	destLat 	= $('#dest-lat').val()
	destLng		= $('#dest-lng').val()
	return new google.maps.LatLng(destLat, destLng)

setOriginLatLng = (latLng) ->
	$('#origin-lat').val( latLng.lat() )
	$('#origin-lng').val( latLng.lng() )

#------------------------------------------------------------
# on load

# initMap = ->
# 	# make map
# 	mapOptions =
# 		zoom: 1
# 		center: getOriginLatLng()
# 		mapTypeId: google.maps.MapTypeId.ROADMAP

# 	google.maps.Map( document.getElementById("map"), mapOptions )

$ ->


	# originMarker = new google.maps.Marker({
	# 	position: getOriginLatLng()
	# 	draggable: true
	# })

	# google.maps.event.addListener(originMarker, 'dragend', (evt) ->
	# 	setOriginLatLng( evt.latLng )
	# )

	loader = new GSVPANO.PanoLoader({
		canvas: $('#panorama')[0]
		})

	loader.setZoom( 3 )

	canvas = $('#panorama')[0]

	$('#analyze').on 'click', generate

#------------------------------------------------------------
generate = ->

	trace "generate----------"

	rawPts = []
	panoIds = []
	totalDist = 0

	route = 
		request:
			origin: getOriginLatLng()
			destination: getDestLatLng()
			travelMode: google.maps.DirectionsTravelMode.DRIVING

	dirService.route route.request, (_res, status) ->
		res = _res
		if (status == google.maps.DirectionsStatus.OK)
			# next
			subdivide()
		else
			trace status
	

#------------------------------------------------------------
subdivide = ->
	trace 'subdivide----------'

	route 	= res.routes[0]
	path 	= route.overview_path
	legs 	= route.legs


	for i in [0..legs.length-1]
		totalDist += legs[i].distance.value

	trace 'totalDist', totalDist
	trace 'path length', path.length

	segLen = totalDist / MAX_PTS
	regDist = DIST_BETWEEN_PTS#Math.max( DIST_BETWEEN_PTS, segLen )

	d = 0
	r = 0
	a = b = null

	for i in [0..path.length-1]

		if i+1 < path.length # beginning ~ destination point - 1

			a = path[i]
			b = path[i+1]
			d = google.maps.geometry.spherical.computeDistanceBetween(a, b)

			if 0 < r < d
				a - pointOnLine(r/d, a, b)
				d = google.maps.geometry.spherical.computeDistanceBetween(a, b)
				rawPts.push( a )

				r = 0

			else if 0 < r && d < r
				r -= d

			if r == 0

				# number of subdividing this path
				segs = Math.floor( d / regDist )

				# add subdivided points to rawPts
				if segs > 0
					for j in [0..segs-1]
						t = j / segs

						if 0 < t || (t+i) == 0 # not start point
							way = pointOnLine(t, a, b)
							rawPts.push( way )

				else
					r = regDist * ( t - (d/regDist) )

		else # destination point
			rawPts.push( path[i] )

	trace 'subdivided points length', rawPts.length

	# next
	loadPanoIds()


#------------------------------------------------------------
loadPanoIds = ->
	trace 'loadPanoIds----------'

	pt = null
	count = 0

	for i in [0..rawPts.length-1]
		panoIds.push( null )
		pt = rawPts[i]

		loader.load i, pt, (result) ->
			#console.log result.index, result.location.pano
			panoIds[ result.index ] =
				location: result.location
				id: result.location.pano
				imageDate: result.imageDate
			if ++count >= rawPts.length
				# next
				mergePanoIds()

#------------------------------------------------------------
mergePanoIds = ->
	trace 'mergePanoIds----------'

	prevId = rawPts[0].id
	mergedPanoIds = []

	mergedPanoIds.push( panoIds[0] )

	for i in [1..panoIds.length-1]
		#trace i, panoIds[i].id, prevId
		if panoIds[i].id != prevId
			mergedPanoIds.push( panoIds[i] )
		prevId = panoIds[i].id

	trace "reduced #{panoIds.length}->#{mergedPanoIds.length}"

	panoIds = mergedPanoIds

	# next
	loadPanorama()

#------------------------------------------------------------
loadPanorama = ->
	trace 'loadPanorama----------'

	max = panoIds.length
	index = 0
	timerId = 0
	TIME_OUT = 2000

	loadEachPanorama = ->
		if index >= max
			alert("finish!")
			return

		trace index, panoIds[index].id

		timerId = setTimeout( failedLoadPanorama, TIME_OUT )
		loader.composePanorama( panoIds[index].id )

	failedLoadPanorama = ->
		trace index, " - time out"
		loadEachPanorama( ++index )
		#setTimeout loadEachPanorama, 10000

	loader.onPanoramaLoad = ->
		# save
		exportCanvas( canvas, 'test', index )

		# queue next frame
		clearTimeout( timerId )
		loadEachPanorama( ++index )

	# load
	loadEachPanorama( 0 )


