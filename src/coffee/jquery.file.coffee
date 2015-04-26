FILE = FILE || {}

FILE.phpDirectory = './file'

FILE.Status =
	OK: 'OK'

FILE.exisits = (path, callback) ->
	data =
		path: path

	$.getJSON "#{FILE.phpDirectory}/exists.php", data, (res)->
		if res.status == FILE.Status.OK
			callback( res.result )
		else
			callback( null )

FILE.saveFrame = (canvas, filename, callback) ->

	$.ajax
		type: 'POST'
		url: "#{FILE.phpDirectory}/saveImageSequence.php"
		data:
			name: name
			directory: directory
			index: index
			image: canvas.toDataURL('image/png')

		success: (json) =>
			res = $.parseJSON( json )
			if res.status == FILE.Status.OK
				callback( res.result )
			else
				callback( null )
	