/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
var GSVPANO = GSVPANO || {};

const GL_MAX_WIDTH = 4096;

let tiles = null;

(function() {
	let _zoom = undefined;
	let _panoClient = undefined;
	let _count = undefined;
	let _total = undefined;
	let _heading = undefined;
	let _originHeading = undefined;
	let _originPitch = undefined;
	let _tilesCanvas = undefined;
	let _hqCanvas = undefined;
	let _ctx = undefined;
	let _hqCtx = undefined;
	let _rotFx = undefined;
	let _throwError = undefined;
	let _composeFromTile = undefined;
	let _applyRotFx = undefined;
	const Cls = (GSVPANO.PanoLoader = class PanoLoader {
		static initClass() {
	
			// private variables
			_zoom = null;
			_panoClient = new google.maps.StreetViewService();
			_count = 0;
			_total = 0;
			_heading = 0;
			_originHeading = 0;
			_originPitch = 0;
			_tilesCanvas = document.createElement('canvas');
			_hqCanvas = document.createElement('canvas');
			_ctx = _tilesCanvas.getContext('2d');
			_hqCtx = _hqCanvas.getContext('2d');
			_rotFx = null;
	
			
			// private Method
			_throwError = function(message) {
				if (this.onError != null) {
					return this.onError(message);
				} else {
					return console.error(message);
				}
			};
	
			_composeFromTile = function(x, y, texture) {
				_ctx.drawImage(texture, x * 512, y * 512);
				_count++;
			
				const p = Math.round((_count * 100) / _total);
				this.onProgress(p);
			
				if (_count === _total) {
					_applyRotFx.call(this);
					return this.onPanoramaLoad();
				}
			};
	
			_applyRotFx = function() {
	
				_rotFx.set('heading', (_originHeading - _heading).toRad());
				_rotFx.set('pitch', _originPitch.toRad());
	
				if ((this.width < GL_MAX_WIDTH) && (this.height < GL_MAX_WIDTH)) {
					// normal
					_rotFx.setSize(this.width, this.height);
					_rotFx.set('size', [this.width, this.height]);
					_rotFx.set('offset', [0.0, 0.0]);
					_rotFx.syncAll();
					_rotFx.render();
	
					return this.canvas = _rotFx.canvas;
	
				} else {
					// tiling
					let y;
					let asc, end;
					_hqCanvas.width = this.width;
					_hqCanvas.height = this.height;
	
					const w = Math.ceil(this.width / GL_MAX_WIDTH);
					const h = Math.ceil(this.height / GL_MAX_WIDTH);
					let x = (y = 0);
	
					const glw = Math.min(this.width, GL_MAX_WIDTH);
					const glh = Math.min(this.height, GL_MAX_WIDTH);
				
					_rotFx.setSize(glw, glh);
					_rotFx.set('size', [this.width, this.height]);
	
					for (y = 0, end = h-1, asc = 0 <= end; asc ? y <= end : y >= end; asc ? y++ : y--) {
						var asc1, end1;
						for (x = 0, end1 = w-1, asc1 = 0 <= end1; asc1 ? x <= end1 : x >= end1; asc1 ? x++ : x--) {
							_rotFx.set('offset', [x * GL_MAX_WIDTH, y * GL_MAX_WIDTH]);
							_rotFx.syncAll();
							_rotFx.render();
	
							_hqCtx.drawImage(_rotFx.canvas,
								x * GL_MAX_WIDTH,
								this.height - ((y+1) * glh));
						}
					}
	
					return this.canvas = _hqCanvas;
				}
			};
		}

		constructor(parameters) {
			parameters = parameters != null ? parameters : {};

			_rotFx = Glsl({
				canvas: document.createElement('canvas'),
				fragment: document.getElementById("pano-rotation").textContent,
				variables: {
					heading:  0.0,
					pitch: 0.0,
					original: _tilesCanvas,
					size: [0.0, 0.0],
					offset: [0.0, 0.0]
				}});

			// event
			this.onError = null;
			this.onProgress = function() {};
			this.onSizeChange = function() {};
			this.onPanoramaLoad = function() {};

			this.setZoom( parameters.zoom != null ? parameters.zoom : 2 );

			this.c2 = _tilesCanvas;

			$('[name=width], [name=height]').on('change', function() {
				_rotFx.setSize( parseInt($('[name=width]').val()), parseInt($('[name=height]').val()) );
				_rotFx.syncAll();
				return _rotFx.render();
			});
		}


		// Public Method
		composePanorama(panoId, heading) {
		
			_heading = heading != null ? heading : 0;
	
			this.onProgress(0);

			return _panoClient.getPanoramaById(panoId, (data, status) => {
				let y;
				if (status !== google.maps.StreetViewStatus.OK) {
					_throwError("Cound not retrieve panorama for the following reason: wrong pano id");
					return;
				}

				({ tiles } = data);

				_originHeading = tiles.originHeading;
				_originPitch   = tiles.originPitch;

				const w = Math.ceil(this.width / 512);
				const h = Math.ceil(this.height / 512);

				let x = (y = 0);
				let url = null;

				_count = 0;
				_total = w * h;

				return (() => {
					let asc, end;
					const result = [];
					for (y = 0, end = h-1, asc = 0 <= end; asc ? y <= end : y >= end; asc ? y++ : y--) {
						result.push((() => {
							let asc1, end1;
							const result1 = [];
							for (x = 0, end1 = w-1, asc1 = 0 <= end1; asc1 ? x <= end1 : x >= end1; asc1 ? x++ : x--) {
								url = `https://cbks0.googleapis.com/cbk?output=tile&zoom=${_zoom}&x=${x}&y=${y}&panoid=${panoId}&${Date.now()}`;

								result1.push(((x, y) => {
									const img = new Image();
									img.onload = () => {
										return _composeFromTile.call(this, x, y, img);
									};
									img.crossOrigin = "";
									return img.src = url;
								})(x, y));
							}
							return result1;
						})());
					}
					return result;
				})();
			});
		}
	
		setZoom( z ) {
			_zoom = z;
		
			this.width = 416 * Math.pow(2, _zoom);
			this.height = (416 * Math.pow(2, _zoom - 1));

			_tilesCanvas.width = this.width;
			_tilesCanvas.height = this.height;
			_ctx.translate( _tilesCanvas.width, 0);
			_ctx.scale(-1, 1);

			_rotFx.setSize(this.width, this.height);

			return this.onSizeChange();
		}
	});
	Cls.initClass();
	return Cls;
})();



		

