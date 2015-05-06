tesseract = require 'node-tesseract'

options = 
	psm: 6


tesseract.process "#{__dirname}/d.png", options, (err, text) =>
	if err
		console.log err
	else
		console.log text