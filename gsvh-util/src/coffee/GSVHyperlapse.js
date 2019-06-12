/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
Number.prototype.toRad = function() { return (this * Math.PI) / 180; };
Number.prototype.toDeg = function() { return (this * 180) / Math.PI; };

const GSVHyperlapseHeading = {
	BACKWARD: "backward",
	LOOKAT: "lookat",
	NORTH: "north",
	BEGINNING: "begin"
};

const GSVHyperlapseMethod = { 
	DRECTION: 'direction',
	PANOID: 'panoid'
};

const pointOnLine = function(t, a, b) {
	const lat1 = a.lat().toRad();
	const lng1 = a.lng().toRad();

	const lat2 = b.lat().toRad();
	const lng2 = b.lng().toRad();

	const x = lat1 + (t * (lat2 - lat1));
	const y = lng1 + (t * (lng2 - lng1));

	return new google.maps.LatLng(x.toDeg(), y.toDeg());
};

const getFollowedPath = function(m, a, b) {
	const d = google.maps.geometry.spherical.computeDistanceBetween(a, b);

	if ((m < 0) || (d < m)) {
		alert("error getFolowedPath");
	}

	const t = m / d;

	return pointOnLine(t, a, b);
};

// http://hideichi.com/archives/94
const uniqueID = function() {
	const randam = Math.floor(Math.random()*1000);
	const date = new Date();
	const time = date.getTime();
	return randam + time.toString();
};

class GSVHyperlapse {
	static initClass() {
	
		// const
		this.DIST_BETWEEN_PTS = 5;
		this.MAX_PTS = 100;
	
		// static var
		this.dirService = new google.maps.DirectionsService({});
		this.dirRegex = /dir\/([0-9.-]*),([0-9.-]*)\/([0-9.-]*),([0-9.-]*)\/@([0-9.-]*),([0-9.-]*),([0-9]*)z(.*)(\/data=(.*))?$/;
		// @dirRegex = /\/@([0-9.-]*),([0-9.-]*),([0-9]*)z(.*)(\/data=(.*))?$/
		this.dataRegex = /!1d([0-9.-]*)!2d([0-9.-]*)/g;
		this.dataLatLngRegex = /!1d([0-9.-]*)!2d([0-9.-]*)/;
	}

	// event
	static onError(err) { return alert("error"); }
	static onMessage() { return null; }
	static onPanoramaLoad() { return null; }
	static onAnalyzeComplete() { return null; }
	static onComposeComplete() { return null; }
	static onProgress() { return null; }
	static onCancel() { return null; }

	// constructor
	constructor(name, map) {
		this.name = name;

		this.bCancel = false;
		this.bWaiting = false;
		this.uid = uniqueID();
		this.panoList = [];
		this.client = new google.maps.StreetViewService();
		this.gsvp = new GSVPANO.PanoLoader();
		if (map != null) {
			this.map = new google.maps.Map(map, {
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				zoom: 16
			}
			);
		}
	}

	// methods
	cancel() {
		this.bCancel = true;
		if (!this.bWaiting) {
			return GSVHyperlapse.onCancel.call(this);
		}
	}

	// --------------------------------------------------------
	// class method
	createPanoData(res) {
		return {
			id: res.location.pano,
			rotation: res.tiles.centerHeading,// * Math.PI / 180.0
			pitch: res.tiles.originPitch,// * Math.PI / 180.0
			latLng: res.location.latLng,
			date: res.imageDate
		};
	}

	setParameters(params) {

		this.method 		= params.method;
		this.travelMode 	= params.travelMode;
		this.step 			= parseFloat(params.step);
		this.searchRadius	= parseFloat(params.searchRadius);
		this.headingMode	= params.headingMode;
		this.zoom 			= parseInt(params.zoom);

		this.gsvp.setZoom( this.zoom );

		// check headingMode
		if (this.headingMode === GSVHyperlapseHeading.LOOKAT) {
			const result = /([0-9.]+), ([0-9.]+)/.exec( params.lookat );
			if ((result == null)) {
				alert("lookat latLng cannot be parsed");
				return;
			}
			return this.lookat = new google.maps.LatLng( result[1], result[2] );
		}
	}

	// --------------------------------------------------------
	createFromDirection(originName, destinationName){

		let destination;
		const rawPts = [];
		let routeRes = null;
		let prevId = '';
		this.method = GSVHyperlapseMethod.DIRECTION;
		
		let origin = (destination = null);

		// ===================================
		// 0. retrieve lat lng from place name

		const createRequest = () => {

			let checkRetrieved;
			const geocoder = new google.maps.Geocoder();

			geocoder.geocode({'address': originName}, (results, status) => {
				if (status === google.maps.GeocoderStatus.OK) {
					origin = results[0].geometry.location;

					console.log(results[0].geometry.location.lat);
					window.origin = results;
					return checkRetrieved();
				} else {
					return alert("origin returns ZERO_RESULTS");
				}
			});
			
			geocoder.geocode({'address': destinationName}, (results, status) => {
				if (status === google.maps.GeocoderStatus.OK) {
					destination = results[0].geometry.location;
				} else {
					alert("destination returns ZERO_RESULTS");
				}
				return checkRetrieved();
			});

			return checkRetrieved = () => {
				if ((origin !== null) && (destination !== null)) {
					console.log("Unco");
					return requestRoute();
				}
			};
		};


		// ===================================
		// 1. request route
		var requestRoute = () => {

			// calc bounds
			const bounds = new google.maps.LatLngBounds();

			bounds.extend(origin);
			bounds.extend(destination);

			this.map.fitBounds(bounds);

			console.log(this.travelMode);

			const req = {
				origin,
				destination,
				travelMode: this.travelMode
			};

			// parse waypoint from data
			// waypoints = []
			
			// if (result = result[8].match( GSVHyperlapse.dataRegex ))?
			// 	for i, r of result
			// 		m = GSVHyperlapse.dataLatLngRegex.exec( r )
			// 		wp = new google.maps.LatLng( m[2], m[1] )
			// 		waypoints.push
			// 			location: wp.toString()
			// 			stopover: false

			// 	req.waypoints = waypoints

			return GSVHyperlapse.dirService.route(req, (res, status) => {

				if (status === google.maps.DirectionsStatus.OK) {
					routeRes = res;
					// next
					return subdivideRoute();
				} else {
					return GSVHyperlapse.onMessage.call(this, "cannot get route.");
				}
			});
		};

		// ===================================
		// 2. subdivide route
		var subdivideRoute = () => {

			let b;
			if (this.bCancel) {
				GSVHyperlapse.onCancel.call(this);
				return;
			}

			GSVHyperlapse.onMessage.call(this, "subdividing route..");

			// get points
			const route = routeRes.routes[0];
			const path = route.overview_path;

			// show info
			GSVHyperlapse.onMessage.call(this,
				`path length: ${parseInt(google.maps.geometry.spherical.computeLength(path))}(m), \
step: ${this.step}(m), search radius: ${this.searchRadius} (m)`
			);
			

			let d = 0; // distance between a and b (m)
			let r = 0; // always must be < step
			let m = 0; // current midpoint
			let a = (b = null);

			// retrive to way points
			for (let i = 0, end = path.length-2, asc = 0 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {

				a = path[i];
				b = path[i+1];
				d = google.maps.geometry.spherical.computeDistanceBetween(a, b);

				// offset -r
				m = -r + this.step;

				if (d < m) {
					r += d;
				} else {
					// subdivide
					while (m < d) {
						const pt = getFollowedPath(m, a, b);
						rawPts.push( pt );
						m += this.step;
					}

					r = this.step - (m - d);
				}
			}

			// fit bound and add polyline
			this.map.fitBounds( route.bounds );

			GSVHyperlapse.onMessage.call(this, `number of waypoints: ${rawPts.length}`);

			// next
			return retrivePanoData();
		};

		// ===================================
		// 3. retrive pano data and splice duplicated id
		var retrivePanoData = () => {
			GSVHyperlapse.onMessage.call(this, "retriving pano id..");

			let idx = 0;

			var onLoad = (res, status) => {
				if (this.bCancel) {
					GSVHyperlapse.onCancel.call(this);
					return;
				}

				if (status === google.maps.StreetViewStatus.OK) {


					const pano = this.createPanoData(res);

					if (pano.id !== prevId) {
						this.panoList.push( pano );
						const marker = new google.maps.Marker({
							position: pano.latLng,
							map: this.map,
							title: `${idx}`
						});

						prevId = pano.id;
					}
				}

				GSVHyperlapse.onProgress.call(this, idx, rawPts.length);

				if (++idx < rawPts.length) {
					// next
					return this.client.getPanoramaByLocation(rawPts[idx], this.searchRadius, onLoad);
				} else {
					// end
					this.bWaiting = false;
					GSVHyperlapse.onMessage.call(this, `total pano id: ${this.panoList.length}`);
					GSVHyperlapse.onProgress.call(this, idx, rawPts.length);
					return GSVHyperlapse.onAnalyzeComplete.call(this);
				}
			};

			// init GSVPano
			this.bWaiting = true;
			prevId = '';
			return this.client.getPanoramaByLocation(rawPts[idx], this.searchRadius, onLoad);
		};

		// trigger
		return createRequest();
	}

	// --------------------------------------------------------
	createFromPanoId(list) {

		let idx = 0;

		GSVHyperlapse.onMessage.call(this, "start compose..");
		GSVHyperlapse.onMessage.call(this, `eadingMode:${this.headingMode}`);

		var onLoad = (res, status)=> {
			if (idx === 0) {
				GSVHyperlapse.onMessage.call(this, "analyzing..");	
			}

			if (status === google.maps.StreetViewStatus.OK) {
				if (this.bCancel) {
					GSVHyperlapse.onCancel.call(this);
					return;
				}

				const pano = this.createPanoData( res );
				this.panoList.push( pano );

				if (idx === 0) {
					this.map.setCenter( pano.latLng );
					this.map.setZoom( 13 );
				}

				const marker = new google.maps.Marker({
					position: pano.latLng,
					map: this.map,
					title: `${idx}`
				});

				GSVHyperlapse.onProgress.call(this, idx, list.length);

				if (++idx < list.length) {
					// next
					return this.client.getPanoramaById(list[idx], onLoad);
				} else {
					// end
					this.bWaiting = false;
					GSVHyperlapse.onMessage.call(this, `total pano id: ${this.panoList.length}`);
					GSVHyperlapse.onProgress.call(this, idx, list.length);
					return GSVHyperlapse.onAnalyzeComplete.call(this);
				}
			
			} else {
				return alert(`error on createFromPanoId() : ${status}`);
			}
		};

		// trigger

		this.bWaiting = true;
		return this.client.getPanoramaById(list[idx], onLoad);
	}

	// --------------------------------------------------------
	compose(callback){

		if (this.panoList.length === 0) {
			GSVHyperlapse.onMessage.call(this, "there is no pano id.");
			return;
		}

		GSVHyperlapse.onMessage.call(this, `composing panorama.. size:${this.gsvp.width}x${this.gsvp.height}`);

		if ((this.headingMode === GSVHyperlapseHeading.BACKWARD) || (this.headingMode === GSVHyperlapseHeading.BEGIN)) {
			if (this.panoList.length < 2) {
				alert("pano id's length must be 2 at least");
				return;
			}
		}

		const loadPanorama = () => {
			// calc rotation
			if ((this.panoList[idx].heading == null)) {
				let h = 0;
				if (this.headingMode === GSVHyperlapseHeading.BACKWARD) {
					const i = idx === 0 ? 1 : idx;
					h = google.maps.geometry.spherical.computeHeading(
						this.panoList[i].latLng, this.panoList[i-1].latLng );

				} else if (this.headingMode === GSVHyperlapseHeading.LOOKAT) {
					h = google.maps.geometry.spherical.computeHeading(
						this.panoList[idx].latLng, this.lookat);

				} else if (this.headingMode === GSVHyperlapseHeading.BEGIN) {
					h = google.maps.geometry.spherical.computeHeading(
						this.panoList[1].latLng, this.panoList[0].latLng);
				}

				this.panoList[idx].heading = h;

				return this.gsvp.composePanorama( this.panoList[idx].id, this.panoList[idx].heading);
			}
		};

		const onCompose = () => {

			if (this.bCancel) {
				GSVHyperlapse.onCancel.call(this);
				return;
			}
				
			// event
			GSVHyperlapse.onProgress.call(this, idx, this.panoList.length);
			GSVHyperlapse.onPanoramaLoad.call(this, idx, this.gsvp.canvas, this.panoList[idx]);

			// next
			if (++idx < this.panoList.length) {
				return loadPanorama();
			} else {
				this.bWaiting = false;
				console.log("complete");
				GSVHyperlapse.onProgress.call(this, idx, this.panoList.length);
				GSVHyperlapse.onMessage.call(this, `complete - total: ${this.panoList.length}, duration: ${this.panoList.length / 24}`);
				GSVHyperlapse.onComposeComplete.call(this);
				if (callback != null) {
					return callback();
				}
			}
		};

		// trigger
		this.gsvp.onPanoramaLoad = onCompose;
		this.gsvp.onError = msg => alert(`error onCompose() : ${msg}`);
		this.gsvp.onNoPanoramaData = status => alert(`error onNoPanoramaData() : ${status}`);
	
		var idx = 0;
		this.bWaiting = true;

		return loadPanorama();
	}
}
GSVHyperlapse.initClass();

