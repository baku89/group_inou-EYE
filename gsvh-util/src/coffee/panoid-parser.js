/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const API_KEY = 'AIzaSyBQ2dzDfyF8Y0Dwe-Q6Jzx4_G62ANrTotQ';
const VERSION = '0.1';
const SUFFIX = 'pip';
const FPS = 24.0;

const storage = localStorage;

const settings = {};

let map = null;
let svp = null;

const urlReg = /!1s(.*)!2e/;

const list = [];

// jq
let $status = null;
let $autosearch = null;
let $addList = null;
let $form = null;

let prevId = '';

let cntMarker = null;

let bLinkUpdate = false;
let bThrough = false;

let prevDate = null;

const service = new google.maps.StreetViewService();

const markerList = [];

//------------------------------------------------------------
// func

const updateSettings = () =>
	$form.find('input, textarea').each(function() {
		const type = $(this).attr('type');
		if (type === 'checkbox' || type === 'radio') {
			return (settings[this.name] = $(this).is(':checked'));
		} else {
			return (settings[this.name] = $(this).val());
		}
	});
//------------------------------------------------------------
// init

$(function() {
	$form = $('#panoid-parser');
	$status = $('#status');
	$autosearch = $('[name=autosearch');
	$addList = $('[name=addlist]');

	$('#laod').on('click', load);
	$('#clear').on('click', clear);
	$('#undo').on('click', undo);
	$('#set-pano').on('click', setPano);
	$('#export').on('click', exportJson);

	$('input, textarea').on('change', updateSettings);

	$form.sisyphus();

	let options = {
		zoom: 16,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};

	map = new google.maps.Map($('#map')[0], options);

	options = {
		enableCloseButton: false,
		imageDateControl: true
	};

	svp = new google.maps.StreetViewPanorama($('#svp')[0], options);

	cntMarker = new google.maps.Marker({
		map,
		icon: 'http://www.googlemapsmarkers.com/v1/009900'
	});

	return google.maps.event.addListener(svp, 'links_changed', onLinksChanged);
});

//------------------------------------------------------------
// action

let json = '';

var undo = function() {
	if (list.length <= 1) {
		alert('cannot undo anymore');
		return;
	}

	$autosearch.prop('checked', false);

	markerList[markerList.length - 1].setMap(null);
	markerList.pop();
	list.pop();

	prevId = list.length >= 2 ? list[list.length - 2] : '';

	bThrough = true;
	svp.setPano(list[list.length - 1]);

	return updateSettings();
};

var clear = function() {
	console.log('clear');
	list.length = 0;
	markerList.forEach(m => m.setMap(null));
	markerList.length = 0;
	prevId = '';
	return updateStatus();
};

var exportJson = function() {
	console.log('export');

	const interval = parseInt($('[name=interval]').val());

	// recontrust lists
	const exportList = [];

	for (
		let i = 0, end = list.length, step = interval, asc = step > 0;
		asc ? i < end : i > end;
		i += step
	) {
		exportList.push(list[i]);
	}

	json = JSON.stringify(exportList);
	return $('#json').val(json);
};

var load = function() {
	let panoId;
	updateSettings();

	const result = urlReg.exec(settings.url);

	if (result != null) {
		panoId = result[1];
	} else {
		panoId = settings.url;
	}

	return svp.setPano(panoId);
};

var updateStatus = () =>
	$status.html(
		`count: ${list.length}<br>duration: ${(list.length / FPS).toPrecision(2)}`
	);

var setPano = function() {
	const newPano = map.getStreetView().getPano();
	return svp.setPano(newPano);
};

//------------------------------------------------------------
// evt

var onLinksChanged = function() {
	let links = svp.getLinks();

	console.log(links.map(link => link.pano));

	// set links
	if (!bLinkUpdate) {
		links = Array.from(links).filter(l => l.pano !== prevId);
		bLinkUpdate = true;
		svp.setLinks(links);
		return;
	}

	bLinkUpdate = false;

	const pos = svp.getPosition();
	const id = svp.getPano();

	if (bThrough) {
		map.setCenter(pos);
		cntMarker.setPosition(pos);
		bThrough = false;
		return;
	}

	return service.getPanoramaById(id, (data, status) => {
		if (status !== google.maps.StreetViewStatus.OK) {
			alert('cannot retrive pano id');
			return;
		}

		// check if date is correct
		const date = data.imageDate;
		if (prevDate != null && date !== prevDate) {
			// if !confirm('imageDate changed. continue?')
			// 	prevDate = date
			// 	svp.setPano(prevId)
			// 	return
			$('#console').append(`date changed: ${prevDate} -> ${date}`);
		}
		prevDate = date;

		map.setCenter(pos);
		cntMarker.setPosition(pos);

		// add marker
		if ($addList.prop('checked')) {
			list.push(id);

			const marker = new google.maps.Marker({
				position: pos,
				map,
				title: `${list.length - 1}`
			});

			markerList.push(marker);

			updateStatus();
		}

		// autoserach
		let nextId = undefined;

		if ($autosearch.prop('checked')) {
			const candidates = links.filter(link => list.indexOf(link.pano) === -1);

			if (candidates.length === 1) {
				console.log('auto-jump');
				nextId = candidates[0].pano;
			}
		}

		prevId = svp.getPano();

		if (nextId != null) {
			return setTimeout(() => svp.setPano(nextId), 50);
		}
	});
};
