/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const locations = [];

let $ul = null;

const apiKey = "AIzaSyB7BjJ9FNKGq5HRB9VeA73cJPFCXk6RIa8";

const mapReg = /@(.*),(.*),(.*)a,(.*)y,(.*)h,(.*)t\//;

const loader = new GSVPANO.PanoLoader();


//------------------------------------------------------------

$(function() {
	$ul = $('#cards');

	return load();
});

//------------------------------------------------------------
var load = () => $.get('assets/locations.csv', onLoadCSV);

//------------------------------------------------------------
const getSrc = url => "";




//------------------------------------------------------------
var onLoadCSV = function(data) {
	
	const csv = $.csv.toArrays( data );

	let prevTitle = "";

	for (let i in csv) {

		const line = csv[i];
		const url = line[1];
		const match = mapReg.exec( url );

		if (match === null) {
			console.log("error", i, line[0]);
			continue;
		}

		const nl = {
			number: (Number(i)+1),
			title: line[0],
			url: line[1],
			lat: match[1],
			lng: match[2],
			fov: match[4],
			heading: match[5],
			pitch: match[6]
		};

		if (nl.title === "") {
			nl.title = prevTitle;
		}

		const param = {
			size: "640x400",
			sensor: false,
			location: nl.lat + "," + nl.lng,
			heading: nl.heading,
			pitch: nl.pitch - 90,
			fov: nl.fov,//90#Math.max(120, nl.fov + 40)
			key: apiKey
		};

		prevTitle = nl.title;

		nl.latlng = new google.maps.LatLng( nl.lat, nl.lng );

		nl.place = url.indexOf("lace") !== -1 ? "[place]" : "";

		// if url.indexOf("place") == -1
		// 	# street view
		// 	nl.img = "http://maps.googleapis.com/maps/api/streetview?" + $.param( param )

		// else
		// 	# places
		// 	nl.img = ""


		locations.push( nl );
	}

	return makeCard();
};

//------------------------------------------------------------
var makeCard = function() {

	let index = 0;

	var append = function() {
		if (index >= locations.length) {
			return;
		}

		let l = locations[index];

		// create new elements
		const $newElm = $(
			`\
<li id='location-${l.number}' class='card'> \
<a href='${l.url}'><img class='thumb'></a> \
<h1>${l.number}.${l.title} ${l.place} \
</h1> \
</li>\
`
		);
		$ul.append( $newElm );

		// add title
		loader.load(index, l.latlng, function(result) {

			let param;
			console.log(result.index, result);

			l = locations[ result.index ];

			$(`#location-${l.number}`).append(`\
<div class='description'> \
${result.location.description} (${result.imageDate}) \
</div>\
`);

			const $img = 

			(param = {
				size: "640x400",
				sensor: false,
				pano: result.location.pano,
				heading: l.heading,
				pitch: l.pitch - 90,
				fov: 180,//Math.max(l.fov * 2, 0)
				key: apiKey
			});

			const src = `http://maps.googleapis.com/maps/api/streetview?${$.param( param )}`;

			if ((src === "") || (src === undefined)) {
				console.log(result, param);
			}

			return $(`#location-${l.number} img`).attr('src', src);
		});


		// next
		index += 1;
		return setTimeout( append, 200 );
	};


	return append();
};

