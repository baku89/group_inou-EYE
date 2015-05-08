CMC_SIZE = 3

CanvasMatrixCode = {}

str = null
uint8 = null

CanvasMatrixCode.draw = (canvas, data, x, y, width, height) ->
    ctx = canvas.getContext('2d')
    arrayBuff = CanvasMatrixCode.str2buff( JSON.stringify(data) )
    buff = new Uint8Array( arrayBuff )
    col = Math.floor(width / (CMC_SIZE * 8))
    row = Math.floor(height / CMC_SIZE)
    u = v = 0
    _x = _y = 0

    if col * row + 1 < buff.length
        console.log "[CanvasMatrixCode] destination rect is too small for data."
        return null

    for i, b of buff
        u = (i % col)
        v = Math.floor(i / col)
        for j in [0..7]
            ctx.fillStyle = if b & Math.pow(2, j) then "#ff0000" else "#00ff00"
            _x = x + (u*8 + j) * CMC_SIZE
            _y = y + v * CMC_SIZE 
            console.log ctx.fillStyle
            ctx.fillRect(_x, _y, CMC_SIZE, CMC_SIZE)

CanvasMatrixCode.decode = (canvas, x, y, width, height) ->

    ctx = canvas.getContext('2d')

    col = Math.floor(width / (CMC_SIZE * 8))
    row = Math.floor(height / CMC_SIZE)
    u = v = c = 0

    buff = []

    for v in [0..row-1]
        for u in [0..col-1]
            b = 0
            for j in [0..7]
                _x = x + (u*8 + j) * CMC_SIZE
                _y = y + v * CMC_SIZE
                c = ctx.getImageData(_x, _y, 1, 1).data
                if c[0] > 128
                    b += Math.pow(2, j)
                else if c[1] < 128
                    break

            buff.push( b )

    uint8 = new Uint8Array( buff )


    str = CanvasMatrixCode.buff2str( uint8 )

    console.log str

    #json = '{"uid":"4651430993232234","id":"eae6wCbK-MM1h8-c15AjhQ","heading":0}'

    return JSON.parse( str )

CanvasMatrixCode.buff2str =  (buff) ->
	return String.fromCharCode.apply(null, new Uint8Array(buff))

# `
# CanvasMatrixCode.buff2str = function(buf) {
#   return String.fromCharCode.apply(null, new UintArray(buf));
# }
# CanvasMatrixCode.str2buff = function(str) {
#   var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
#   var bufView = new Uint16Array(buf);
#   for (var i=0, strLen=str.length; i < strLen; i++) {
#     bufView[i] = str.charCodeAt(i);
#   }
#   return buf;
# }
# `