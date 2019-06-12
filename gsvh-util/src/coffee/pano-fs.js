/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let pitch, rotation, y;
const WIDTH = 1664;
const HEIGHT = 832;
const TAG_HEIGHT = 40;


let tag = null;
let glsl = null;

let x = (y = (rotation = (pitch = null)));

let $canvas = null;

$(function() {
	$canvas = $('#pano');

	$canvas.on({
		'mousemove': onMouseMove});

	const original = $('#original')[0];
	original.src = "./assets/pano.png";
	original.onload = function() {
		if (glsl != null) {
			glsl.set('original', original);
			return glsl.syncAll();
		}
	};

	tag = document.createElement('canvas');
	tag.width = WIDTH;
	tag.height = TAG_HEIGHT;

	const ctx = tag.getContext('2d');
	ctx.fillStyle = '#0000FF';
	ctx.fillRect(0, 0, WIDTH, TAG_HEIGHT);

	glsl = Glsl({
		canvas: $canvas[0],
		fragment: $('#pano-rotation')[0].textContent,
		variables: {
			rotation: 0.0,
			pitch: 0.0,
			original,
			tag
		}
	});

	glsl.setSize(WIDTH, HEIGHT + TAG_HEIGHT);
	return glsl.start();
});

var onMouseMove = function(e){
	x = e.pageX / WIDTH;
	y = e.pageY / (HEIGHT + TAG_HEIGHT);

	rotation = x * Math.PI * 2;
	pitch = (y - 0.5) * Math.PI;

	glsl.set('rotation', rotation);
	glsl.set('pitch', pitch);
	return glsl.syncAll();
};