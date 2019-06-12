/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let outCanvas, outCtx, tagCtx;
let $console = null;
let $progPano = null;
let $statPano = null;
let $progSeq = null;
let $statSeq = null;

let srcDir = "";
const destDir = "";
let fileList = null;

const gsvh = null;

let basename = null;
let sisyphus = null;

let gsvp = null;

let startTime = null;

const changedList = [];

const ss = new google.maps.StreetViewService();

let tagCanvas = (tagCtx = null);
let bFlip = false;

let img = null;

let srcCanvas =
(outCanvas = 
(tagCanvas = null));

let srcCtx = 
(outCtx = 
(tagCanvas = null));

const TAG_WIDTH = 1664;

let panoJson = [];

$(function() {
	$console = $('#console');
	$progPano = $('#prog-pano');
	$progSeq = $('#prog-seq');
	$statPano = $('#stat-pano');
	$statSeq = $('#stat-seq');

	sisyphus = $('#replace-proxy').sisyphus();

	$('#decode').on('click', start);

	$('[name=file]').on('change', function() {
		$('[name=source]')
			.val( $('[name=file]').val() );
		return sisyphus.saveAllData();
	});

	gsvp = new GSVPANO.PanoLoader({
		zoom: parseInt( $('[name=zoom]').val() )});

	gsvp.onProgress = function(p) {
		$statPano.html(`${p}%`);
		return $progPano.val( p );
	};


	img = new Image();

	// srcCanvas = $('#src')[0]
	srcCanvas = document.createElement('canvas');
	outCanvas = document.createElement('canvas');
	tagCanvas = $('#tag')[0];

	srcCtx = srcCanvas.getContext('2d');
	outCtx = outCanvas.getContext('2d');
	return tagCtx = tagCanvas.getContext('2d');
});

//------------------------------------------------------------
var start = function() {
	srcDir = $('[name=source]').val();

	if (srcDir === "") {
		alert("please select source directory");
		return;
	}

	const files = fs.readdirSync(srcDir);

	fileList = ((() => {
		const result = [];
		for (let f of Array.from(files)) { 			if (/.png$/.test(f) && (f.substr(0, 4) !== "tag_")) {
				result.push(f);
			}
		}
		return result;
	})());
	basename = path.basename( srcDir );

	// change gsvp zoom
	const zoom = parseInt( $('[name=zoom').val() ); 
	gsvp.setZoom( zoom );

	return load();
};

//------------------------------------------------------------
var load = function() {

	startTime = new Date();

	let bChanged = false;

	let idx = 0;
	let filename = "";

	let pano = null;

	bFlip = false;

	console.log(fileList);

	//--------------------
	// 1. load image
	const loadImg = function() {
		// elapsed = (((new Date()) - startTime) / 1000 / 60)
		// $statSeq.html("(#{idx+1}/#{fileList.length}) #{elapsed.toPrecision(2)}min elapsed")
		// $progSeq.val( (idx+1) / fileList.length * 100 )


		filename = fileList[idx];
		return img.src = `file://${srcDir}/${filename}`;
	};

	//--------------------
	// 2. read matrix code and setup gsvh and run compose()
	const onLoadImg = function() {

		let pixel;
		const w = img.width;
		const h = img.height;

		// read heading offset
		srcCanvas.width = img.width;
		srcCanvas.height = img.height;

		srcCtx.drawImage(img, 0, 0);

		let headingOffset = 0;
		let x = 0;
		for (let i = 0, end = TAG_WIDTH-1, asc = 0 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
			pixel = srcCtx.getImageData(i, (h - TAG_HEIGHT) + 3, 1, 1).data;
			if (pixel[0] >= 128) {
				x = i;
				headingOffset = (x / TAG_WIDTH) * 360;
				break;
			}
		}

		// read if fliped
		const pt = {
			x: ((TAG_WIDTH + x) - 3) % TAG_WIDTH,
			y: (h - TAG_HEIGHT) + 10
		};

		console.log(pt);

		pixel = srcCtx.getImageData(pt.x, pt.y, 1, 1).data;
		if (pixel[0] > 128) {
			bFlip = true;
			x = TAG_WIDTH - (x+12);
			headingOffset = (x / TAG_WIDTH) * 360;
		} else {
			bFlip = false;
		}

		// fix tag offset
		tagCanvas.width = TAG_WIDTH;
		tagCanvas.height = TAG_HEIGHT;

		if (bFlip) {
			tagCtx.save();
			tagCtx.translate(TAG_WIDTH, 0);
			tagCtx.scale(-1, 1);
			tagCtx.drawImage(img,
				0, h- TAG_HEIGHT, TAG_WIDTH, TAG_HEIGHT,
				x, 0, TAG_WIDTH, TAG_HEIGHT);
			tagCtx.drawImage(img,
				0, h - TAG_HEIGHT, TAG_WIDTH, TAG_HEIGHT,
				x - TAG_WIDTH, 0, TAG_WIDTH, TAG_HEIGHT);
			tagCtx.restore();

		} else {
			tagCtx.drawImage(img,
				0, h - TAG_HEIGHT, TAG_WIDTH, TAG_HEIGHT,
				-x, 0, TAG_WIDTH, TAG_HEIGHT);
			tagCtx.drawImage(img,
				0, h - TAG_HEIGHT, TAG_WIDTH, TAG_HEIGHT,
				-x + TAG_WIDTH, 0, TAG_WIDTH, TAG_HEIGHT);
		}

		console.log(bFlip, x);

		// decode pano matrix code
		pano = CanvasMatrixCode.decode(
			tagCanvas,
			0, 10,
			TAG_WIDTH, TAG_HEIGHT - 10);

		// if tag is invalid, thru
		if (pano === null) {
			pano = {
				id: null,
				lat: 0,
				lng: 0
			};

			saveAndNext();
			return;
		}

		console.log(pano);

		const latLng = convertLatLng( pano.latLng );
		pano.lat = latLng.lat();
		pano.lng = latLng.lng();

		// check if the pano id is valid
		return ss.getPanoramaById(pano.id, function(data, status) {

			if (status === google.maps.StreetViewStatus.OK) { 

				pano.changed = false;

				return saveAndNext();

			} else {
				bChanged = true;

				return searchNearestPano(latLng, function(newId, newLatLng, dist){

					console.log(newLatLng, newId, dist);

					pano.id = newId;
					pano.lat = newLatLng.lat();
					pano.lng = newLatLng.lng();
					console.log(`changed:${filename}, nearest pano: ${pano.id} -> ${newId}, distance from original: ${dist}`);

					return saveAndNext();
				});
			}
		});
	};
	

	//--------------------
	// 4. next
	var saveAndNext = function() {

		console.log(`${idx}---------------------------`);

		const newPano =
			{id: pano.id};

		if (newPano.id != null) {
			newPano.lat = pano.lat;
			newPano.lng =  pano.lng;
		}

		panoJson.push( newPano );

		if (++idx < fileList.length) {
			return loadImg();
		} else {
			return onComplete();
		}
	};

	//--------------------
	// trigger
	return fs.readFile(`${srcDir}/_pano-list.json`, function(err, txt) {
		panoJson = JSON.parse( txt );
		idx = panoJson.length;

		console.log(idx);

		img.onload = onLoadImg;

		return loadImg();
	});
};

//------------------------------------------------------------
var convertLatLng = function(latLngStr) {
	if (latLngStr.lat != null) {
		return latLngStr;
	} else { 
		const result = /([\-0-9.]+), ([\-0-9.]+)/.exec( latLngStr );
		return new google.maps.LatLng(result[1], result[2]);
	}
};

//------------------------------------------------------------
var onComplete = function() {

	console.log(panoJson);

	const txt = JSON.stringify( panoJson );
	fs.writeFileSync(`${srcDir}/_pano-list.json`, txt);

	return notifier.notify({
		title: "Proxy Replacer",
		message: "All done!",
		sound: true
	});
};



	


