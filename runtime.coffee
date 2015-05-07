nc = require 'node-chrome'

opts =
	runtime: "/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome"
	files: "./public"
	port: 8080,
	index: "/index.html"
	width: 1024
	height: 760

nc opts, (websocket, chrome) ->

	chrome.on 'exit', (code) ->
		process.exit(0)