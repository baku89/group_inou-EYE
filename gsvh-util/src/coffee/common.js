/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const fs 		= require('fs');
const path	= require('path');
const gui 	= require('nw.gui');
const mkdirp 	= require('mkdirp');
const notifier= require('node-notifier');

const TAG_HEIGHT = 40.0;

const API_KEY = "AIzaSyBQ2dzDfyF8Y0Dwe-Q6Jzx4_G62ANrTotQ";

const PROXY_HEIGHT = 832.0;
const V_SCALE = (TAG_HEIGHT + PROXY_HEIGHT) / PROXY_HEIGHT;

//------------------------------------------------------------
// window setup

const win = gui.Window.get();
const nativeMenuBar = new gui.Menu({type: 'menubar'});

try {
	nativeMenuBar.createMacBuiltin('gi-eye');
	win.menu = nativeMenuBar;
} catch (error) {
	const err = error;
	console.log(err.message);
}

//------------------------------------------------------------
const saveCanvas = function(canvas, dest) {
	const base64 = canvas.toDataURL().replace(/^data:image\/\w+;base64,/, "");

	const dir = path.dirname(dest);

	return mkdirp(dir, function(err) {
		if (err) {
			return console.error(err);
		} else {
			return fs.writeFileSync(dest, base64, 'base64');
		}
	});
};

//------------------------------------------------------------
// search nearest pano
const searchRadius = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 400, 800];
const searchNearestPano = function(origin, callback) {

	let complete, r;
	const radius = 1;

	const result = [];
	let remain = searchRadius.length;

	console.log(`searchNearestPano: ${origin}`);

	for (let i = 0; i < searchRadius.length; i++) {
		r = searchRadius[i];
		console.log(r);
		setTimeout(() =>
			ss.getPanoramaByLocation(origin, r, function(data, status) {
				if (status === google.maps.StreetViewStatus.OK) {
					data = {
						id: data.location.pano,
						latLng: data.location.latLng,
						distance: google.maps.geometry.spherical.computeDistanceBetween(origin, data.location.latLng)
					};

					result.push( data );
				}

				if (--remain === 0) {
					return complete();
				}
			})
		

		, 50 * i);
	}

	return complete = function() {
		
		let minDist = 100000000;
		let pano = null;
		let latLng = null;

		for (r of Array.from(result)) {
			if (r.distance < minDist) {
				minDist = r.distance;
				pano = r.id;
				({ latLng } = r);
			}
		}

		return callback(pano, latLng, minDist);
	};
};