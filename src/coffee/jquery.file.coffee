FILE = FILE || {}

FILE.phpDirectory = './file'

FILE.Status =
	OK: 'OK'

FILE.exists = (path, callback) ->
	data =
		path: path

	$.getJSON "#{FILE.phpDirectory}/exists.php", data, (res)->
		if res.status == FILE.Status.OK
			callback( res.result )
		else
			callback( null )

FILE.saveText = (text, path, callback) ->

	$.ajax
		type: 'POST'
		url: "#{FILE.phpDirectory}/saveText.php"
		data:
			path: path
			text: text

		success: (json) ->
			res = $.parseJSON(json)
			if res.status == FILE.Status.OK
				callback( res.result )
			else
				callback( null )

		error: (xmlHttpReq, textStatus, errorThrown) ->
			callback( null )

	return




FILE.saveFrame = (canvas, filename, index, callback) ->

	split = filename.split('.')
	ext = split[ split.length - 1 ].toLowerCase()

	type = ""

	if ext == "png"
		type = "image/png"
	else if ext == "jpg" or  ext == "jpeg"
		type = "image/jpeg"
	else
		callback(null)
		return


	$.ajax
		type: 'POST'
		url: "#{FILE.phpDirectory}/saveFrame.php"
		data:
			name: name
			directory: directory
			index: index
			image: canvas.toDataURL(type)

		success: (json) ->
			res = $.parseJSON( json )
			if res.status == FILE.Status.OK
				callback( res.result )
			else
				callback( null )

		error: (xmlHttpReq, textStatus, errorThrown) ->
			callback( null )

	return
	