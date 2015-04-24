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

FILE.saveCanvasImage = (canvas) ->
	