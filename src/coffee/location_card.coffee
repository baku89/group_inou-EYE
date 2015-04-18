
locations = []

$ul = null

apiKey = "AIzaSyB7BjJ9FNKGq5HRB9VeA73cJPFCXk6RIa8"

mapReg = /@(.*),(.*),(.*)a,(.*)y,(.*)h,(.*)t\//

loader = new GSVPANO.PanoLoader()


#------------------------------------------------------------

$ ->
	$ul = $('#cards')

	load()

#------------------------------------------------------------
load = ->
	$.get 'assets/locations.csv', onLoadCSV

#------------------------------------------------------------
getSrc = (url) ->
	return ""




#------------------------------------------------------------
onLoadCSV = (data) ->
	
	csv = $.csv.toArrays( data )

	prevTitle = ""

	for i, line of csv

		url = line[1]
		match = mapReg.exec( url )

		if match == null
			console.log "error", i, line[0]
			continue

		nl =
			number: (Number(i)+1)
			title: line[0]
			url: line[1]
			lat: match[1]
			lng: match[2]
			fov: match[4]
			heading: match[5]
			pitch: match[6]

		if nl.title == ""
			nl.title = prevTitle

		param =
			size: "640x400"
			sensor: false
			location: nl.lat + "," + nl.lng
			heading: nl.heading
			pitch: nl.pitch - 90
			fov: nl.fov#90#Math.max(120, nl.fov + 40)
			key: apiKey

		prevTitle = nl.title

		nl.latlng = new google.maps.LatLng( nl.lat, nl.lng )

		nl.place = if url.indexOf("lace") != -1 then "[place]" else ""

		# if url.indexOf("place") == -1
		# 	# street view
		# 	nl.img = "http://maps.googleapis.com/maps/api/streetview?" + $.param( param )

		# else
		# 	# places
		# 	nl.img = ""


		locations.push( nl )

	makeCard()

#------------------------------------------------------------
makeCard = ->

	index = 0

	append = () ->
		if index >= locations.length
			return

		l = locations[index]

		# create new elements
		$newElm = $(
			"
			<li id='location-#{l.number}' class='card'>
				<a href='#{l.url}'><img class='thumb'></a>
				<h1>#{l.number}.#{l.title} #{l.place}
</h1>
			</li>
			"
		)
		$ul.append( $newElm )

		# add title
		loader.load index, l.latlng, (result) ->

			console.log result.index, result

			l = locations[ result.index ]

			$("#location-#{l.number}").append("
				<div class='description'>
					#{result.location.description} (#{result.imageDate})
									</div>
			")

			$img = 

			param =
				size: "640x400"
				sensor: false
				pano: result.location.pano
				heading: l.heading
				pitch: l.pitch - 90
				fov: 180#Math.max(l.fov * 2, 0)
				key: apiKey

			src = "http://maps.googleapis.com/maps/api/streetview?" + $.param( param )

			if src == "" || src == undefined
				console.log result, param

			$("#location-#{l.number} img").attr('src', src)


		# next
		index += 1
		setTimeout( append, 200 )


	append()

