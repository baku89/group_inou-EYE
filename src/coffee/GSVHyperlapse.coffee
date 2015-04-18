Number.prototype.toRad = () -> @ * Math.PI / 180

Number.prototype.toDeg = () -> @ * 180 / Math.PI

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



class GSVHyperlapse

	# const
	@API_KEY = "AIzaSyBQ2dzDfyF8Y0Dwe-Q6Jzx4_G62ANrTotQ"
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
	@onError = (err) -> alert("error")
	@onMessage	= () -> null
	@onPanoramaLoad 	= () -> null

	# constructor
	constructor: (args) ->
		@url = args.url
		@name = args.name
		@step = parseFloat( args.step )
		@quality = args.quality
		@bCancel = false

	# methods
	trace: (args...) ->
		console.log "[#{@name}]", args...

	traceBold: (str) ->
		console.log "%c[#{@name}] #{str} --------------------", "color:orange;font-weight:bold;"

	create: ->
		@traceBold "create"

		# parse url
		result = _class.dirRegex.exec( @url )

		if !result?
			alert "unco"
			_class.onMessage.call @, "cannot parse url"
			return

		@origin         = new google.maps.LatLng( result[1], result[2] )
		@destination	= new google.maps.LatLng( result[3], result[4] )
		@centroid       = new google.maps.LatLng( result[5], result[6] )
		@zoom           = result[7]

		@trace "origin: " + @origin, "destination: " + @destination

		req =
			origin: @origin
			destination: @destination
			travelMode: google.maps.DirectionsTravelMode.WALKING #DRIVING


		# parse waypoint from data
		@waypoints = []
		data   = result[8]
		result = data.match( GSVHyperlapse.dataRegex )

		if result?
			for i, r of result
				m = GSVHyperlapse.dataLatLngRegex.exec( r )
				wp = new google.maps.LatLng( m[2], m[1] )
				@waypoints.push
					location: wp.toString()
					stopover: false

			@trace "num of waypoints:", @waypoints.length
			req.waypoints = @waypoints

		@trace "request:", req

		_self = @

		GSVHyperlapse.dirService.route req, (res, status) ->
			if status == google.maps.DirectionsStatus.OK
				_self.analyze(res)
			else
				_class.onMessage.call @, "cannot get route."


	analyze: (res) ->
		@traceBold "analyze"

		_class.onMessage.call @, "analyzing route.."

		# get points
		@trace res.routes

		@rawPts = []
		route = res.routes[0]
		path = route.overview_path
		legs = route.legs

		totalDist = 0
		for i in [0..legs.length-1]
			totalDist += legs[i].distance.value

		d = 0 # distance between a and b (m)
		r = 0 # always must be < step
		m = 0
		a = b = null

		@trace "total distance:", totalDist

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
					@rawPts.push( pt )
					m += @step

				r = @step - (m - d)

		@trace "points:", @rawPts.length
		@traceBold "fetch panoramas"

		# start parse point
		@loader = new GSVPANO.PanoLoader
			zoom: @quality

		@glsl = Glsl
			canvas: document.createElement('canvas')
			fragment: document.getElementById("pano-rotation").textContent
			variables:
				rotation: 0.0
				pitch: 0.0
				original: @loader.canvas

		@glsl.setSize(@loader.width, @loader.height)

		_class.onMessage.call @, "composing panorama.. length:#{@rawPts.length} size:#{@loader.width}x#{@loader.height}"
		
		self = @
		@loader.onError = (msg) ->
			_class.onMessage.call @, "error"

		@loader.onPanoramaLoad = ->
			self.onLoadPanoImage.call self


		@prevId = ""
		@index = 0
		@numPanorama = 0

		@parsePoint()

	# --------------------------------------------------------
	parsePoint: ->

		if @bCancel
			return

		if @index == @rawPts.length
			@handleComplete()
			return
		
		self = @
		@trace @rawPts[@index]
		@loader.load @rawPts[@index], ->
			self.onLoadPanoInfo.call self

	onLoadPanoInfo: ->
		id = @loader.id

		@trace @loader.pitch, @loader.rotation

		if @prevId == id
			@trace @index, " - skipped"
			@index += 1
			@parsePoint()
		else
			@trace @index, id
			@loader.composePanorama( id )

		@prevId = id

	onLoadPanoImage: ->
		@index += 1

		@glsl.set('rotation', @loader.rotation)
		@glsl.set('pitch', @loader.pitch)
		@glsl.syncAll()
		@glsl.render()

		@trace "rotation", @loader.rotation, "pitch", @loader.pitch

		_class.onPanoramaLoad.call @, @glsl.canvas, @index, @rawPts.length

		# next frame
		@numPanorama += 1
		
		self = @
		setTimeout ->
			self.parsePoint()
		, 100

	# --------------------------------------------------------

	handleComplete: ->
		@traceBold "complete"
		@trace "total panorama:", @numPanorama

		_class.onMessage.call @, "complete - total: #{@numPanorama}, duration: #{@numPanorama / 23.976}"










