TAG_HEIGHT = 40.0
PROXY_HEIGHT = 832.0
V_SCALE = (TAG_HEIGHT + PROXY_HEIGHT) / PROXY_HEIGHT

addTag = (ctx, name, value, x, y) ->
	ctx.fillStyle = '#ffffff'
	ctx.fillText(value, x + 40, y)
	ctx.fillStyle = '#ff0000'
	ctx.fillText(name, x, y)

writeTag = (canvas, pano, data, gsvh) ->
	ctx = canvas.getContext('2d')

	canvas.width = pano.width
	canvas.height = pano.height * V_SCALE

	ctx.fillStyle = '#000000'
	ctx.fillRect(0, 0, canvas.width, canvas.height)
	ctx.drawImage(pano, 0, 0)

	y = canvas.height - TAG_HEIGHT
	cursor = 0
	ctx.font = '24px ocr'
	# addTag(ctx, "uid",     "#{gsvh.uid}", cursor++ * 0xff, y + 36)	
	# addTag(ctx, "pano",  "#{data.id}", cursor++ * 0xff, y + 36)						
	# addTag(ctx, "lat",     "#{data.latLng.lat().toPrecision(17)}", cursor++ * 0xff, y + 36)	
	# addTag(ctx, "lng",     "#{data.latLng.lng().toPrecision(17)}", cursor++ * 0xff, y + 36)	
	# addTag(ctx, "head",    "#{data.heading.toPrecision(17)}", cursor++ * 0xff, y + 36)
	# addTag(ctx, "date",    "#{data.date}", cursor++ * 0xff, y + 36)	

	# cursor = 0
	# addTag(ctx, "zoom",     "#{gsvh.zoom}", cursor++ * 0xff, y + 18)
	# addTag(ctx, "aj_h", 	"#{data.ajustHeading.toPrecision(17)}", cursor++ * 0xff, y + 18)
	# addTag(ctx, "aj_p",     "#{data.ajustPitch.toPrecision(17)}", cursor++ * 0xff, y + 18)

	# ctx.fillStyle = '#ffffff'
	# ctx.fillText("<#{gsvh.uid}><#{data.id}><#{data.heading}>", 4, y + 32)

	tag =
		uid: gsvh.uid
		id: data.id
		heading: data.heading

	buff = str2buff( btoa(tag) )

	console.log buff



	


`
var str2buff = function(str){
  var ab_ = new ArrayBuffer(new Blob([str]).size);
  var bytes_ = new Uint8Array(ab_);
 
  var n = str.length,
      idx = -1,
      i, c;
 
  for(i = 0; i < n; ++i){
    c = str.charCodeAt(i);
    if(c <= 0x7F){
      bytes_[++idx] = c;
    } else if(c <= 0x7FF){
      bytes_[++idx] = 0xC0 | (c >>> 6);
      bytes_[++idx] = 0x80 | (c & 0x3F);
    } else if(c <= 0xFFFF){
      bytes_[++idx] = 0xE0 | (c >>> 12);
      bytes_[++idx] = 0x80 | ((c >>> 6) & 0x3F);
      bytes_[++idx] = 0x80 | (c & 0x3F);
    } else {
      bytes_[++idx] = 0xF0 | (c >>> 18);
      bytes_[++idx] = 0x80 | ((c >>> 12) & 0x3F);
      bytes_[++idx] = 0x80 | ((c >>> 6) & 0x3F);
      bytes_[++idx] = 0x80 | (c & 0x3F);
    }
  }
  return bytes_;
}
 
var buff2str = function(buff){
  var size = buff.length;
  var i = 0, str = '', c, code;
  while(i < size){
    c = buff[i];
    if ( c < 128){
      str += String.fromCharCode(c);
      i++;
    } else if ((c ^ 0xc0) < 32){
      code = ((c ^ 0xc0) << 6) | (buff[i+1] & 63);
      str += String.fromCharCode(code);
      i += 2;
    } else {
      code = ((c & 15) << 12) | ((buff[i+1] & 63) << 6) |
        (buff[i+2] & 63);
      str += String.fromCharCode(code);
      i += 3;
    }
  }
  return str;
}
`