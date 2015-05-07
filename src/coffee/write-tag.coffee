

# # addTag = (ctx, name, value, x, y) ->
# # 	ctx.fillStyle = '#ffffff'
# # 	ctx.fillText(value, x + 40, y)
# # 	ctx.fillStyle = '#ff0000'
# # 	ctx.fillText(name, x, y)

# writeTag = (canvas, pano, data, gsvh) ->
# 	ctx = canvas.getContext('2d')

# 	canvas.width = pano.width
# 	canvas.height = pano.height * V_SCALE

# 	ctx.fillStyle = '#000000'
# 	ctx.fillRect(0, 0, canvas.width, canvas.height)

# 	ctx.drawImage(pano, 0, 0)
# 	#ctx.scale(1, -1)
# 	#ctx.drawImage(pano, 0, -pano.height)

# 	# y = canvas.height - TAG_HEIGHT
# 	# cursor = 0
# 	# ctx.font = '24px ocr'
# 	# addTag(ctx, "uid",     "#{gsvh.uid}", cursor++ * 0xff, y + 36)	
# 	# addTag(ctx, "pano",  "#{data.id}", cursor++ * 0xff, y + 36)						
# 	# addTag(ctx, "lat",     "#{data.latLng.lat().toPrecision(17)}", cursor++ * 0xff, y + 36)	
# 	# addTag(ctx, "lng",     "#{data.latLng.lng().toPrecision(17)}", cursor++ * 0xff, y + 36)	
# 	# addTag(ctx, "head",    "#{data.heading.toPrecision(17)}", cursor++ * 0xff, y + 36)
# 	# addTag(ctx, "date",    "#{data.date}", cursor++ * 0xff, y + 36)	

# 	# cursor = 0
# 	# addTag(ctx, "zoom",     "#{gsvh.zoom}", cursor++ * 0xff, y + 18)
# 	# addTag(ctx, "aj_h", 	"#{data.ajustHeading.toPrecision(17)}", cursor++ * 0xff, y + 18)
# 	# addTag(ctx, "aj_p",     "#{data.ajustPitch.toPrecision(17)}", cursor++ * 0xff, y + 18)

# 	# ctx.fillStyle = '#ffffff'
# 	# ctx.fillText("<#{gsvh.uid}><#{data.id}><#{data.heading}>", 4, y + 32)

# 	