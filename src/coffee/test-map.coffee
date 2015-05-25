

svp = null

$ ->

	options =
		enableCloseButton: false
		imageDateControl: true

	svp = new google.maps.StreetViewPanorama( $('#map')[0], options )