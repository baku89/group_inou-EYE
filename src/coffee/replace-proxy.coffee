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
tagCtx = null

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


	img = new Image()

	srcCanvas = $('#src')[0]
	outCanvas = $('#out')[0]
	tagCanvas = $('#tag')[0]

	srcCtx = srcCanvas.getContext('2d')
	outCtx = outCanvas.getContext('2d')
	tagCtx = tagCanvas.getContext('2d')

#------------------------------------------------------------
decode = ->
	srcDir = $('[name=source]').val()

	if srcDir == ""
		alert "please select source directory"
		return

	files = fs.readdirSync(srcDir)

	fileList = (f for f in files when /\.png$/.test(f))
	basename = path.basename( srcDir )

	# change gsvp zoom
	zoom = parseInt( $('[name=zoom').val() ) 
	gsvp.setZoom( zoom )

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

	bFlip = false
	bChanged = false

	idx = 0
	filename = ""

	changedList = []

	#--------------------
	# 1. load image
	loadImg = () ->
		elapsed = (((new Date()) - startTime) / 1000 / 60)
		$statSeq.html("(#{idx+1}/#{fileList.length}) #{elapsed.toPrecision(2)}min elapsed")
		$progSeq.val( (idx+1) / fileList.length * 100 )


		filename = fileList[idx]
		img.src = "file://#{srcDir}/#{filename}"

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
		tagCanvas.width = img.width
		tagCanvas.height = TAG_HEIGHT

		if bFlip
			tagCtx.save()
			tagCtx.translate(img.width, 0)
			tagCtx.scale(-1, 1)
			tagCtx.drawImage(img,
				0, height - TAG_HEIGHT, width, TAG_HEIGHT,
				x, 0, width, TAG_HEIGHT)
			tagCtx.drawImage(img,
				0, height - TAG_HEIGHT, width, TAG_HEIGHT,
				x - width, 0, width, TAG_HEIGHT)
			tagCtx.restore()

		else
			tagCtx.drawImage(img,
				0, height - TAG_HEIGHT, width, TAG_HEIGHT,
				-x, 0, width, TAG_HEIGHT)
			tagCtx.drawImage(img,
				0, height - TAG_HEIGHT, width, TAG_HEIGHT,
				-x + width, 0, width, TAG_HEIGHT)

		# decode pano matrix code
		pano = CanvasMatrixCode.decode(
			tagCanvas,
			0,
			10,
			1664, TAG_HEIGHT - 10)

		# if tag is invalid, thru
		if pano == null

			outCanvas.width = gsvp.width
			outCanvas.height = (img.height / img.width) * gsvp.width

			outCtx.fillStyle = '#000000'
			outCtx.fillRect(0, 0, outCanvas.width, outCanvas.height)
			outCtx.drawImage(img, 0, 0, img.width, img.height, 0, 0, outCanvas.width, outCanvas.height)

			saveAndNext()

		console.log pano

		# check if the pano id is valid
		ss.getPanoramaById pano.id, (data, status) ->

			if status == google.maps.StreetViewStatus.OK 
				# generate pano
				bChanged = false
				gsvp.composePanorama( pano.id, pano.heading + headingOffset )

			else
				bChanged = true

				result = /([\-0-9.]+), ([\-0-9.]+)/.exec(pano.latLng)
				latLng = new google.maps.LatLng(result[1], result[2])

				searchNearestPano latLng, (newId, newLatLng, dist)->

					console.log newLatLng, newId, dist

					changedInfo = 
						filename: filename
						oldId: pano.id
						newId: newId
						oldLatLng: latLng.toString()
						newLatLng: newLatLng.toString()
						distance: dist

					changedList.push( changedInfo )
					changedTxt = JSON.stringify( changedList )
					fs.writeFile("#{destDir}/_report.txt", changedTxt)

					console.log "changed:#{filename}, nearest pano: #{pano.id} -> #{newId}, distance from original: #{dist}"
					gsvp.composePanorama( newId, pano.heading + headingOffset )

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
			outCtx.translate(outCanvas.width, 0)
			outCtx.scale(-1, 1)

		outCtx.drawImage(gsvp.canvas, 0, 0)

		if bFlip
			outCtx.restore()

		# code
		outCtx.drawImage(
			img,
			0, img.height - TAG_HEIGHT, 		img.width, TAG_HEIGHT,
			0, outCanvas.height - TAG_HEIGHT, 	img.width, TAG_HEIGHT)

		# changed
		if bChanged
			outCtx.fillStyle = '#ff0000'
			outCtx.fillRect(outCanvas.width-40, outCanvas.height-40, 40, 40)

		saveAndNext()		

	#--------------------
	# 4. next
	saveAndNext = ->
		
		dest = "#{destDir}/#{filename}"
		saveCanvas( outCanvas, dest )

		if ++idx < fileList.length
			loadImg()
		else
			onComplete()

	#--------------------
	# trigger
	img.onload = onLoadImg
	gsvp.onPanoramaLoad = savePano

	loadImg()


# search nearest pano
searchRadius = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100]
searchNearestPano = (origin, callback) ->

	radius = 1

	result = []
	remain = searchRadius.length

	console.log "searchNearestPano: #{origin}"

	for i, r in searchRadius
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


#------------------------------------------------------------
onComplete = ->

	setTimeout ->

		changedTxt = JSON.stringify( changedList )
		fs.writeFile("#{destDir}/_report.txt", changedTxt)

		fs.renameSync(srcDir, "#{srcDir}.proxy")
		fs.renameSync(destDir, srcDir)

		notifier.notify
			title: "Proxy Replacer"
			message: "All done!"
			sound: true
	, 3000


	


