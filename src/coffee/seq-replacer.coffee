$console = null
$progPano = null
$statPano = null
$progSeq = null
$statSeq = null

srcDir = ""
destDir = ""
fileList = null

gsvh = null

basename = null
sisyphus = null

gsvp = null

startTime = null

changedList = []

ss = new google.maps.StreetViewService()

tagCanvas = tagCtx = null
bFlip = false

img = null

srcCanvas =
outCanvas = 
tagCanvas = null

srcCtx = 
outCtx = 
tagCanvas = null

TAG_WIDTH = 1664

panoJson = {}

$ ->
	$console = $('#console')
	$progPano = $('#prog-pano')
	$progSeq = $('#prog-seq')
	$statPano = $('#stat-pano')
	$statSeq = $('#stat-seq')

	sisyphus = $('#replace-proxy').sisyphus()

	$('#decode').on 'click', start

	$('[name=file]').on 'change', ->
		$('[name=source]')
			.val( $('[name=file]').val() )
		sisyphus.saveAllData()

	gsvp = new GSVPANO.PanoLoader
		zoom: parseInt( $('[name=zoom]').val() )

	gsvp.onProgress = (p) ->
		$statPano.html("#{p}%")
		$progPano.val( p )


	img = new Image()

	# srcCanvas = $('#src')[0]
	srcCanvas = document.createElement('canvas')
	outCanvas = document.createElement('canvas')
	tagCanvas = $('#tag')[0]

	srcCtx = srcCanvas.getContext('2d')
	outCtx = outCanvas.getContext('2d')
	tagCtx = tagCanvas.getContext('2d')

#------------------------------------------------------------
start = ->
	srcDir = $('[name=source]').val()

	if srcDir == ""
		alert "please select source directory"
		return

	files = fs.readdirSync(srcDir)

	fileList = (f for f in files when /.png$/.test(f) && f.substr(0, 4) != "tag_")
	basename = path.basename( srcDir )

	# change gsvp zoom
	zoom = parseInt( $('[name=zoom').val() ) 
	gsvp.setZoom( zoom )

	load()

#------------------------------------------------------------
load = () ->

	startTime = new Date()

	bChanged = false

	idx = 0
	filename = ""

	pano = null

	bFlip = false

	console.log fileList

	#--------------------
	# 1. load image
	loadImg = () ->
		# elapsed = (((new Date()) - startTime) / 1000 / 60)
		# $statSeq.html("(#{idx+1}/#{fileList.length}) #{elapsed.toPrecision(2)}min elapsed")
		# $progSeq.val( (idx+1) / fileList.length * 100 )


		filename = fileList[idx]
		img.src = "file://#{srcDir}/#{filename}"

	#--------------------
	# 2. read matrix code and setup gsvh and run compose()
	onLoadImg = ->

		w = img.width
		h = img.height

		# read heading offset
		srcCanvas.width = img.width
		srcCanvas.height = img.height

		srcCtx.drawImage(img, 0, 0)

		headingOffset = 0
		x = 0
		for i in [0..TAG_WIDTH-1]
			pixel = srcCtx.getImageData(i, h - TAG_HEIGHT + 3, 1, 1).data
			if pixel[0] >= 128
				x = i
				headingOffset = (x / TAG_WIDTH) * 360
				break

		# read if fliped
		pt =
			x: (TAG_WIDTH + x - 3) % TAG_WIDTH
			y: h - TAG_HEIGHT + 10

		console.log pt

		pixel = srcCtx.getImageData(pt.x, pt.y, 1, 1).data
		if pixel[0] > 128
			bFlip = true
			x = TAG_WIDTH - (x+12)
			headingOffset = (x / TAG_WIDTH) * 360
		else
			bFlip = false

		# fix tag offset
		tagCanvas.width = TAG_WIDTH
		tagCanvas.height = TAG_HEIGHT

		if bFlip
			tagCtx.save()
			tagCtx.translate(TAG_WIDTH, 0)
			tagCtx.scale(-1, 1)
			tagCtx.drawImage(img,
				0, h- TAG_HEIGHT, TAG_WIDTH, TAG_HEIGHT,
				x, 0, TAG_WIDTH, TAG_HEIGHT)
			tagCtx.drawImage(img,
				0, h - TAG_HEIGHT, TAG_WIDTH, TAG_HEIGHT,
				x - TAG_WIDTH, 0, TAG_WIDTH, TAG_HEIGHT)
			tagCtx.restore()

		else
			tagCtx.drawImage(img,
				0, h - TAG_HEIGHT, TAG_WIDTH, TAG_HEIGHT,
				-x, 0, TAG_WIDTH, TAG_HEIGHT)
			tagCtx.drawImage(img,
				0, h - TAG_HEIGHT, TAG_WIDTH, TAG_HEIGHT,
				-x + TAG_WIDTH, 0, TAG_WIDTH, TAG_HEIGHT)

		console.log bFlip, x

		# decode pano matrix code
		pano = CanvasMatrixCode.decode(
			tagCanvas,
			0, 10,
			TAG_WIDTH, TAG_HEIGHT - 10)

		# if tag is invalid, thru
		if pano == null

			# alert("unco")

			saveAndNext()
			return

		console.log pano

		latLng = convertLatLng( pano.latLng )
		pano.latLng =
			lat: latLng.lat()
			lng: latLng.lng()


		# check if the pano id is valid
		ss.getPanoramaById pano.id, (data, status) ->

			if status == google.maps.StreetViewStatus.OK 

				pano.changed = false

				saveAndNext()

			else
				bChanged = true

				searchNearestPano latLng, (newId, newLatLng, dist)->

					console.log newLatLng, newId, dist

					pano.changed = true
					# pano.oldId = pano.id
					pano.id = newId
					# pano.oldLatLng = pano.latLng
					pano.latLng =
						lat: newLatLng.lat()
						lng: newLatLng.lng()

					console.log "changed:#{filename}, nearest pano: #{pano.id} -> #{newId}, distance from original: #{dist}"

					saveAndNext()
	

	#--------------------
	# 4. next
	saveAndNext = ->

		panoJson[ filename ] = pano

		# outCanvas.width = TAG_WIDTH
		# outCanvas.height = TAG_HEIGHT

		# outCtx.fillStyle = '#000000'
		# outCtx.fillRect(0, 0, TAG_WIDTH, TAG_HEIGHT)

		# CanvasMatrixCode.draw(outCanvas, pano,
		# 	0, 10, TAG_WIDTH, TAG_HEIGHT - 10
		# 	)
		
		# dest = "#{srcDir}/tag_#{filename}"
		# saveCanvas( outCanvas, dest )

		if ++idx < fileList.length
			loadImg()
		else
			onComplete()

	#--------------------
	# trigger
	img.onload = onLoadImg

	loadImg()

#------------------------------------------------------------
convertLatLng = (latLngStr) ->
	if latLngStr.lat?
		return latLngStr
	else 
		result = /([\-0-9.]+), ([\-0-9.]+)/.exec( latLngStr )
		return new google.maps.LatLng(result[1], result[2])

#------------------------------------------------------------
onComplete = ->

	console.log panoJson

	txt = JSON.stringify( panoJson )
	fs.writeFileSync("#{srcDir}/_pano-list.json", txt)

	notifier.notify
		title: "Proxy Replacer"
		message: "All done!"
		sound: true



	


