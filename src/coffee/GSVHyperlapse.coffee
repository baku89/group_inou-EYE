Number.prototype.toRad = () -> @ * Math.PI / 180
Number.prototype.toDeg = () -> @ * 180 / Math.PI

GSVHyperlapseHeading =
	BACKWARD: "backward"
	LOOKAT: "lookat"
	NORTH: "north"
	BEGINNING: "begin"

GSVHyperlapseMethod = 
	DRECTION: 'direction'
	PANOID: 'panoid'

pointOnLine = (t, a, b) ->
	lat1 = a.lat().toRad()
	lng1 = a.lng().toRad()

	lat2 = b.lat().toRad()
	lng2 = b.lng().toRad()

	x = lat1 + t * (lat2 - lat1);
	y = lng1 + t * (lng2 - lng1);

	return new google.maps.LatLng(x.toDeg(), y.toDeg())

getFollowedPath = (m, a, b) ->
	d = google.maps.geometry.spherical.computeDistanceBetween(a, b)

	if m < 0 || d < m
		alert("error getFolowedPath")

	t = m / d

	return pointOnLine(t, a, b)

# http://hideichi.com/archives/94
uniqueID = ->
	randam = Math.floor(Math.random()*1000)
	date = new Date()
	time = date.getTime()
	return randam + time.toString()

class GSVHyperlapse

	# const
	@DIST_BETWEEN_PTS = 5
	@MAX_PTS = 100

	# static var
	@dirService = new google.maps.DirectionsService({})
	@dirRegex = /dir\/([0-9.-]*),([0-9.-]*)\/([0-9.-]*),([0-9.-]*)\/@([0-9.-]*),([0-9.-]*),([0-9]*)z(.*)(\/data=(.*))?$/
	# @dirRegex = /\/@([0-9.-]*),([0-9.-]*),([0-9]*)z(.*)(\/data=(.*))?$/
	@dataRegex = /!1d([0-9.-]*)!2d([0-9.-]*)/g
	@dataLatLngRegex = /!1d([0-9.-]*)!2d([0-9.-]*)/

	# event
	@onError 			= (err) -> alert("error")
	@onMessage			= () -> null
	@onPanoramaLoad 	= () -> null
	@onAnalyzeComplete	= () -> null
	@onComposeComplete  = () -> null
	@onProgress			= () -> null
	@onCancel 			= () -> null

	# constructor
	constructor: (name, map) ->
		@name = name

		@bCancel = false
		@bWaiting = false
		@uid = uniqueID()
		@panoList = []
		@client = new google.maps.StreetViewService()
		@gsvp = new GSVPANO.PanoLoader()
		if map?
			@map = new google.maps.Map map,
				mapTypeId: google.maps.MapTypeId.ROADMAP
				zoom: 16

	# methods
	cancel: ->
		@bCancel = true
		if !@bWaiting
			GSVHyperlapse.onCancel.call @

	# --------------------------------------------------------
	# class method
	createPanoData: (res) ->
		return {
			id: res.location.pano
			rotation: res.tiles.centerHeading# * Math.PI / 180.0
			pitch: res.tiles.originPitch# * Math.PI / 180.0
			latLng: res.location.latLng
			date: res.imageDate
		}

	setParameters: (params) ->

		@method 		= params.method
		@travelMode 	= params.travelMode
		@step 			= parseFloat(params.step)
		@searchRadius	= parseFloat(params.searchRadius)
		@headingMode	= params.headingMode
		@zoom 			= parseInt(params.zoom)

		@gsvp.setZoom( @zoom )

		# check headingMode
		if @headingMode == GSVHyperlapseHeading.LOOKAT
			result = /([0-9.]+), ([0-9.]+)/.exec( params.lookat )
			if !(result?)
				alert("lookat latLng cannot be parsed")
				return
			@lookat = new google.maps.LatLng( result[1], result[2] )

	# --------------------------------------------------------
	createFromDirection: (url)->

		rawPts = []
		routeRes = null
		prevId = ''
		@method = GSVHyperlapseMethod.DIRECTION
		@sourceUrl = url

		# ===================================
		# 1. request route
		requestRoute = =>
			# parse url
			result = GSVHyperlapse.dirRegex.exec( url )

			if !result?
				alert "cannot parse url"
				return

			origin      = new google.maps.LatLng( result[1], result[2] )
			destination	= new google.maps.LatLng( result[3], result[4] )
			center      = new google.maps.LatLng( result[5], result[6] )
			zoom        = parseInt(result[7])

			@map.setZoom( zoom )
			@map.setCenter( center )

			console.log @travelMode

			req =
				origin: origin
				destination: destination
				travelMode: @travelMode

			# parse waypoint from data
			waypoints = []
			
			if (result = result[8].match( GSVHyperlapse.dataRegex ))?
				for i, r of result
					m = GSVHyperlapse.dataLatLngRegex.exec( r )
					wp = new google.maps.LatLng( m[2], m[1] )
					waypoints.push
						location: wp.toString()
						stopover: false

				req.waypoints = waypoints

			GSVHyperlapse.dirService.route req, (res, status) =>

				if status == google.maps.DirectionsStatus.OK
					routeRes = res
					# next
					subdivideRoute()
				else
					GSVHyperlapse.onMessage.call @, "cannot get route."

		# ===================================
		# 2. subdivide route
		subdivideRoute = () =>

			if @bCancel
				GSVHyperlapse.onCancel.call @
				return

			GSVHyperlapse.onMessage.call @, "subdividing route.."

			# get points
			route = routeRes.routes[0]
			path = route.overview_path

			# show info
			GSVHyperlapse.onMessage.call @,
				"path length: #{parseInt(google.maps.geometry.spherical.computeLength(path))}(m), 
				step: #{@step}(m), search radius: #{@searchRadius} (m)"
			

			d = 0 # distance between a and b (m)
			r = 0 # always must be < step
			m = 0 # current midpoint
			a = b = null

			# retrive to way points
			for i in [0..path.length-2]

				a = path[i]
				b = path[i+1]
				d = google.maps.geometry.spherical.computeDistanceBetween(a, b)

				# offset -r
				m = -r + @step

				if d < m
					r += d
				else
					# subdivide
					while m < d
						pt = getFollowedPath(m, a, b)
						rawPts.push( pt )
						m += @step

					r = @step - (m - d)

			# fit bound and add polyline
			@map.fitBounds( route.bounds )

			GSVHyperlapse.onMessage.call @, "number of waypoints: #{rawPts.length}"

			# next
			retrivePanoData()

		# ===================================
		# 3. retrive pano data and splice duplicated id
		retrivePanoData = =>
			GSVHyperlapse.onMessage.call @, "retriving pano id.."

			idx = 0

			onLoad = (res, status) =>
				if @bCancel
					GSVHyperlapse.onCancel.call @
					return

				if status == google.maps.StreetViewStatus.OK


					pano = @createPanoData(res)

					if pano.id != prevId
						@panoList.push( pano )
						marker = new google.maps.Marker
							position: pano.latLng
							map: @map
							title: "#{idx}"

						prevId = pano.id

				GSVHyperlapse.onProgress.call @, idx, rawPts.length

				if ++idx < rawPts.length
					# next
					@client.getPanoramaByLocation(rawPts[idx], @searchRadius, onLoad)
				else
					# end
					@bWaiting = false
					GSVHyperlapse.onMessage.call @, "total pano id: #{@panoList.length}"
					GSVHyperlapse.onProgress.call @, idx, rawPts.length
					GSVHyperlapse.onAnalyzeComplete.call @

			# init GSVPano
			@bWaiting = true
			prevId = ''
			@client.getPanoramaByLocation(rawPts[idx], @searchRadius, onLoad)

		# trigger
		requestRoute()

	# --------------------------------------------------------
	createFromPanoId: (list) ->

		idx = 0

		GSVHyperlapse.onMessage.call @, "start compose.."
		GSVHyperlapse.onMessage.call @, "eadingMode:#{@headingMode}"

		onLoad = (res, status)=>
			if idx == 0
				GSVHyperlapse.onMessage.call @, "analyzing.."	

			if status == google.maps.StreetViewStatus.OK
				if @bCancel
					GSVHyperlapse.onCancel.call @
					return

				pano = @createPanoData( res )
				@panoList.push( pano )

				if idx == 0
					@map.setCenter( pano.latLng )
					@map.setZoom( 13 )

				marker = new google.maps.Marker
					position: pano.latLng
					map: @map
					title: "#{idx}"

				GSVHyperlapse.onProgress.call @, idx, list.length

				if ++idx < list.length
					# next
					@client.getPanoramaById(list[idx], onLoad)
				else
					# end
					@bWaiting = false
					GSVHyperlapse.onMessage.call @, "total pano id: #{@panoList.length}"
					GSVHyperlapse.onProgress.call @, idx, list.length
					GSVHyperlapse.onAnalyzeComplete.call @
			
			else
				alert "error on createFromPanoId() : #{status}"

		# trigger

		@bWaiting = true
		@client.getPanoramaById(list[idx], onLoad)

	# --------------------------------------------------------
	compose: (callback)->

		if @panoList.length == 0
			GSVHyperlapse.onMessage.call @, "there is no pano id."
			return

		GSVHyperlapse.onMessage.call @, "composing panorama.. size:#{@gsvp.width}x#{@gsvp.height}"

		if @headingMode == GSVHyperlapseHeading.BACKWARD || @headingMode == GSVHyperlapseHeading.BEGIN
			if @panoList.length < 2
				alert "pano id's length must be 2 at least"
				return

		loadPanorama = =>
			# calc rotation
			if !(@panoList[idx].heading?)
				h = 0
				if @headingMode == GSVHyperlapseHeading.BACKWARD
					i = if idx == 0 then 1 else idx
					h = google.maps.geometry.spherical.computeHeading(
						@panoList[i].latLng, @panoList[i-1].latLng )

				else if @headingMode == GSVHyperlapseHeading.LOOKAT
					h = google.maps.geometry.spherical.computeHeading(
						@panoList[idx].latLng, @lookat)

				else if @headingMode == GSVHyperlapseHeading.BEGIN
					h = google.maps.geometry.spherical.computeHeading(
						@panoList[1].latLng, @panoList[0].latLng)

				@panoList[idx].heading = h

				@gsvp.composePanorama( @panoList[idx].id, @panoList[idx].heading)

		onCompose = =>

			if @bCancel
				GSVHyperlapse.onCancel.call @
				return
				
			# event
			GSVHyperlapse.onProgress.call @, idx, @panoList.length
			GSVHyperlapse.onPanoramaLoad.call @, idx, @gsvp.canvas, @panoList[idx]

			# next
			if ++idx < @panoList.length
				loadPanorama()
			else
				@bWaiting = false
				console.log "complete"
				GSVHyperlapse.onProgress.call @, idx, @panoList.length
				GSVHyperlapse.onMessage.call @, "complete - total: #{@panoList.length}, duration: #{@panoList.length / 24}"
				GSVHyperlapse.onComposeComplete.call @
				if callback?
					callback()

		# trigger
		@gsvp.onPanoramaLoad = onCompose
		@gsvp.onError = (msg) ->
			alert "error onCompose() : #{msg}"
		@gsvp.onNoPanoramaData = (status) ->
			alert "error onNoPanoramaData() : #{status}"
	
		idx = 0
		@bWaiting = true

		loadPanorama()

