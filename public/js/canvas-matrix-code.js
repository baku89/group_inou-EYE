var CMC_SIZE, CanvasMatrixCode, data, json, str, uint8;

CMC_SIZE = 3;

CanvasMatrixCode = {};

str = null;

uint8 = null;

data = {
  title: "Hello World",
  value: 123456789
};

json = JSON.stringify(data);

CanvasMatrixCode.draw = function(canvas, data, x, y, width, height) {
  var _x, _y, arrayBuff, b, buff, col, ctx, i, j, results, row, u, v;
  ctx = canvas.getContext('2d');
  arrayBuff = CanvasMatrixCode.strToBuff(JSON.stringify(data));
  buff = new Uint8Array(arrayBuff);
  col = Math.floor(width / (CMC_SIZE * 8));
  row = Math.floor(height / CMC_SIZE);
  u = v = 0;
  _x = _y = 0;
  if (col * row + 1 < buff.length) {
    console.log("[CanvasMatrixCode] destination rect is too small for data.");
    return null;
  }
  results = [];
  for (i in buff) {
    b = buff[i];
    u = i % col;
    v = Math.floor(i / col);
    results.push((function() {
      var k, results1;
      results1 = [];
      for (j = k = 0; k <= 7; j = ++k) {
        ctx.fillStyle = b & Math.pow(2, j) ? "#ff0000" : "#00ff00";
        _x = x + (u * 8 + j) * CMC_SIZE;
        _y = y + v * CMC_SIZE;
        results1.push(ctx.fillRect(_x, _y, CMC_SIZE, CMC_SIZE));
      }
      return results1;
    })());
  }
  return results;
};

CanvasMatrixCode.decode = function(canvas, x, y, width, height) {
  var _x, _y, b, buff, c, col, ctx, e, end, j, k, l, m, ref, ref1, row, u, v;
  ctx = canvas.getContext('2d');
  col = Math.floor(width / (CMC_SIZE * 8));
  row = Math.floor(height / CMC_SIZE);
  u = v = c = 0;
  buff = [];
  end = false;
  for (v = k = 0, ref = row - 1; 0 <= ref ? k <= ref : k >= ref; v = 0 <= ref ? ++k : --k) {
    for (u = l = 0, ref1 = col - 1; 0 <= ref1 ? l <= ref1 : l >= ref1; u = 0 <= ref1 ? ++l : --l) {
      b = 0;
      for (j = m = 0; m <= 7; j = ++m) {
        _x = Math.floor(x + (u * 8 + j + .5) * CMC_SIZE);
        _y = Math.floor(y + (v + .5) * CMC_SIZE);
        c = ctx.getImageData(_x, _y, 1, 1).data;
        if (c[0] > 128) {
          b += Math.pow(2, j);
        } else if (c[1] < 128) {
          end = true;
          break;
        }
      }
      if (end) {
        break;
      }
      buff.push(b);
    }
    if (end) {
      break;
    }
  }
  str = CanvasMatrixCode.buffToStr(buff);
  try {
    json = JSON.parse(str);
  } catch (_error) {
    e = _error;
    console.log('invalid tag');
    return null;
  }
  return json;
};

CanvasMatrixCode.buffToStr = function(buff) {
  return String.fromCharCode.apply(null, new Uint8Array(buff));
};

CanvasMatrixCode.strToBuff = function(str) {
  var buff, i, k, ref;
  buff = new Uint8Array(str.length);
  for (i = k = 0, ref = str.length - 1; 0 <= ref ? k <= ref : k >= ref; i = 0 <= ref ? ++k : --k) {
    buff[i] = str.charCodeAt(i);
  }
  return buff;
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNhbnZhcy1tYXRyaXgtY29kZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQTs7QUFBQSxRQUFBLEdBQVc7O0FBRVgsZ0JBQUEsR0FBbUI7O0FBRW5CLEdBQUEsR0FBTTs7QUFDTixLQUFBLEdBQVE7O0FBRVIsSUFBQSxHQUNJO0VBQUEsS0FBQSxFQUFPLGFBQVA7RUFDQSxLQUFBLEVBQU8sU0FEUDs7O0FBR0osSUFBQSxHQUFPLElBQUksQ0FBQyxTQUFMLENBQWdCLElBQWhCOztBQUVQLGdCQUFnQixDQUFDLElBQWpCLEdBQXdCLFNBQUMsTUFBRCxFQUFTLElBQVQsRUFBZSxDQUFmLEVBQWtCLENBQWxCLEVBQXFCLEtBQXJCLEVBQTRCLE1BQTVCO0FBQ3BCLE1BQUE7RUFBQSxHQUFBLEdBQU0sTUFBTSxDQUFDLFVBQVAsQ0FBa0IsSUFBbEI7RUFDTixTQUFBLEdBQVksZ0JBQWdCLENBQUMsU0FBakIsQ0FBNEIsSUFBSSxDQUFDLFNBQUwsQ0FBZSxJQUFmLENBQTVCO0VBQ1osSUFBQSxHQUFXLElBQUEsVUFBQSxDQUFZLFNBQVo7RUFDWCxHQUFBLEdBQU0sSUFBSSxDQUFDLEtBQUwsQ0FBVyxLQUFBLEdBQVEsQ0FBQyxRQUFBLEdBQVcsQ0FBWixDQUFuQjtFQUNOLEdBQUEsR0FBTSxJQUFJLENBQUMsS0FBTCxDQUFXLE1BQUEsR0FBUyxRQUFwQjtFQUNOLENBQUEsR0FBSSxDQUFBLEdBQUk7RUFDUixFQUFBLEdBQUssRUFBQSxHQUFLO0VBRVYsSUFBRyxHQUFBLEdBQU0sR0FBTixHQUFZLENBQVosR0FBZ0IsSUFBSSxDQUFDLE1BQXhCO0lBQ0ksT0FBTyxDQUFDLEdBQVIsQ0FBWSw0REFBWjtBQUNBLFdBQU8sS0FGWDs7QUFJQTtPQUFBLFNBQUE7O0lBQ0ksQ0FBQSxHQUFLLENBQUEsR0FBSTtJQUNULENBQUEsR0FBSSxJQUFJLENBQUMsS0FBTCxDQUFXLENBQUEsR0FBSSxHQUFmOzs7QUFDSjtXQUFTLDBCQUFUO1FBQ0ksR0FBRyxDQUFDLFNBQUosR0FBbUIsQ0FBQSxHQUFJLElBQUksQ0FBQyxHQUFMLENBQVMsQ0FBVCxFQUFZLENBQVosQ0FBUCxHQUEyQixTQUEzQixHQUEwQztRQUMxRCxFQUFBLEdBQUssQ0FBQSxHQUFJLENBQUMsQ0FBQSxHQUFFLENBQUYsR0FBTSxDQUFQLENBQUEsR0FBWTtRQUNyQixFQUFBLEdBQUssQ0FBQSxHQUFJLENBQUEsR0FBSTtzQkFDYixHQUFHLENBQUMsUUFBSixDQUFhLEVBQWIsRUFBaUIsRUFBakIsRUFBcUIsUUFBckIsRUFBK0IsUUFBL0I7QUFKSjs7O0FBSEo7O0FBYm9COztBQXNCeEIsZ0JBQWdCLENBQUMsTUFBakIsR0FBMEIsU0FBQyxNQUFELEVBQVMsQ0FBVCxFQUFZLENBQVosRUFBZSxLQUFmLEVBQXNCLE1BQXRCO0FBRXRCLE1BQUE7RUFBQSxHQUFBLEdBQU0sTUFBTSxDQUFDLFVBQVAsQ0FBa0IsSUFBbEI7RUFFTixHQUFBLEdBQU0sSUFBSSxDQUFDLEtBQUwsQ0FBVyxLQUFBLEdBQVEsQ0FBQyxRQUFBLEdBQVcsQ0FBWixDQUFuQjtFQUNOLEdBQUEsR0FBTSxJQUFJLENBQUMsS0FBTCxDQUFXLE1BQUEsR0FBUyxRQUFwQjtFQUNOLENBQUEsR0FBSSxDQUFBLEdBQUksQ0FBQSxHQUFJO0VBRVosSUFBQSxHQUFPO0VBQ1AsR0FBQSxHQUFNO0FBRU4sT0FBUyxrRkFBVDtBQUNJLFNBQVMsdUZBQVQ7TUFDSSxDQUFBLEdBQUk7QUFDSixXQUFTLDBCQUFUO1FBQ0ksRUFBQSxHQUFLLElBQUksQ0FBQyxLQUFMLENBQVksQ0FBQSxHQUFJLENBQUMsQ0FBQSxHQUFFLENBQUYsR0FBTSxDQUFOLEdBQVUsRUFBWCxDQUFBLEdBQWlCLFFBQWpDO1FBQ0wsRUFBQSxHQUFLLElBQUksQ0FBQyxLQUFMLENBQVksQ0FBQSxHQUFJLENBQUMsQ0FBQSxHQUFJLEVBQUwsQ0FBQSxHQUFXLFFBQTNCO1FBQ0wsQ0FBQSxHQUFJLEdBQUcsQ0FBQyxZQUFKLENBQWlCLEVBQWpCLEVBQXFCLEVBQXJCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLENBQThCLENBQUM7UUFDbkMsSUFBRyxDQUFFLENBQUEsQ0FBQSxDQUFGLEdBQU8sR0FBVjtVQUNJLENBQUEsSUFBSyxJQUFJLENBQUMsR0FBTCxDQUFTLENBQVQsRUFBWSxDQUFaLEVBRFQ7U0FBQSxNQUVLLElBQUcsQ0FBRSxDQUFBLENBQUEsQ0FBRixHQUFPLEdBQVY7VUFDRCxHQUFBLEdBQU07QUFDTixnQkFGQzs7QUFOVDtNQVNBLElBQUcsR0FBSDtBQUFZLGNBQVo7O01BQ0EsSUFBSSxDQUFDLElBQUwsQ0FBVyxDQUFYO0FBWko7SUFhQSxJQUFHLEdBQUg7QUFBWSxZQUFaOztBQWRKO0VBZ0JBLEdBQUEsR0FBTSxnQkFBZ0IsQ0FBQyxTQUFqQixDQUE0QixJQUE1QjtBQUNOO0lBQ0ksSUFBQSxHQUFPLElBQUksQ0FBQyxLQUFMLENBQVksR0FBWixFQURYO0dBQUEsY0FBQTtJQUVNO0lBQ0YsT0FBTyxDQUFDLEdBQVIsQ0FBWSxhQUFaO0FBQ0EsV0FBTyxLQUpYOztBQU1BLFNBQU87QUFsQ2U7O0FBb0MxQixnQkFBZ0IsQ0FBQyxTQUFqQixHQUE4QixTQUFDLElBQUQ7QUFDN0IsU0FBTyxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQXBCLENBQTBCLElBQTFCLEVBQW9DLElBQUEsVUFBQSxDQUFXLElBQVgsQ0FBcEM7QUFEc0I7O0FBRzlCLGdCQUFnQixDQUFDLFNBQWpCLEdBQTZCLFNBQUMsR0FBRDtBQUN6QixNQUFBO0VBQUEsSUFBQSxHQUFXLElBQUEsVUFBQSxDQUFXLEdBQUcsQ0FBQyxNQUFmO0FBQ1gsT0FBUyx5RkFBVDtJQUNJLElBQUssQ0FBQSxDQUFBLENBQUwsR0FBVSxHQUFHLENBQUMsVUFBSixDQUFlLENBQWY7QUFEZDtBQUVBLFNBQU87QUFKa0IiLCJmaWxlIjoiY2FudmFzLW1hdHJpeC1jb2RlLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiQ01DX1NJWkUgPSAzXG5cbkNhbnZhc01hdHJpeENvZGUgPSB7fVxuXG5zdHIgPSBudWxsXG51aW50OCA9IG51bGxcblxuZGF0YSA9XG4gICAgdGl0bGU6IFwiSGVsbG8gV29ybGRcIlxuICAgIHZhbHVlOiAxMjM0NTY3ODlcblxuanNvbiA9IEpTT04uc3RyaW5naWZ5KCBkYXRhIClcblxuQ2FudmFzTWF0cml4Q29kZS5kcmF3ID0gKGNhbnZhcywgZGF0YSwgeCwgeSwgd2lkdGgsIGhlaWdodCkgLT5cbiAgICBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKVxuICAgIGFycmF5QnVmZiA9IENhbnZhc01hdHJpeENvZGUuc3RyVG9CdWZmKCBKU09OLnN0cmluZ2lmeShkYXRhKSApXG4gICAgYnVmZiA9IG5ldyBVaW50OEFycmF5KCBhcnJheUJ1ZmYgKVxuICAgIGNvbCA9IE1hdGguZmxvb3Iod2lkdGggLyAoQ01DX1NJWkUgKiA4KSlcbiAgICByb3cgPSBNYXRoLmZsb29yKGhlaWdodCAvIENNQ19TSVpFKVxuICAgIHUgPSB2ID0gMFxuICAgIF94ID0gX3kgPSAwXG5cbiAgICBpZiBjb2wgKiByb3cgKyAxIDwgYnVmZi5sZW5ndGhcbiAgICAgICAgY29uc29sZS5sb2cgXCJbQ2FudmFzTWF0cml4Q29kZV0gZGVzdGluYXRpb24gcmVjdCBpcyB0b28gc21hbGwgZm9yIGRhdGEuXCJcbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgIGZvciBpLCBiIG9mIGJ1ZmZcbiAgICAgICAgdSA9IChpICUgY29sKVxuICAgICAgICB2ID0gTWF0aC5mbG9vcihpIC8gY29sKVxuICAgICAgICBmb3IgaiBpbiBbMC4uN11cbiAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBpZiBiICYgTWF0aC5wb3coMiwgaikgdGhlbiBcIiNmZjAwMDBcIiBlbHNlIFwiIzAwZmYwMFwiXG4gICAgICAgICAgICBfeCA9IHggKyAodSo4ICsgaikgKiBDTUNfU0laRVxuICAgICAgICAgICAgX3kgPSB5ICsgdiAqIENNQ19TSVpFIFxuICAgICAgICAgICAgY3R4LmZpbGxSZWN0KF94LCBfeSwgQ01DX1NJWkUsIENNQ19TSVpFKVxuXG5DYW52YXNNYXRyaXhDb2RlLmRlY29kZSA9IChjYW52YXMsIHgsIHksIHdpZHRoLCBoZWlnaHQpIC0+XG5cbiAgICBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKVxuXG4gICAgY29sID0gTWF0aC5mbG9vcih3aWR0aCAvIChDTUNfU0laRSAqIDgpKVxuICAgIHJvdyA9IE1hdGguZmxvb3IoaGVpZ2h0IC8gQ01DX1NJWkUpXG4gICAgdSA9IHYgPSBjID0gMFxuXG4gICAgYnVmZiA9IFtdXG4gICAgZW5kID0gZmFsc2VcblxuICAgIGZvciB2IGluIFswLi5yb3ctMV1cbiAgICAgICAgZm9yIHUgaW4gWzAuLmNvbC0xXVxuICAgICAgICAgICAgYiA9IDBcbiAgICAgICAgICAgIGZvciBqIGluIFswLi43XVxuICAgICAgICAgICAgICAgIF94ID0gTWF0aC5mbG9vciggeCArICh1KjggKyBqICsgLjUpICogQ01DX1NJWkUgKVxuICAgICAgICAgICAgICAgIF95ID0gTWF0aC5mbG9vciggeSArICh2ICsgLjUpICogQ01DX1NJWkUgKVxuICAgICAgICAgICAgICAgIGMgPSBjdHguZ2V0SW1hZ2VEYXRhKF94LCBfeSwgMSwgMSkuZGF0YVxuICAgICAgICAgICAgICAgIGlmIGNbMF0gPiAxMjhcbiAgICAgICAgICAgICAgICAgICAgYiArPSBNYXRoLnBvdygyLCBqKVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgY1sxXSA8IDEyOFxuICAgICAgICAgICAgICAgICAgICBlbmQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBpZiBlbmQgdGhlbiBicmVha1xuICAgICAgICAgICAgYnVmZi5wdXNoKCBiIClcbiAgICAgICAgaWYgZW5kIHRoZW4gYnJlYWtcblxuICAgIHN0ciA9IENhbnZhc01hdHJpeENvZGUuYnVmZlRvU3RyKCBidWZmIClcbiAgICB0cnlcbiAgICAgICAganNvbiA9IEpTT04ucGFyc2UoIHN0ciApXG4gICAgY2F0Y2ggZVxuICAgICAgICBjb25zb2xlLmxvZygnaW52YWxpZCB0YWcnKVxuICAgICAgICByZXR1cm4gbnVsbFxuXG4gICAgcmV0dXJuIGpzb25cblxuQ2FudmFzTWF0cml4Q29kZS5idWZmVG9TdHIgPSAgKGJ1ZmYpIC0+XG5cdHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsIG5ldyBVaW50OEFycmF5KGJ1ZmYpKVxuXG5DYW52YXNNYXRyaXhDb2RlLnN0clRvQnVmZiA9IChzdHIpIC0+XG4gICAgYnVmZiA9IG5ldyBVaW50OEFycmF5KHN0ci5sZW5ndGgpXG4gICAgZm9yIGkgaW4gWzAuLnN0ci5sZW5ndGgtMV1cbiAgICAgICAgYnVmZltpXSA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgcmV0dXJuIGJ1ZmYiXX0=