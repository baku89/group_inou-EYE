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

prevId = ''

cntMarker = null

bLinkUpdate = false

prevDate = null

service = new google.maps.StreetViewService()



#------------------------------------------------------------
# func

restoreSettings = ->
	$elm = $('nav')

	$('[name=url]').val storage['pip-url']
	$('[name=addlist]').prop('checked', storage['pip-addlist'])
	$('[name=autosearch').prop('checked', storage['pip-autosearch'])


updateSettings = ->
	$elm = $('#nav')

	settings.url = $('[name=url]').val()
	settings.addlist = $('[name=addlist]').prop('checked')
	settings.autosearch = $('[name=autosearch]').prop('checked')

	for key, val of settings
		storage["#{SUFFIX}-#{key}"] = val

	console.log storage

#------------------------------------------------------------
# init

$ ->
	$status = $('#status')
	$autosearch = $('[name=autosearch')
	$addList = $('[name=addlist]')

	$('#laod').on 'click', load
	$('#clear').on 'click', clear
	$('#export').on 'click', exportJson
	$('input, textarea').on 'change', updateSettings

	restoreSettings()

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

clear = ->
	list = []
	prevId = ''
	updateStatus()

exportJson = ->
	json = JSON.stringify( list )
	$('#json').html( json )


load = ->
	updateSettings()

	result = urlReg.exec( settings.url )
	panoId = result[1]
	
	svp.setPano( panoId )


updateStatus = ->
	$status.html("count: #{list.length}<br>duration: #{(list.length / FPS).toPrecision(2)}")


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

	service.getPanoramaById id, (data, status) =>

		if status != google.maps.StreetViewStatus.OK 
			alert('cannot retrive pano id')
			return

		date = data.imageDate

		console.log date

		if prevDate? && date != prevDate
			if !confirm('imageDate changed. continue?')
				prevDate = date
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

			updateStatus()

		# autoserach
		nextId = undefined

		if $autosearch.prop('checked')
			if links.length == 1
				nextId = links[0].pano

		prevId = svp.getPano()

		if nextId?
			svp.setPano( nextId )


