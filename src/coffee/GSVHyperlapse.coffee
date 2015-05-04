Number.prototype.toRad = () -> @ * Math.PI / 180
Number.prototype.toDeg = () -> @ * 180 / Math.PI

TAG_HEIGHT = 40

GSVHyperlapseHeading =
	FORWARD: "forward"
	LOOKAT: "lookat"
	NORTH: "north"


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
	@dirRegex = /dir\/([0-9.-]*),([0-9.-]*)\/([0-9.-]*),([0-9.-]*)\/@([0-9.-]*),([0-9.-]*),([0-9]*)z\/data=(.*)$/
	@dataRegex = /!1d([0-9.-]*)!2d([0-9.-]*)/g
	@dataLatLngRegex = /!1d([0-9.-]*)!2d([0-9.-]*)/

	# loader
	@ldr = new GSVPANO.PanoLoader()
	@ldrStack = []

	_class = @

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
		@uniqueId = uniqueID()
		@panoList = []
		@client = new google.maps.StreetViewService()
		@map = new google.maps.Map map,
			mapTypeId: google.maps.MapTypeId.ROADMAP
			zoom: 16

		@report = {}

	# methods
	cancel: ->
		@bCancel = true
		if !@bWaiting
			_class.onCancel.call @

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


	# --------------------------------------------------------
	createFromDirection: (url, args)->

		travelMode 		= args.travelMode
		step 			= parseFloat(args.step)
		searchRadius	= parseFloat(args.searchRadius)

		rawPts = []
		routeRes = null
		prevId = ''

		@report.settings =
			"""
			method: direction
			url: #{url}
			step: #{step}
			searchRadius: #{searchRadius}
			"""

		# ===================================
		# 1. request route
		requestRoute = =>
			# parse url
			result = _class.dirRegex.exec( url )

			if !result?
				alert "cannot parse url"
				return

			origin      = new google.maps.LatLng( result[1], result[2] )
			destination	= new google.maps.LatLng( result[3], result[4] )
			center      = new google.maps.LatLng( result[5], result[6] )
			zoom        = parseInt(result[7])

			@map.setZoom( zoom )
			@map.setCenter( center )

			req =
				origin: origin
				destination: destination
				travelMode: travelMode

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
					_class.onMessage.call @, "cannot get route."

		# ===================================
		# 2. subdivide route
		subdivideRoute = () =>

			if @bCancel
				_class.onCancel.call @
				return

			_class.onMessage.call @, "requesting route.."
			_class.onMessage.call @, "analyzing route.."

			# get points
			route = routeRes.routes[0]
			path = route.overview_path

			# show info
			_class.onMessage.call @, "path length: #{parseInt(google.maps.geometry.spherical.computeLength(path))}(m), step: #{step}(m), search radius: #{searchRadius} (m)"
			

			console.log path

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
				m = -r + step

				if d < m
					r += d
				else
					# subdivide
					while m < d
						pt = getFollowedPath(m, a, b)
						rawPts.push( pt )
						m += step

					r = step - (m - d)

			# fit bound and add polyline
			@map.fitBounds( route.bounds )
			path = new google.maps.Polyline
				path: path
				geodesic: true
				strokeColor: '#000000'
				strokeOpacity: 1.0
				strokeWeight: 2
			path.setMap( @map )

			_class.onMessage.call @, "num of waypoints: #{rawPts.length}"

			# next
			retrivePanoData()

		# ===================================
		# 3. retrive pano data and splice duplicated id
		retrivePanoData = =>
			_class.onMessage.call @, "retriving pano id.."

			idx = 0

			onLoad = (res, status) =>
				if @bCancel
					_class.onCancel.call @
					return

				if status == google.maps.StreetViewStatus.OK

					pano = @createPanoData( res )

					if pano.id != prevId
						@panoList.push( pano )
						marker = new google.maps.Marker
							position: pano.latLng
							map: @map
							title: "#{idx}"

						prevId = pano.id
						console.log pano.id

				_class.onProgress.call @, idx, rawPts.length

				if ++idx < rawPts.length
					# next
					@client.getPanoramaByLocation(rawPts[idx], searchRadius, onLoad)
				else
					# end
					console.log @panoList
					@bWaiting = false
					_class.onMessage.call @, "total pano id: #{@panoList.length}"
					_class.onProgress.call @, idx, rawPts.length
					_class.onAnalyzeComplete.call @

			# init GSVPano
			@bWaiting = true
			prevId = ''
			@client.getPanoramaByLocation(rawPts[idx], searchRadius, onLoad)

		# trigger
		requestRoute()

	# --------------------------------------------------------
	createFromPanoId: (list) ->

		idx = 0

		@report.settings =
			"""
			method: panoid
			"""

		onLoad = (res, status)=>
			if idx == 0
				_class.onMessage.call @, "analyzing.."	

			if status == google.maps.StreetViewStatus.OK
				if @bCancel
					_class.onCancel.call @
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

				_class.onProgress.call @, idx, list.length

				if ++idx < list.length
					# next
					@client.getPanoramaById(list[idx], onLoad)
				else
					# end
					@bWaiting = false
					_class.onMessage.call @, "total pano id: #{@panoList.length}"
					_class.onProgress.call @, idx, list.length
					_class.onAnalyzeComplete.call @
			
			else
				alert "error on createFromPanoId() : #{status}"

		# trigger

		@bWaiting = true
		@client.getPanoramaById(list[idx], onLoad)

	# --------------------------------------------------------
	compose: (params)->

		if @panoList.length == 0
			_class.onMessage.call @, "there is no pano id"
			return

		zoom = params.zoom ? 2
		headingMode = params.heading ? GSVHyperlapseHeading.NORTH

		# if heading == GSVHyperlapseHeading.LOOKAT
		# 	laurl = params.lookat	

		console.log headingMode, GSVHyperlapseHeading

		# check headingMode
		switch headingMode
			when GSVHyperlapseHeading.FORWARD
				if @panoList.length < 2
					alert("cannot solve forward heading because pano length is less than 2.")
					return

			#when GSVHyperlapseHeading.LOOKAT



		loader = new GSVPANO.PanoLoader
			zoom: zoom

		# add report
		@report.panoIds = JSON.stringify( (pano.id for pano in @panoList) )
		@report.panoList = JSON.stringify( @panoList )

		# setup canvas
		@tagCanvas = document.createElement('canvas')
		@tagCanvas.width = loader.width
		@tagCanvas.height = TAG_HEIGHT
		@tagCtx	= @tagCanvas.getContext('2d')

		@glsl = Glsl
			canvas: document.createElement('canvas')
			fragment: document.getElementById("pano-rotation").textContent
			variables:
				heading:  0.0
				pitch: 0.0
				original: loader.canvas
				tag: @tagCanvas

		@glsl.setSize(loader.width, loader.height + TAG_HEIGHT)

		_class.onMessage.call @, "composing panorama.. size:#{loader.width}x#{loader.height}"

		writeToTag = (name, value, x, y) =>
			@tagCtx.fillStyle = '#ffffff'
			@tagCtx.fillText(value, x + 40, y)
			@tagCtx.fillStyle = '#ff0000'
			@tagCtx.fillText(name, x, y)

		onCompose = =>

			if @bCancel
				_class.onCancel.call @
				return

			# calc rotation
			heading = @panoList[idx].rotation

			switch headingMode
				when GSVHyperlapseHeading.FORWARD
					i = if idx == 0 then 1 else idx
					heading += google.maps.geometry.spherical.computeHeading(
						@panoList[i].latLng, @panoList[i-1].latLng )

					console.log google.maps.geometry.spherical.computeHeading(
						@panoList[i].latLng, @panoList[i-1].latLng )

			# draw tag
			@tagCtx.fillStyle = '#000000'
			@tagCtx.fillRect(0, 0, @tagCanvas.width, @tagCanvas.height)
			@tagCtx.fillStyle = '#ffffff'
			@tagCtx.font = '12px Arial'

			cursor = 0

			writeToTag("uid",     "#{@uniqueId}", cursor++ * 0xff, 36)	
			writeToTag("panoid",  "#{@panoList[idx].id}", cursor++ * 0xff, 36)						
			writeToTag("lat",     "#{@panoList[idx].latLng.lat().toPrecision(17)}", cursor++ * 0xff, 36)	
			writeToTag("lng",     "#{@panoList[idx].latLng.lng().toPrecision(17)}", cursor++ * 0xff, 36)	
			writeToTag("head",    "#{0}", cursor++ * 0xff, 36)							
			writeToTag("date",    "#{@panoList[idx].date}", cursor++ * 0xff, 36)	

			cursor = 0
			writeToTag("zoom",     "#{zoom}", cursor++ * 0xff, 18)
			writeToTag("o_r", 	   "#{@panoList[idx].rotation.toPrecision(17)}", cursor++ * 0xff, 18)
			writeToTag("o_p",    "#{@panoList[idx].pitch.toPrecision(17)}", cursor++ * 0xff, 18)

			# rotate texture
			@glsl.set('heading', heading.toRad())#@panoList[idx].rotation)
			#@glsl.set('pitch', 0)#@panoList[idx].pitch * -1)
			@glsl.syncAll()
			@glsl.render()

			# event
			_class.onProgress.call @, idx, @panoList.length
			_class.onPanoramaLoad.call @, idx, @glsl.canvas

			if ++idx < @panoList.length
				# next frame
				setTimeout =>
					loader.composePanorama( @panoList[idx].id )
				, 100
			else
				@bWaiting = false
				console.log "complete"
				_class.onProgress.call @, idx, @panoList.length
				_class.onMessage.call @, "complete - total: #{@panoList.length}, duration: #{@panoList.length / 24}"
				_class.onComposeComplete.call @

		# trigger
		loader.onPanoramaLoad = onCompose
		loader.onError = (msg) ->
			alert "error onCompose() : #{msg}"
		loader.onNoPanoramaData = (status) ->
			alert "error onNoPanoramaData() : #{status}"
	
		idx = 0
		@bWaiting = true

		loader.composePanorama( @panoList[idx].id )

