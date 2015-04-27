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

prevId = ''

cntMarker = null

# bUndo = false
bLinkUpdate = false



#------------------------------------------------------------
# func

restoreSettings = ->
	$elm = $('nav')

	$('[name=url]').val storage['pip-url']
	$('[name=autosearch').val storage['pip-autosearch']

	

updateSettings = ->
	$elm = $('#nav')
	$autosearch = $('[name=autosearch')

	settings.url = $('[name=url]').val()
	settings.autosearch = $('[name=autosearch]').prop('checked')

	for key, val of settings
		storage["#{SUFFIX}-#{key}"] = val

#------------------------------------------------------------
# init

$ ->
	$status = $('#status')

	$('#laod').on 'click', load
	$('#clear').on 'click', clear
	$('#export').on 'click', exportJson
	$('#undo').on 'click', undo
	$('input, textarea').on 'change', updateSettings

	restoreSettings()

	options = 
		zoom: 16
		mapTypeId: google.maps.MapTypeId.ROADMAP

	map = new google.maps.Map( $('#map')[0], options)

	options =
		enableCloseButton: false

	svp = new google.maps.StreetViewPanorama( $('#svp')[0], options )

	cntMarker = new google.maps.Marker
		map: map
		icon: 'http://www.googlemapsmarkers.com/v1/009900'

	google.maps.event.addListener(svp, 'pano_changed', onChangePanoId)
	google.maps.event.addListener(svp, 'position_changed', onPositionChanged)
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


undo = ->
	null
	# list.pop()
	# svp.setPano( list[ list.length - 1 ] )

	# if $autosearch.prop('checked')
	# 	$autosearch.prop('checked', false)

	# updateStatus()


updateStatus = ->
	$status.html("count: #{list.length}<br>duration: #{(list.length / FPS).toPrecision(2)}")


#------------------------------------------------------------
# evt

onChangePanoId = ->
	return null


onPositionChanged = ->
	return null

onLinksChanged = ->
	
	pos = svp.getPosition()
	id = svp.getPano()
	list.push( id )

	links = svp.getLinks()

	# set links
	if (bLinkUpdate)
		bLinkUpdate = false
	else
		links = (l for l in links when l.pano != prevId)
		bLinkUpdate = true
		svp.setLinks( links )
		return

	# add marker
	marker = new google.maps.Marker
		position: pos
		map: map
		title: "#{list.length - 1}"
	map.setCenter( pos )

	cntMarker.setPosition( pos )

	updateStatus()


	# autoserach
	nextId = undefined

	if $autosearch.prop('checked')
		if links.length == 1
			nextId = links[0].pano

	prevId = svp.getPano()
	# bUndo = false

	if nextId?
		svp.setPano( nextId )


