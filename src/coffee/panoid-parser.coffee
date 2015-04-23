API_KEY = "AIzaSyBQ2dzDfyF8Y0Dwe-Q6Jzx4_G62ANrTotQ"
VERSION = '0.1'
SUFFIX = 'pip'


storage = localStorage

settings = {}

map = null
svp = null

urlReg = /!1s(.*)!/

#------------------------------------------------------------
# init

restoreSettings = ->
	$elm = $('nav')

	$('[name=url]').val storage['pip-url']

	

updateSettings = ->
	$elm = $('#nav')

	settings.url = $('[name=url]').val()

	for key, val of settings
		storage["#{SUFFIX}-#{key}"] = val

$ ->

	$('#laod-sv').on 'click', loadStreeView
	$('input, textarea').on 'change', updateSettings

	restoreSettings()

	options = 
		zoom: 16
		mapTypeId: google.maps.MapTypeId.ROADMAP

	map = new google.maps.Map( $('#map')[0], options)

	options =
		enableCloseButton: false

	svp = new google.maps.StreetViewPanorama( $('#svp')[0], options )


loadStreeView = ->

	result = urlReg.exec( settings.url )

	console.log result

	# if !(result?)
	# 	alert('this url is not supported')
	# 	return

	panoId = result[1]
	
	svp.setpano( panoId )


	