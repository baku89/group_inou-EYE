API_KEY = "AIzaSyBQ2dzDfyF8Y0Dwe-Q6Jzx4_G62ANrTotQ"
VERSION = '0.1'
SUFFIX = 'pip'
FPS = 24.0


storage = localStorage

settings = {}

map = null
svp = null

urlReg = /!1s(.*)!2e/

list = []

# jq
$status = null
$autosearch = null
$addList = null
$form = null

prevId = ''

cntMarker = null

bLinkUpdate = false
bThrough = false

prevDate = null

service = new google.maps.StreetViewService()

markerList = []


#------------------------------------------------------------
# func

updateSettings = ->
	$form.find('input, textarea').each ->
		type = $(this).attr('type')
		if type == 'checkbox' || type == 'radio'
			settings[this.name] = $(this).is(':checked')
		else
			settings[this.name] = $(this).val()

#------------------------------------------------------------
# init

$ ->
	$form = $('#panoid-parser')
	$status = $('#status')
	$autosearch = $('[name=autosearch')
	$addList = $('[name=addlist]')

	$('#laod').on 'click', load
	$('#clear').on 'click', clear
	$('#undo').on 'click', undo
	$('#set-pano').on 'click', setPano
	$('#export').on 'click', exportJson

	$('input, textarea').on 'change', updateSettings

	$form.sisyphus()

	options = 
		zoom: 16
		mapTypeId: google.maps.MapTypeId.ROADMAP

	map = new google.maps.Map( $('#map')[0], options)

	options =
		enableCloseButton: false
		imageDateControl: true

	svp = new google.maps.StreetViewPanorama( $('#svp')[0], options )

	cntMarker = new google.maps.Marker
		map: map
		icon: 'http://www.googlemapsmarkers.com/v1/009900'

	google.maps.event.addListener(svp, 'links_changed', onLinksChanged)

#------------------------------------------------------------
# action

json = "" 

undo = ->
	if list.length <= 1
		alert("cannot undo anymore")
		return

	markerList[markerList.length-1].setMap(null)
	markerList.pop()
	list.pop()
	
	prevId = if list.length >= 2 then list[list.length-2] else ""

	bThrough = true
	svp.setPano( list[list.length-1] )

	updateSettings()

clear = ->
	console.log "clear"
	list.length = 0
	for m in markerList
		console.log m
		m.setMap(null)
	markerList.length = 0
	prevId = ''
	updateStatus()

exportJson = ->
	console.log "export"
	json = JSON.stringify( list )
	$('#json').val( json )


load = ->
	updateSettings()

	result = urlReg.exec( settings.url )

	if result?
		panoId = result[1]
	else
		panoId = settings.url

	svp.setPano( panoId )


updateStatus = ->
	$status.html("count: #{list.length}<br>duration: #{(list.length / FPS).toPrecision(2)}")

setPano = ->
	newPano = map.getStreetView().getPano()
	svp.setPano( newPano )

#------------------------------------------------------------
# evt

onLinksChanged = ->

	links = svp.getLinks()

	# set links
	if not bLinkUpdate
		links = (l for l in links when l.pano != prevId)
		bLinkUpdate = true
		svp.setLinks( links )
		return

	bLinkUpdate = false

	pos = svp.getPosition()
	id = svp.getPano()

	if bThrough
		map.setCenter( pos )
		cntMarker.setPosition( pos )
		bThrough = false
		return
		
	service.getPanoramaById id, (data, status) =>

		if status != google.maps.StreetViewStatus.OK 
			alert('cannot retrive pano id')
			return

		# check if date is correct
		date = data.imageDate
		if prevDate? && date != prevDate
			if !confirm('imageDate changed. continue?')
				prevDate = date
				svp.setPano(prevId)
				return
		prevDate = date

		map.setCenter( pos )
		cntMarker.setPosition( pos )

		# add marker
		if $addList.prop('checked')

			list.push( id )

			marker = new google.maps.Marker
				position: pos
				map: map
				title: "#{list.length - 1}"

			markerList.push( marker )

			updateStatus()

		# autoserach
		nextId = undefined

		if $autosearch.prop('checked')
			if links.length == 1
				nextId = links[0].pano

		prevId = svp.getPano()

		if nextId?
			setTimeout ->
				svp.setPano( nextId )
			, 50


