Number.prototype.toRad = () -> @ * Math.PI / 180

Number.prototype.toDeg = () -> @ * 180 / Math.PI

API_KEY = "AIzaSyBQ2dzDfyF8Y0Dwe-Q6Jzx4_G62ANrTotQ"

TAG_HEIGHT = 40

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
`function uniqueID(){
	var randam = Math.floor(Math.random()*1000)
	var date = new Date();
	var time = date.getTime();
	return randam + time.toString();
}`

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
	@onError 			= (err) -> alert("error")
	@onMessage			= () -> null
	@onPanoramaLoad 	= () -> null
	@onAnalyzeComplete	= () -> null
	@onProgress			= () -> null
	@onCancel 			= () -> null

	# constructor
	constructor: (args) ->
		@url = args.url
		@name = args.name
		@step = parseFloat( args.step )
		@quality = args.zoom
		@bCancel = false
		@bWaiting = false
		@searchRadius = args.searchRadius
		@uniqueId = uniqueID()

		if args.travelMode == 'driving'
			@travelMode = google.maps.DirectionsTravelMode.DRIVING
		else if args.travelMode == 'walking'
			@travelMode = google.maps.DirectionsTravelMode.WALKING

	setMap: (elm) ->
		@mapElm = elm

	# methods
	cancel: ->
		@bCancel = true
		if !@bWaiting
			_class.onCancel.call @

	trace: (args...) ->
		console.log "[#{@name}]", args...

	traceBold: (str) ->
		console.log "%c[#{@name}] #{str} --------------------", "color:orange;font-weight:bold;"

	createFromDirection: (url)->
		@traceBold "createFromDirection"

		# parse url
		result = _class.dirRegex.exec( url )

		if !result?
			alert "cannot parse url"
			return

		@origin         = new google.maps.LatLng( result[1], result[2] )
		@destination	= new google.maps.LatLng( result[3], result[4] )
		@centroid       = new google.maps.LatLng( result[5], result[6] )
		@zoom           = parseInt(result[7])

		@trace "origin: " + @origin, "destination: " + @destination

		req =
			origin: @origin
			destination: @destination
			travelMode: @travelMode

		# parse waypoint from data
		@waypoints = []
		
		if (result = result[8].match( GSVHyperlapse.dataRegex ))?
			for i, r of result
				m = GSVHyperlapse.dataLatLngRegex.exec( r )
				wp = new google.maps.LatLng( m[2], m[1] )
				@waypoints.push
					location: wp.toString()
					stopover: false

			@trace "num of waypoints:", @waypoints.length
			req.waypoints = @waypoints

		@trace "request:", req

		GSVHyperlapse.dirService.route req, (res, status) =>
			if status == google.maps.DirectionsStatus.OK
				@create(res)
			else
				_class.onMessage.call @, "cannot get route."		

	create: (res)->
		@bWaiting = true
		@traceBold "create"

		# create map
		@map = new google.maps.Map @mapElm,
			center: @centroid
			zoom: @zoom
			mapTypeId: google.maps.MapTypeId.ROADMAP

		@analyze(res)

	# --------------------------------------------------------
	# 2
	analyze: (res) ->
		if @bCancel
			_class.onCancel.call @
			return
		@traceBold "analyze"

		_class.onMessage.call @, "analyzing route.."

		# get points
		@trace res.routes

		@rawPts = []
		route = res.routes[0]
		path = route.overview_path

		# show info
		_class.onMessage.call @, "<strong>path length: #{parseInt(google.maps.geometry.spherical.computeLength(path))}(m), step: #{@step}(m), search radius: #{@searchRadius} (m)</strong>"
		

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

		# fit bound and add polyline
		@map.fitBounds( route.bounds )
		path = new google.maps.Polyline
			path: path
			#geodesic: true
			strokeColor: '#000000'
			strokeOpacity: 1.0
			strokeWeight: 2

		path.setMap( @map )

		# path = new google.maps.Polyline
		# 	path: @rawPts
		# 	#geodesic: true
		# 	strokeColor: '#0000FF'
		# 	strokeOpacity: 1.0
		# 	strokeWeight: 2

		# for i, pt of @rawPts
		# 	marker = new google.maps.Marker
		# 		position: pt
		# 		map: @map
		# 		title: "#{i}"

		_class.onMessage.call @, "num of waypoints: #{@rawPts.length}"

		# next
		@getPanoInfoOnWay()

	# --------------------------------------------------------
	# 3
	getPanoInfoOnWay: ->
		if @bCancel
			_class.onCancel.call @
			return

		# get pano id for each rawPts and merge deplicated panoId
		_class.onMessage.call @, "retriving pano id.."

		idx = 0
		@panoList = []

		onError = (msg) =>
			null
		onLoad = =>
			if @bCancel
				_class.onCancel.call @
				return

			id = @loader.id

			_class.onProgress.call @, idx, @rawPts.length

			if id? && id != prevId
				pano =
					id: id
					rotation: @loader.rotation
					pitch: @loader.pitch
					lat: @loader.location.lat()
					lng: @loader.location.lng()
				@panoList.push( pano )

				marker = new google.maps.Marker
					position: @loader.location
					map: @map
					title: "#{idx}"

				prevId = id

			if ++idx < @rawPts.length
				# next
				@loader.load(@rawPts[ idx ], onLoad)
			else
				_class.onMessage.call @, "total pano id: #{@panoList.length}"
				@bWaiting = false
				# console.log @panoList
				_class.onProgress.call @, idx, @rawPts.length
				_class.onAnalyzeComplete.call @


		# init GSVPano
		@loader = new GSVPANO.PanoLoader
			zoom: @quality
			searchRadius: @searchRadius

		@loader.onError = onError
		@loader.onNoPanoramaData = onError

		@bWaiting = true
		prevId = ''

		@loader.load( @rawPts[ idx ], onLoad )

	# --------------------------------------------------------
	# 4
	compose: ->

		if @panoList.length == 0
			_class.onMessage.call @, "there is no pano id"
			return

		@tagCanvas = document.createElement('canvas')
		@tagCanvas.width = @loader.width
		@tagCanvas.height = TAG_HEIGHT
		@tagCtx	= @tagCanvas.getContext('2d')

		@glsl = Glsl
			canvas: document.createElement('canvas')
			fragment: document.getElementById("pano-rotation").textContent
			variables:
				rotation: 0.0
				pitch: 0.0
				original: @loader.canvas
				tag: @tagCanvas

		@glsl.setSize(@loader.width, @loader.height + TAG_HEIGHT)

		

		_class.onMessage.call @, "composing panorama.. size:#{@loader.width}x#{@loader.height}"

		writeToTag = (name, value, x, y) =>
			@tagCtx.fillStyle = '#ffffff'
			@tagCtx.fillText(value, x + 40, y)
			@tagCtx.fillStyle = '#ff0000'
			@tagCtx.fillText(name, x, y)

		onCompose = =>
			console.log idx

			if @bCancel
				_class.onCancel.call @
				return

			# draw tag
			@tagCtx.fillStyle = '#000000'
			@tagCtx.fillRect(0, 0, @tagCanvas.width, @tagCanvas.height)

			@tagCtx.fillStyle = '#ffffff'
			@tagCtx.font = '12px Arial'

			cursor = 0

			writeToTag("uid",     "#{@uniqueId}", cursor++ * 0xff, 36)							
			writeToTag("lat",     "#{@panoList[idx].lng.toPrecision(17)}", cursor++ * 0xff, 36)	
			writeToTag("lng",     "#{@panoList[idx].lng.toPrecision(17)}", cursor++ * 0xff, 36)	
			writeToTag("hdng", 	  "#{0}", cursor++ * 0xff, 36)								
			writeToTag("pitch",   "#{0}", cursor++ * 0xff, 36)								
			writeToTag("date",    "2014-04", cursor++ * 0xff, 36)	

			cursor = 0
			writeToTag("zoom",     "#{@quality}", cursor++ * 0xff, 18)



			$('body').append( @tagCanvas )

			@glsl.set('rotation', @panoList[idx].rotation)
			@glsl.set('pitch', @panoList[idx].pitch)
			@glsl.syncAll()
			@glsl.render()

			console.log @loader.rotation, @loader.pitch

			_class.onProgress.call @, idx, @panoList.length
			_class.onPanoramaLoad.call @, idx, @glsl.canvas

			if ++idx < @panoList.length
				# next frame
				setTimeout =>
					@loader.composePanorama( @panoList[idx].id )
				, 100
			else
				@bWaiting = false
				@traceBold "complete"
				@trace "total panorama:", @panoList.length

				_class.onProgress.call @, idx, @panoList.length
				_class.onMessage.call @, "complete - total: #{@panoList.length}, duration: #{@panoList.length / 24}"

		@loader.onError = (msg) ->
			console.log msg
		@loader.onPanoramaLoad = onCompose
		@loader.onNoPanoramaData = (status) ->
			console.log status

		idx = 0
		@bWaiting = true

		@loader.composePanorama( @panoList[idx].id )

