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

ss = new google.maps.StreetViewService()

log = (str) ->
	$console.append("#{str}\n")
	$console.scrollTop = $console.scrollHeight

$ ->
	$console = $('#console')
	$progPano = $('#prog-pano')
	$progSeq = $('#prog-seq')
	$statPano = $('#stat-pano')
	$statSeq = $('#stat-seq')

	sisyphus = $('#replace-proxy').sisyphus()

	$('#decode').on 'click', decode

	$('[name=file]').on 'change', ->
		$('[name=source]')
			.val( $('[name=file]').val() )
		sisyphus.saveAllData()

	gsvp = new GSVPANO.PanoLoader
		zoom: parseInt( $('[name=zoom]').val() )

	gsvp.onProgress = (p) ->
		$statPano.html("#{p}%")
		$progPano.val( p )



#------------------------------------------------------------
decode = ->
	srcDir = $('[name=source]').val()

	if srcDir == ""
		alert "please select source directory"
		return

	files = fs.readdirSync(srcDir)

	fileList = (f for f in files when /\.png$/.test(f))
	basename = path.basename( srcDir )

	load()

#------------------------------------------------------------
load = () ->

	startTime = new Date()

	# make new directory
	destDir = "#{path.dirname(srcDir)}/#{basename}.HQ"
	try
		mkdirp.sync(destDir)
		#fs.mkdirSync(destDir)
	catch err
		alert("Destination directory already exists. Please delete '#{destDir}' to continue.")

	img = new Image()

	srcCanvas = $('#src')[0]
	outCanvas = $('#out')[0]

	srcCtx = srcCanvas.getContext('2d')
	outCtx = outCanvas.getContext('2d')

	flipCanvas = document.createElement('canvas')
	flipCtx = flipCanvas.getContext('2d')

	bFlip = false
	bChanged = false

	idx = 0
	filename = ""

	#--------------------
	# 1. load image
	loadImg = () ->
		elapsed = (((new Date()) - startTime) / 1000 / 60)
		$statSeq.html("(#{idx+1}/#{fileList.length}) #{elapsed.toPrecision(2)}min elapsed")
		$progSeq.val( (idx+1) / fileList.length * 100 )


		filename = fileList[idx]
		img.src = "file:///#{srcDir}/#{filename}"

	#--------------------
	# 2. read matrix code and setup gsvh and run compose()
	onLoadImg = ->

		width = img.width
		height = img.height

		srcCanvas.width = img.width
		srcCanvas.height = img.height


		srcCtx.drawImage(img, 0, 0)

		# read heading offset
		headingOffset = 0
		x = 0
		for i in [0..srcCanvas.width-1]
			pixel = srcCtx.getImageData(i, 836, 1, 1).data
			if pixel[0] >= 128
				x = i
				headingOffset = (x / srcCanvas.width) * 360
				break

		# read if fliped
		pt =
			x: ((img.width + x) - 3) % img.width
			y: 843

		pixel = srcCtx.getImageData(pt.x, pt.y, 1, 1).data
		if pixel[0] > 128
			bFlip = true
			x = img.width - (x+12)
			headingOffset = (x / srcCanvas.width) * 360
		else
			bFlip = false

		# fix tag offset
		flipCanvas.width = img.width
		flipCanvas.height = img.height

		if bFlip
			flipCtx.save()
			flipCtx.scale(-1, 1)
			flipCtx.translate(img.width, 0)
			flipCtx.drawImage( img, 0, 0 )
			flipCtx.restore()

		else
			flipCtx.drawImage( img, 0, 0 )


		srcCtx.drawImage(flipCanvas,
			0, height - TAG_HEIGHT, width, TAG_HEIGHT,
			-x, height - TAG_HEIGHT, width, TAG_HEIGHT)
		srcCtx.drawImage(flipCanvas,
			0, height - TAG_HEIGHT, width, TAG_HEIGHT,
			-x + width, height - TAG_HEIGHT, width, TAG_HEIGHT)

		# decode pano matrix code
		pano = CanvasMatrixCode.decode(
			srcCanvas,
			0,
			srcCanvas.height - TAG_HEIGHT + 10,
			1664, TAG_HEIGHT - 10)

		if pano == null
			dest = "#{destDir}/#{filename}"
			saveCanvas( srcCanvas, dest )

			setTimeout ->
				if ++idx < fileList.length
					loadImg()
				else
					onComplete()
			, 1
			return

		# check if the pano id is valid
		ss.getPanoramaById pano.id, (data, status) ->

			if status == google.maps.StreetViewStatus.OK 
				# generate pano
				bChanged = false
				gsvp.composePanorama( pano.id, pano.heading + headingOffset )
			else
				console.log "invalid pano id: #{pano.id}"
				bChanged = true

				result = /([\-0-9.]+), ([\-0-9.]+)/.exec(pano.latLng)
				lat = result[1]
				lng = result[2]
				latLng = new google.maps.LatLng(lat, lng)

				# search nearest pano
				radius = 1

				searchNearestPano = ->
					ss.getPanoramaByLocation latLng, radius, (data, status) ->
						if status == google.maps.StreetViewStatus.OK
							id = data.location.pano
							console.log "nearest pano: #{pano.id} -> #{id}, radius: #{radius}"
							gsvp.composePanorama( id, pano.heading + headingOffset )
						else
							radius++
							setTimeout(searchNearestPano, 500)

				searchNearestPano()

	#--------------------
	# 3. merge with matrix code and save
	savePano = ->
		console.log "save pano"

		outCanvas.width = gsvp.width
		outCanvas.height = (img.height / img.width) * gsvp.width

		# draw
		outCtx.fillStyle = '#000000'
		outCtx.fillRect(0, 0, outCanvas.width, outCanvas.height)


		if bFlip
			console.log "fliped"
			outCtx.save()
			outCtx.scale(-1, 1)
			outCtx.translate(gsvp.canvas.width)

		outCtx.drawImage(gsvp.canvas, 0, 0)

		if bFlip
			outCtx.restore()

		# filp 
		outCtx.save()
		outCtx.translate(0, gsvp.canvas.height * 2)
		outCtx.scale(1, -1)
		outCtx.drawImage(gsvp.canvas, 0, 0)
		outCtx.restore()

		# code
		outCtx.drawImage(
			img,
			0, img.height - TAG_HEIGHT, 		img.width, TAG_HEIGHT,
			0, outCanvas.height - TAG_HEIGHT, 	img.width, TAG_HEIGHT)

		dest = "#{destDir}/#{filename}"
		saveCanvas( outCanvas, dest )

		# changed
		if bChanged
			outCtx.fillStyle = '#ff0000'
			coutCtx.fillRect(outCanvas.width-10, outCanvas.height-10, 10, 10)

		# next
		if ++idx < fileList.length
			loadImg()
		else
			onComplete()

	#--------------------
	# trigger
	img.onload = onLoadImg
	gsvp.onPanoramaLoad = savePano

	loadImg()


#------------------------------------------------------------
onComplete = ->

	setTimeout ->
		fs.renameSync(srcDir, "#{srcDir}.proxy")
		fs.renameSync(destDir, srcDir)

		notifier.notify
			title: "Proxy Replacer"
			message: "All done!"
			sound: true
	, 2000


	


