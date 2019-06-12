/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let outCanvas, outCtx, tagCtx;
let $console = null;
let $progPano = null;
let $statPano = null;
let $progSeq = null;
let $statSeq = null;

let srcDir = "";
let destDir = "";
let fileList = null;

const gsvh = null;

let basename = null;
let sisyphus = null;

let gsvp = null;

let startTime = null;

let changedList = [];

const ss = new google.maps.StreetViewService();

let tagCanvas = (tagCtx = null);
let bFlip = false;

let img = null;

let srcCanvas =
(outCanvas =
(tagCanvas = null));

let srcCtx = 
(outCtx = 
(tagCtx = null));

$(function() {
	$console = $('#console');
	$progPano = $('#prog-pano');
	$progSeq = $('#prog-seq');
	$statPano = $('#stat-pano');
	$statSeq = $('#stat-seq');

	sisyphus = $('#replace-proxy').sisyphus();

	$('#decode').on('click', decode);

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

	srcCanvas = $('#src')[0];
	outCanvas = $('#out')[0];
	tagCanvas = $('#tag')[0];

	srcCtx = srcCanvas.getContext('2d');
	outCtx = outCanvas.getContext('2d');
	return tagCtx = tagCanvas.getContext('2d');
});

//------------------------------------------------------------
var decode = function() {
	srcDir = $('[name=source]').val();

	if (srcDir === "") {
		alert("please select source directory");
		return;
	}

	const files = fs.readdirSync(srcDir);

	fileList = ((() => {
		const result = [];
		for (let f of Array.from(files)) { 			if (/\.png$/.test(f)) {
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

	let f;
	startTime = new Date();

	// make new directory
	destDir = `${path.dirname(srcDir)}/${basename}.HQ`;
	try {
		mkdirp.sync(destDir);
		//fs.mkdirSync(destDir)
	} catch (err) {
		alert(`Destination directory already exists. Please delete '${destDir}' to continue.`);
	}

	bFlip = false;
	let bChanged = false;

	let idx = 0;
	let filename = "";

	changedList = [];

	const reportPath = `${destDir}/_report.txt`;
	if (fs.existsSync(reportPath)) {
		changedList = JSON.parse( fs.readFileSync(reportPath) );
	}

	const destFiles = fs.readdirSync(destDir);
	const destFileList = ((() => {
		const result = [];
		for (f of Array.from(destFiles)) { 			if (/\.png$/.test(f)) {
				result.push(f);
			}
		}
		return result;
	})());

	const subFileList = [];

	for (f of Array.from(fileList)) {
		if (!(Array.from(destFileList).includes(f))) {
			subFileList.push( f );
		}
	}

	fileList = subFileList;

	console.log(fileList);

	//--------------------
	// 1. load image
	const loadImg = function() {
		const elapsed = (((new Date()) - startTime) / 1000 / 60);
		$statSeq.html(`(${idx+1}/${fileList.length}) ${elapsed.toPrecision(2)}min elapsed`);
		$progSeq.val( ((idx+1) / fileList.length) * 100 );


		filename = fileList[idx];
		return img.src = `file://${srcDir}/${filename}`;
	};

	//--------------------
	// 2. read matrix code and setup gsvh and run compose()
	const onLoadImg = function() {

		let pixel;
		const { width } = img;
		const { height } = img;

		srcCanvas.width = img.width;
		srcCanvas.height = img.height;

		srcCtx.drawImage(img, 0, 0);

		// read heading offset
		let headingOffset = 0;
		let x = 0;
		for (let i = 0, end = srcCanvas.width-1, asc = 0 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
			pixel = srcCtx.getImageData(i, 836, 1, 1).data;
			if (pixel[0] >= 128) {
				x = i;
				headingOffset = (x / srcCanvas.width) * 360;
				break;
			}
		}

		// read if fliped
		const pt = {
			x: ((img.width + x) - 3) % img.width,
			y: 843
		};

		pixel = srcCtx.getImageData(pt.x, pt.y, 1, 1).data;
		if (pixel[0] > 128) {
			bFlip = true;
			x = img.width - (x+12);
			headingOffset = (x / srcCanvas.width) * 360;
		} else {
			bFlip = false;
		}

		// fix tag offset
		tagCanvas.width = img.width;
		tagCanvas.height = TAG_HEIGHT;

		if (bFlip) {
			tagCtx.save();
			tagCtx.translate(img.width, 0);
			tagCtx.scale(-1, 1);
			tagCtx.drawImage(img,
				0, height - TAG_HEIGHT, width, TAG_HEIGHT,
				x, 0, width, TAG_HEIGHT);
			tagCtx.drawImage(img,
				0, height - TAG_HEIGHT, width, TAG_HEIGHT,
				x - width, 0, width, TAG_HEIGHT);
			tagCtx.restore();

		} else {
			tagCtx.drawImage(img,
				0, height - TAG_HEIGHT, width, TAG_HEIGHT,
				-x, 0, width, TAG_HEIGHT);
			tagCtx.drawImage(img,
				0, height - TAG_HEIGHT, width, TAG_HEIGHT,
				-x + width, 0, width, TAG_HEIGHT);
		}

		// decode pano matrix code
		const pano = CanvasMatrixCode.decode(
			tagCanvas,
			0,
			10,
			1664, TAG_HEIGHT - 10);

		// if tag is invalid, thru
		if (pano === null) {

			outCanvas.width = gsvp.width;
			outCanvas.height = (img.height / img.width) * gsvp.width;

			outCtx.fillStyle = '#000000';
			outCtx.fillRect(0, 0, outCanvas.width, outCanvas.height);
			outCtx.drawImage(img, 0, 0, img.width, img.height, 0, 0, outCanvas.width, outCanvas.height);

			saveAndNext();
		}

		console.log(pano);

		// check if the pano id is valid
		return ss.getPanoramaById(pano.id, function(data, status) {

			if (status === google.maps.StreetViewStatus.OK) { 
				// generate pano
				bChanged = false;
				return gsvp.composePanorama( pano.id, pano.heading + headingOffset );

			} else {
				bChanged = true;

				const result = /([\-0-9.]+), ([\-0-9.]+)/.exec(pano.latLng);
				const latLng = new google.maps.LatLng(result[1], result[2]);

				return searchNearestPano(latLng, function(newId, newLatLng, dist){

					console.log(newLatLng, newId, dist);

					const changedInfo = { 
						filename,
						oldId: pano.id,
						newId,
						oldLatLng: latLng.toString(),
						newLatLng: newLatLng.toString(),
						distance: dist
					};

					changedList.push( changedInfo );
					const changedTxt = JSON.stringify( changedList );
					fs.writeFile(`${destDir}/_report.txt`, changedTxt);

					console.log(`changed:${filename}, nearest pano: ${pano.id} -> ${newId}, distance from original: ${dist}`);
					return gsvp.composePanorama( newId, pano.heading + headingOffset );
				});
			}
		});
	};

	//--------------------
	// 3. merge with matrix code and save
	const savePano = function() {
		console.log("save pano");

		outCanvas.width = gsvp.width;
		outCanvas.height = (img.height / img.width) * gsvp.width;

		// draw
		outCtx.fillStyle = '#000000';
		outCtx.fillRect(0, 0, outCanvas.width, outCanvas.height);

		if (bFlip) {
			console.log("fliped");
			outCtx.save();
			outCtx.translate(outCanvas.width, 0);
			outCtx.scale(-1, 1);
		}

		outCtx.drawImage(gsvp.canvas, 0, 0);

		if (bFlip) {
			outCtx.restore();
		}

		// code
		outCtx.drawImage(
			img,
			0, img.height - TAG_HEIGHT, 		img.width, TAG_HEIGHT,
			0, outCanvas.height - TAG_HEIGHT, 	img.width, TAG_HEIGHT);

		// changed
		if (bChanged) {
			outCtx.fillStyle = '#ff0000';
			outCtx.fillRect(outCanvas.width-40, outCanvas.height-40, 40, 40);
		}

		return saveAndNext();		
	};

	//--------------------
	// 4. next
	var saveAndNext = function() {
		
		const dest = `${destDir}/${filename}`;
		saveCanvas( outCanvas, dest );

		if (++idx < fileList.length) {
			return loadImg();
		} else {
			return onComplete();
		}
	};

	//--------------------
	// trigger
	img.onload = onLoadImg;
	gsvp.onPanoramaLoad = savePano;

	return loadImg();
};


//------------------------------------------------------------
var onComplete = () =>

	setTimeout(function() {

		const changedTxt = JSON.stringify( changedList );
		fs.writeFile(`${destDir}/_report.txt`, changedTxt);

		fs.renameSync(srcDir, `${srcDir}.proxy`);
		fs.renameSync(destDir, srcDir);

		return notifier.notify({
			title: "Proxy Replacer",
			message: "All done!",
			sound: true
		});
	}
	, 3000)
;


	


