fs = require 'fs'
dom = require 'jsdom'


dest = '../../gsv-dev/b'#process.argv[3]

list = null

fs.readdir dest, (err, files) ->
	if err then throw err
	list = (f for f in files when /\.png$/.test(f))

	init()


#------------------------------------------------------------
init = ->

	dom.env
		"""
		<canvas id="#pano"></canvas>
		"""