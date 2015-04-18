

#------------------------------------------------------------


# hyperlapse = null

# lookat  = new google.maps.LatLng(37.81409525128964,-122.4775045005249)

# hyperlapseArgs =
#     zoom: 1
#     use_lookat: true
#     elevation: 5
# 	lookat: lookat

# $ ->
# 	hyperlapse = new Hyperlapse( $('#view')[0], hyperlapseArgs )

# 	hyperlapse.onError  = (e) ->
# 		console.log e

# 	hyperlapse.onRouteComplete = (e) ->
# 	    hyperlapse.load()

# 	hyperlapse.onLoadComplete = (e) ->
# 	    hyperlapse.play()

# 	# Google Maps API stuff here...
# 	directions_service = new google.maps.DirectionsService()

# 	route =
# 	    request:
# 	        origin: new google.maps.LatLng(37.816480000000006,-122.47825,37)
# 	        destination: new google.maps.LatLng(37.81195,-122.47773000000001)
# 	        travelMode: google.maps.DirectionsTravelMode.DRIVING

# 	directions_service.route route.request, (response, status) ->

# 		console.log response

# 	    if (status == google.maps.DirectionsStatus.OK)
# 	        hyperlapse.generate
# 	        	route:response
# 	    else
# 	    	console.log status
# 	    	console.log "unco"
