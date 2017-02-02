WIDTH = 1664
HEIGHT = 832
TAG_HEIGHT = 40


tag = null
glsl = null

x = y = rotation = pitch = null

$canvas = null

$ ->
	$canvas = $('#pano')

	$canvas.on
		'mousemove': onMouseMove

	original = $('#original')[0]
	original.src = "./assets/pano.png"
	original.onload = ->
		if glsl?
			glsl.set('original', original)
			glsl.syncAll()

	tag = document.createElement('canvas')
	tag.width = WIDTH
	tag.height = TAG_HEIGHT

	ctx = tag.getContext('2d')
	ctx.fillStyle = '#0000FF'
	ctx.fillRect(0, 0, WIDTH, TAG_HEIGHT)

	glsl = Glsl
		canvas: $canvas[0]
		fragment: $('#pano-rotation')[0].textContent
		variables:
			rotation: 0.0
			pitch: 0.0
			original: original
			tag: tag

	glsl.setSize(WIDTH, HEIGHT + TAG_HEIGHT)
	glsl.start()

onMouseMove = (e)->
	x = e.pageX / WIDTH
	y = e.pageY / (HEIGHT + TAG_HEIGHT)

	rotation = x * Math.PI * 2
	pitch = (y - 0.5) * Math.PI

	glsl.set('rotation', rotation)
	glsl.set('pitch', pitch)
	glsl.syncAll()