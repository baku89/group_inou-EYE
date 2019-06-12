/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CMC_SIZE = 3;

const CanvasMatrixCode = {};

let str = null;
const uint8 = null;

const data = {
	title: 'Hello World',
	value: 123456789
};

let json = JSON.stringify(data);

CanvasMatrixCode.draw = function(canvas, data, x, y, width, height) {
	let _y, v;
	const ctx = canvas.getContext('2d');
	const arrayBuff = CanvasMatrixCode.strToBuff(JSON.stringify(data));
	const buff = new Uint8Array(arrayBuff);
	const col = Math.floor(width / (CMC_SIZE * 8));
	const row = Math.floor(height / CMC_SIZE);
	let u = (v = 0);
	let _x = (_y = 0);

	if (col * row + 1 < buff.length) {
		console.log('[CanvasMatrixCode] destination rect is too small for data.');
		return null;
	}

	return (() => {
		const result = [];
		for (let i in buff) {
			var b = buff[i];
			u = i % col;
			v = Math.floor(i / col);
			result.push(
				(() => {
					const result1 = [];
					for (let j = 0; j <= 7; j++) {
						ctx.fillStyle = b & Math.pow(2, j) ? '#ff0000' : '#00ff00';
						_x = x + (u * 8 + j) * CMC_SIZE;
						_y = y + v * CMC_SIZE;
						result1.push(ctx.fillRect(_x, _y, CMC_SIZE, CMC_SIZE));
					}
					return result1;
				})()
			);
		}
		return result;
	})();
};

CanvasMatrixCode.decode = function(canvas, x, y, width, height) {
	let c, v;
	let asc, end1;
	const ctx = canvas.getContext('2d');

	const col = Math.floor(width / (CMC_SIZE * 8));
	const row = Math.floor(height / CMC_SIZE);
	let u = (v = c = 0);

	const buff = [];
	let end = false;

	for (
		v = 0, end1 = row - 1, asc = 0 <= end1;
		asc ? v <= end1 : v >= end1;
		asc ? v++ : v--
	) {
		var asc1, end2;
		for (
			u = 0, end2 = col - 1, asc1 = 0 <= end2;
			asc1 ? u <= end2 : u >= end2;
			asc1 ? u++ : u--
		) {
			let b = 0;
			for (let j = 0; j <= 7; j++) {
				const _x = Math.floor(x + (u * 8 + j + 0.5) * CMC_SIZE);
				const _y = Math.floor(y + (v + 0.5) * CMC_SIZE);
				c = ctx.getImageData(_x, _y, 1, 1).data;
				if (c[0] > 128) {
					b += Math.pow(2, j);
				} else if (c[1] < 128) {
					end = true;
					break;
				}
			}
			if (end) {
				break;
			}
			buff.push(b);
		}
		if (end) {
			break;
		}
	}

	str = CanvasMatrixCode.buffToStr(buff);
	try {
		json = JSON.parse(str);
	} catch (e) {
		console.log('invalid tag');
		return null;
	}

	return json;
};

CanvasMatrixCode.buffToStr = buff =>
	String.fromCharCode.apply(null, new Uint8Array(buff));

CanvasMatrixCode.strToBuff = function(str) {
	const buff = new Uint8Array(str.length);
	for (
		let i = 0, end = str.length - 1, asc = 0 <= end;
		asc ? i <= end : i >= end;
		asc ? i++ : i--
	) {
		buff[i] = str.charCodeAt(i);
	}
	return buff;
};
