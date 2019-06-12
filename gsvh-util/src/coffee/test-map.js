/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */


let svp = null;

$(function() {

	const options = {
		enableCloseButton: false,
		imageDateControl: true
	};

	return svp = new google.maps.StreetViewPanorama( $('#map')[0], options );
});