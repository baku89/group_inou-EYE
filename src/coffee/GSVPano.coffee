GSVPANO = GSVPANO || {}

GL_MAX_WIDTH = 4096

tiles = null

class GSVPANO.PanoLoader

	# private variables
	_zoom = null
	_panoClient = new google.maps.StreetViewService()
	_count = 0
	_total = 0
	_heading = 0
	_originHeading = 0
	_originPitch = 0
	_tilesCanvas = document.createElement('canvas')
	_hqCanvas = document.createElement('canvas')
	_ctx = _tilesCanvas.getContext('2d')
	_hqCtx = _hqCanvas.getContext('2d')
	_rotFx = null

	constructor: (parameters) ->
		parameters = parameters ? {}

		_rotFx = Glsl
			canvas: document.createElement('canvas')
			fragment: document.getElementById("pano-rotation").textContent
			variables:
				heading:  0.0
				pitch: 0.0
				original: _tilesCanvas
				size: [0.0, 0.0]
				offset: [0.0, 0.0]

		# event
		@onError = null
		@onProgress = () ->
		@onSizeChange = () ->
		@onPanoramaLoad = () ->

		@setZoom( parameters.zoom ? 2 )

		@c2 = _tilesCanvas

		$('[name=width], [name=height]').on 'change', ->
			_rotFx.setSize( parseInt($('[name=width]').val()), parseInt($('[name=height]').val()) )
			_rotFx.syncAll()
			_rotFx.render()

		
	# private Method
	_throwError = (message) ->
		if this.onError?
			this.onError(message)
		else
			console.error(message)

	_composeFromTile = (x, y, texture) ->
		_ctx.drawImage(texture, x * 512, y * 512)
		_count++
		
		p = Math.round(_count * 100 / _total)
		@onProgress(p)
		
		if _count == _total
			_applyRotFx.call(@)
			@onPanoramaLoad()

	_applyRotFx = ->

		_rotFx.set('heading', (_originHeading - _heading).toRad())
		_rotFx.set('pitch', _originPitch.toRad())

		if @width < GL_MAX_WIDTH && @height < GL_MAX_WIDTH
			# normal
			_rotFx.setSize(@width, @height)
			_rotFx.set('size', [@width, @height])
			_rotFx.set('offset', [0.0, 0.0])
			_rotFx.syncAll()
			_rotFx.render()

			@canvas = _rotFx.canvas

		else
			# tiling
			_hqCanvas.width = @width
			_hqCanvas.height = @height

			w = Math.ceil(@width / GL_MAX_WIDTH)
			h = Math.ceil(@height / GL_MAX_WIDTH)
			x = y = 0

			glw = Math.min(@width, GL_MAX_WIDTH)
			glh = Math.min(@height, GL_MAX_WIDTH)
			
			_rotFx.setSize(glw, glh)
			_rotFx.set('size', [@width, @height])

			for y in [0..h-1]
				for x in [0..w-1]
					_rotFx.set('offset', [x * GL_MAX_WIDTH, y * GL_MAX_WIDTH])
					_rotFx.syncAll()
					_rotFx.render()

					_hqCtx.drawImage(_rotFx.canvas,
						x * GL_MAX_WIDTH,
						@height - (y+1) * glh)

			@canvas = _hqCanvas


	# Public Method
	composePanorama: (panoId, heading) ->
		
		_heading = heading ? 0
	
		@onProgress(0)

		_panoClient.getPanoramaById panoId, (data, status) =>
			if status != google.maps.StreetViewStatus.OK
				_throwError("Cound not retrieve panorama for the following reason: wrong pano id")
				return

			tiles = data.tiles

			_originHeading = tiles.originHeading
			_originPitch   = tiles.originPitch

			w = Math.ceil(@width / 512)
			h = Math.ceil(@height / 512)

			x = y = 0
			url = null

			_count = 0
			_total = w * h

			for y in [0..h-1]
				for x in [0..w-1]
					url = "https://cbks0.googleapis.com/cbk?output=tile&zoom=#{_zoom}&x=#{x}&y=#{y}&panoid=#{panoId}&#{Date.now()}"

					do (x, y) =>
						img = new Image()
						img.onload = =>
							_composeFromTile.call(@, x, y, img)
						img.crossOrigin = ""
						img.src = url
	
	setZoom: ( z ) ->
		_zoom = z
		
		@width = 416 * Math.pow(2, _zoom)
		@height = (416 * Math.pow(2, _zoom - 1))

		_tilesCanvas.width = @width
		_tilesCanvas.height = @height
		_ctx.translate( _tilesCanvas.width, 0)
		_ctx.scale(-1, 1)

		_rotFx.setSize(@width, @height)

		@onSizeChange()



		

