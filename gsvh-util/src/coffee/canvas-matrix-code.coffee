CMC_SIZE = 3

CanvasMatrixCode = {}

str = null
uint8 = null

data =
    title: "Hello World"
    value: 123456789

json = JSON.stringify( data )

CanvasMatrixCode.draw = (canvas, data, x, y, width, height) ->
    ctx = canvas.getContext('2d')
    arrayBuff = CanvasMatrixCode.strToBuff( JSON.stringify(data) )
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
            ctx.fillRect(_x, _y, CMC_SIZE, CMC_SIZE)

CanvasMatrixCode.decode = (canvas, x, y, width, height) ->

    ctx = canvas.getContext('2d')

    col = Math.floor(width / (CMC_SIZE * 8))
    row = Math.floor(height / CMC_SIZE)
    u = v = c = 0

    buff = []
    end = false

    for v in [0..row-1]
        for u in [0..col-1]
            b = 0
            for j in [0..7]
                _x = Math.floor( x + (u*8 + j + .5) * CMC_SIZE )
                _y = Math.floor( y + (v + .5) * CMC_SIZE )
                c = ctx.getImageData(_x, _y, 1, 1).data
                if c[0] > 128
                    b += Math.pow(2, j)
                else if c[1] < 128
                    end = true
                    break
            if end then break
            buff.push( b )
        if end then break

    str = CanvasMatrixCode.buffToStr( buff )
    try
        json = JSON.parse( str )
    catch e
        console.log('invalid tag')
        return null

    return json

CanvasMatrixCode.buffToStr =  (buff) ->
	return String.fromCharCode.apply(null, new Uint8Array(buff))

CanvasMatrixCode.strToBuff = (str) ->
    buff = new Uint8Array(str.length)
    for i in [0..str.length-1]
        buff[i] = str.charCodeAt(i)
    return buff