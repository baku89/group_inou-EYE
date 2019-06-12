/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//------------------------------------------------------------
// constants
const MAX_PTS = 100;
const DIST_BETWEEN_PTS = 5;

//------------------------------------------------------------
// variables
const loader = null;
const dirService = new google.maps.DirectionsService({});

// each res
const res = null;

const rawPts = [];
const panoIds = [];
const totalDist = 0;

let canvas = null;

const tasks = [];

const settings = {};

const storage = localStorage;

//------------------------------------------------------------
// functions

const updateSettings = function() {
	$('#gsv-generator').find('input, textarea').each(function() {
		const type = $(this).attr('type');
		if (type === 'checkbox') {
			settings[this.name] = $(this).is(':checked');
		} else if (type === 'radio') {
			if ($(this).is(':checked')) {
				settings[this.name] = $(this).val();
			}
		} else {
			settings[this.name] = $(this).val();
		}
		return true;
	});
};

//------------------------------------------------------------
// on load

let sisyphus = null;

$(function() {
	canvas = document.createElement('canvas');

	$('#create').on('click', create);

	GSVHyperlapse.onMessage = onMessage;
	GSVHyperlapse.onPanoramaLoad = onPanoramaLoad;
	GSVHyperlapse.onProgress = onProgress;
	GSVHyperlapse.onAnalyzeComplete = onAnalyzeComplete;
	GSVHyperlapse.onComposeComplete = onComposeComplete;
	GSVHyperlapse.onCancel = onCancel;

	sisyphus = $('#gsv-generator').sisyphus();

	$('[name=dirFile]').on('change', function() {
		$('[name=dir]').val( $('[name=dirFile]').val() );
		return sisyphus.saveAllData();
	});

	return $('#gsv-generator').find('[data-parent]').each(function() {

		const $this = $(this);
		const $parent = $( $this.attr('data-parent') );
		const name = $parent.attr('name');

		return $(`[name=${name}`).on('change', () => {
			return $(this).toggle( $parent.prop('checked') );
	}).trigger('change');
	});
});

//------------------------------------------------------------
var create = function(e){
	e.preventDefault();

	updateSettings();

	let dirname = `${settings.dir}/${settings.name}`;
	if (fs.existsSync(dirname)) {

		let suffix = 2;
		while (true) {
			dirname = `${settings.dir}/${settings.name}_${suffix}`;
			if (!fs.existsSync(dirname)) {
				settings.name = `${settings.name}_${suffix}`;
				break;
			}
			suffix++;
		}
	}

	mkdirp.sync(dirname);

	let index = tasks.length;

	$('.tasks').append(`\
<li id='task-${index}'> \
<h1><input type='text' name='name' value='${settings.name}'></h1> \
<button class='cancel action' data-index='${index}'>Cancel</button> \
<p>mode: ${settings.method}<br></p> \
<div id='map-${index}' style='width: 48%; height: 0; padding-top: 26%; background:gray; display: inline-block;'></div> \
</li>\
`);

	const hyperlapse = new GSVHyperlapse(settings.name, $(`#map-${index}`)[0]);
	hyperlapse.setParameters(settings);

	if (settings.method === 'direction') {
		hyperlapse.createFromDirection( settings.originName, settings.destinationName );

	} else if (settings.method === 'panoid') {
		const list = $.parseJSON( settings.panoid );
		hyperlapse.createFromPanoId(list);
	}

	$(`#task-${index} .cancel`).on('click', function() {
		index = $(this).attr('data-index');
		return tasks[index].cancel();
	});

	return tasks.push( hyperlapse );
};

//------------------------------------------------------------
var onCancel = function() {
	const index = tasks.indexOf( this );
	const $elm = $(`#task-${index}`);

	const $btn = $('<button>delete</button><br>');

	$btn.on('click', () => $elm.remove());

	return $elm.children('p')
		.append('canceled<br>')
		.append( $btn );
};

//------------------------------------------------------------
var onAnalyzeComplete = function() {
	let txtReport;
	let index = tasks.indexOf( this );
	let $elm = $(`#task-${index}`);
	let $p = $elm.children('p');

	$elm.children('.control').remove();
	this.name = $elm.find('[name=name]').prop('disabled', true).val();
	this.compose();

	// save data
	index = tasks.indexOf( this );
	$elm = $(`#task-${index}`);
	$p = $elm.children('p');

	$p.append('composing..<br>');

	const dir = `${settings.dir}/${this.name}`;

	if (this.method === GSVHyperlapseMethod.DIRECTION) {
		txtReport = `\
method: direction
url: ${this.sourceUrl}
step: ${this.step}
searchRadius: ${this.searchRadius}\
`;
	} else if (this.method = GSVHyperlapseMethod.PANOID) { 
		txtReport = "method: panoid";
	}

	txtReport += `\

headingMode: ${this.headingMode}
lookat: ${this.lookat}
zoom: ${this.zoom}\
`;

	const txtPanoIds = JSON.stringify( (Array.from(this.panoList).map((pano) => pano.id)) );

	return mkdirp(dir, function() {
		fs.writeFile(`${dir}/_report.txt`, txtReport, () => $p.append('report saved<br>'));

		return fs.writeFile(`${dir}/_pano-ids.json`, txtPanoIds, () => $p.append('pano-ids.json saved<br>'));
	});
};

//------------------------------------------------------------
var onComposeComplete = function() {
	const index = tasks.indexOf( this );
	const $elm = $(`#task-${index}`);
	const $p = $elm.children('p');

	const dir = `${settings.dir}/${this.name}`;
	const txtPanoList = JSON.stringify( this.panoList );

	return fs.writeFile(`${dir}/_pano-data.json`, txtPanoList, function() {
		$p.append('pano-data.json saved<br>');

		return notifier.notify({
			title: "GSV Generator",
			message: "All done!",
			sound: true
		});
	});
};

//------------------------------------------------------------
var onProgress = function(loaded, total) {
	const index = tasks.indexOf( this );
	const $elm = $(`#task-${index}`);

	if (loaded < 1) {
		$elm.children('p').append( $('<progress></progress>'));
	}

	return $elm.find("progress").last()
		.attr({
			value: loaded,
			max: total,
			'data-label':  `[${loaded}/${total}]`
	});
};

//------------------------------------------------------------
var onMessage = function(message) {
	const index = tasks.indexOf( this );
	const $elm = $(`#task-${index}`);

	return $elm.children('p').append( message + "<br>" );
};

//------------------------------------------------------------
var onPanoramaLoad = function(idx, pano, data) {
	const index = tasks.indexOf( this );
	const $elm = $(`#task-${index}`);

	canvas.width = pano.width;
	canvas.height = pano.height * V_SCALE;

	const ctx = canvas.getContext('2d');
	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(pano, 0, 0);

	// heading marker
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, pano.height + 3, 12, 3);

	// code
	const tag = {
		uid: this.uid,
		id: data.id,
		heading: data.heading,
		latLng: data.latLng.toString()
	};
	
	CanvasMatrixCode.draw(canvas, tag, 0, pano.height + 10, canvas.width, TAG_HEIGHT - 10);




	$elm.append(canvas);

	const path = `${settings.dir}/${this.name}/${this.name}_${(`000000${idx}`).substr(-6, 6)}.png`;

	return saveCanvas(canvas, path);
};