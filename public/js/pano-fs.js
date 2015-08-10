var $canvas, HEIGHT, TAG_HEIGHT, WIDTH, glsl, onMouseMove, pitch, rotation, tag, x, y;

WIDTH = 1664;

HEIGHT = 832;

TAG_HEIGHT = 40;

tag = null;

glsl = null;

x = y = rotation = pitch = null;

$canvas = null;

$(function() {
  var ctx, original;
  $canvas = $('#pano');
  $canvas.on({
    'mousemove': onMouseMove
  });
  original = $('#original')[0];
  original.src = "./assets/pano.png";
  original.onload = function() {
    if (glsl != null) {
      glsl.set('original', original);
      return glsl.syncAll();
    }
  };
  tag = document.createElement('canvas');
  tag.width = WIDTH;
  tag.height = TAG_HEIGHT;
  ctx = tag.getContext('2d');
  ctx.fillStyle = '#0000FF';
  ctx.fillRect(0, 0, WIDTH, TAG_HEIGHT);
  glsl = Glsl({
    canvas: $canvas[0],
    fragment: $('#pano-rotation')[0].textContent,
    variables: {
      rotation: 0.0,
      pitch: 0.0,
      original: original,
      tag: tag
    }
  });
  glsl.setSize(WIDTH, HEIGHT + TAG_HEIGHT);
  return glsl.start();
});

onMouseMove = function(e) {
  x = e.pageX / WIDTH;
  y = e.pageY / (HEIGHT + TAG_HEIGHT);
  rotation = x * Math.PI * 2;
  pitch = (y - 0.5) * Math.PI;
  glsl.set('rotation', rotation);
  glsl.set('pitch', pitch);
  return glsl.syncAll();
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBhbm8tZnMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLElBQUE7O0FBQUEsS0FBQSxHQUFROztBQUNSLE1BQUEsR0FBUzs7QUFDVCxVQUFBLEdBQWE7O0FBR2IsR0FBQSxHQUFNOztBQUNOLElBQUEsR0FBTzs7QUFFUCxDQUFBLEdBQUksQ0FBQSxHQUFJLFFBQUEsR0FBVyxLQUFBLEdBQVE7O0FBRTNCLE9BQUEsR0FBVTs7QUFFVixDQUFBLENBQUUsU0FBQTtBQUNELE1BQUE7RUFBQSxPQUFBLEdBQVUsQ0FBQSxDQUFFLE9BQUY7RUFFVixPQUFPLENBQUMsRUFBUixDQUNDO0lBQUEsV0FBQSxFQUFhLFdBQWI7R0FERDtFQUdBLFFBQUEsR0FBVyxDQUFBLENBQUUsV0FBRixDQUFlLENBQUEsQ0FBQTtFQUMxQixRQUFRLENBQUMsR0FBVCxHQUFlO0VBQ2YsUUFBUSxDQUFDLE1BQVQsR0FBa0IsU0FBQTtJQUNqQixJQUFHLFlBQUg7TUFDQyxJQUFJLENBQUMsR0FBTCxDQUFTLFVBQVQsRUFBcUIsUUFBckI7YUFDQSxJQUFJLENBQUMsT0FBTCxDQUFBLEVBRkQ7O0VBRGlCO0VBS2xCLEdBQUEsR0FBTSxRQUFRLENBQUMsYUFBVCxDQUF1QixRQUF2QjtFQUNOLEdBQUcsQ0FBQyxLQUFKLEdBQVk7RUFDWixHQUFHLENBQUMsTUFBSixHQUFhO0VBRWIsR0FBQSxHQUFNLEdBQUcsQ0FBQyxVQUFKLENBQWUsSUFBZjtFQUNOLEdBQUcsQ0FBQyxTQUFKLEdBQWdCO0VBQ2hCLEdBQUcsQ0FBQyxRQUFKLENBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixLQUFuQixFQUEwQixVQUExQjtFQUVBLElBQUEsR0FBTyxJQUFBLENBQ047SUFBQSxNQUFBLEVBQVEsT0FBUSxDQUFBLENBQUEsQ0FBaEI7SUFDQSxRQUFBLEVBQVUsQ0FBQSxDQUFFLGdCQUFGLENBQW9CLENBQUEsQ0FBQSxDQUFFLENBQUMsV0FEakM7SUFFQSxTQUFBLEVBQ0M7TUFBQSxRQUFBLEVBQVUsR0FBVjtNQUNBLEtBQUEsRUFBTyxHQURQO01BRUEsUUFBQSxFQUFVLFFBRlY7TUFHQSxHQUFBLEVBQUssR0FITDtLQUhEO0dBRE07RUFTUCxJQUFJLENBQUMsT0FBTCxDQUFhLEtBQWIsRUFBb0IsTUFBQSxHQUFTLFVBQTdCO1NBQ0EsSUFBSSxDQUFDLEtBQUwsQ0FBQTtBQS9CQyxDQUFGOztBQWlDQSxXQUFBLEdBQWMsU0FBQyxDQUFEO0VBQ2IsQ0FBQSxHQUFJLENBQUMsQ0FBQyxLQUFGLEdBQVU7RUFDZCxDQUFBLEdBQUksQ0FBQyxDQUFDLEtBQUYsR0FBVSxDQUFDLE1BQUEsR0FBUyxVQUFWO0VBRWQsUUFBQSxHQUFXLENBQUEsR0FBSSxJQUFJLENBQUMsRUFBVCxHQUFjO0VBQ3pCLEtBQUEsR0FBUSxDQUFDLENBQUEsR0FBSSxHQUFMLENBQUEsR0FBWSxJQUFJLENBQUM7RUFFekIsSUFBSSxDQUFDLEdBQUwsQ0FBUyxVQUFULEVBQXFCLFFBQXJCO0VBQ0EsSUFBSSxDQUFDLEdBQUwsQ0FBUyxPQUFULEVBQWtCLEtBQWxCO1NBQ0EsSUFBSSxDQUFDLE9BQUwsQ0FBQTtBQVRhIiwiZmlsZSI6InBhbm8tZnMuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyJXSURUSCA9IDE2NjRcbkhFSUdIVCA9IDgzMlxuVEFHX0hFSUdIVCA9IDQwXG5cblxudGFnID0gbnVsbFxuZ2xzbCA9IG51bGxcblxueCA9IHkgPSByb3RhdGlvbiA9IHBpdGNoID0gbnVsbFxuXG4kY2FudmFzID0gbnVsbFxuXG4kIC0+XG5cdCRjYW52YXMgPSAkKCcjcGFubycpXG5cblx0JGNhbnZhcy5vblxuXHRcdCdtb3VzZW1vdmUnOiBvbk1vdXNlTW92ZVxuXG5cdG9yaWdpbmFsID0gJCgnI29yaWdpbmFsJylbMF1cblx0b3JpZ2luYWwuc3JjID0gXCIuL2Fzc2V0cy9wYW5vLnBuZ1wiXG5cdG9yaWdpbmFsLm9ubG9hZCA9IC0+XG5cdFx0aWYgZ2xzbD9cblx0XHRcdGdsc2wuc2V0KCdvcmlnaW5hbCcsIG9yaWdpbmFsKVxuXHRcdFx0Z2xzbC5zeW5jQWxsKClcblxuXHR0YWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxuXHR0YWcud2lkdGggPSBXSURUSFxuXHR0YWcuaGVpZ2h0ID0gVEFHX0hFSUdIVFxuXG5cdGN0eCA9IHRhZy5nZXRDb250ZXh0KCcyZCcpXG5cdGN0eC5maWxsU3R5bGUgPSAnIzAwMDBGRidcblx0Y3R4LmZpbGxSZWN0KDAsIDAsIFdJRFRILCBUQUdfSEVJR0hUKVxuXG5cdGdsc2wgPSBHbHNsXG5cdFx0Y2FudmFzOiAkY2FudmFzWzBdXG5cdFx0ZnJhZ21lbnQ6ICQoJyNwYW5vLXJvdGF0aW9uJylbMF0udGV4dENvbnRlbnRcblx0XHR2YXJpYWJsZXM6XG5cdFx0XHRyb3RhdGlvbjogMC4wXG5cdFx0XHRwaXRjaDogMC4wXG5cdFx0XHRvcmlnaW5hbDogb3JpZ2luYWxcblx0XHRcdHRhZzogdGFnXG5cblx0Z2xzbC5zZXRTaXplKFdJRFRILCBIRUlHSFQgKyBUQUdfSEVJR0hUKVxuXHRnbHNsLnN0YXJ0KClcblxub25Nb3VzZU1vdmUgPSAoZSktPlxuXHR4ID0gZS5wYWdlWCAvIFdJRFRIXG5cdHkgPSBlLnBhZ2VZIC8gKEhFSUdIVCArIFRBR19IRUlHSFQpXG5cblx0cm90YXRpb24gPSB4ICogTWF0aC5QSSAqIDJcblx0cGl0Y2ggPSAoeSAtIDAuNSkgKiBNYXRoLlBJXG5cblx0Z2xzbC5zZXQoJ3JvdGF0aW9uJywgcm90YXRpb24pXG5cdGdsc2wuc2V0KCdwaXRjaCcsIHBpdGNoKVxuXHRnbHNsLnN5bmNBbGwoKSJdfQ==