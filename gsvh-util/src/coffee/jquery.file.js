/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
var FILE = FILE || {};

FILE.phpDirectory = './file';

FILE.Status =
	{OK: 'OK'};

FILE.exists = function(path, callback) {
	const data =
		{path};

	return $.getJSON(`${FILE.phpDirectory}/exists.php`, data, function(res){
		if (res.status === FILE.Status.OK) {
			return callback( res.result );
		} else {
			return callback( null );
		}
	});
};

FILE.saveText = function(text, path, callback) {

	$.ajax({
		type: 'POST',
		url: `${FILE.phpDirectory}/saveText.php`,
		data: {
			path,
			text
		},

		success(json) {
			const res = $.parseJSON(json);
			if (res.status === FILE.Status.OK) {
				return callback( res.result );
			} else {
				return callback( null );
			}
		},

		error(xmlHttpReq, textStatus, errorThrown) {
			return callback( null );
		}
	});

};




FILE.saveFrame = function(canvas, filename, index, callback) {

	const split = filename.split('.');
	const ext = split[ split.length - 1 ].toLowerCase();

	let type = "";

	if (ext === "png") {
		type = "image/png";
	} else if ((ext === "jpg") ||  (ext === "jpeg")) {
		type = "image/jpeg";
	} else {
		callback(null);
		return;
	}


	$.ajax({
		type: 'POST',
		url: `${FILE.phpDirectory}/saveFrame.php`,
		data: {
			name,
			directory,
			index,
			image: canvas.toDataURL(type)
		},

		success(json) {
			const res = $.parseJSON( json );
			if (res.status === FILE.Status.OK) {
				return callback( res.result );
			} else {
				return callback( null );
			}
		},

		error(xmlHttpReq, textStatus, errorThrown) {
			return callback( null );
		}
	});

};
	