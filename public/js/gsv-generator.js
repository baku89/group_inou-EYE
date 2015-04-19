var API_KEY, DIST_BETWEEN_PTS, MAX_PTS, VERSION, canvas, create, dirService, loader, onAnalyzeComplete, onCancel, onMessage, onPanoramaLoad, onProgress, panoIds, rawPts, res, restoreSettings, settings, storage, tasks, totalDist, updateSettings;

MAX_PTS = 100;

DIST_BETWEEN_PTS = 5;

API_KEY = "AIzaSyBQ2dzDfyF8Y0Dwe-Q6Jzx4_G62ANrTotQ";

VERSION = '0.1';

loader = null;

dirService = new google.maps.DirectionsService({});

res = null;

rawPts = [];

panoIds = [];

totalDist = 0;

canvas = null;

tasks = [];

settings = {};

storage = localStorage;

restoreSettings = function() {
  if (storage.version !== VERSION) {
    return;
  }
  $('#name').val(storage.name);
  $('#dir').val(storage.dir);
  $('#url').val(storage.url);
  $("input[value=" + storage.travelMode + "]").prop('checked', true);
  $("input[value=" + storage.heading + "]").prop('checked', true);
  $('#lookat').val(storage.lookat);
  $('#zoom').val(storage.zoom);
  $('#step').val(storage.step);
  return $('#search-radius').val(storage.searchRadius);
};

updateSettings = function() {
  settings.name = $('#name').val();
  settings.dir = $('#dir').val();
  settings.url = $('#url').val();
  settings.travelMode = $('input[name=travel]:checked').val();
  settings.heading = $('input[name=heading]:checked').val();
  settings.lookat = $('#lookat').val();
  settings.zoom = $('#zoom').val();
  settings.step = $('#step').val();
  settings.searchRadius = $('#search-radius').val();
  settings.version = VERSION;
  return $.extend(storage, settings);
};

$(function() {
  canvas = $('#panorama')[0];
  $('#create').on('click', create);
  GSVHyperlapse.onMessage = onMessage;
  GSVHyperlapse.onPanoramaLoad = onPanoramaLoad;
  GSVHyperlapse.onProgress = onProgress;
  GSVHyperlapse.onAnalyzeComplete = onAnalyzeComplete;
  GSVHyperlapse.onCancel = onCancel;
  restoreSettings();
  return $('input').on('change', updateSettings);
});

create = function() {
  var hyperlapse, index;
  updateSettings();
  index = tasks.length;
  $('.tasks').append("<li id='task-" + index + "'> <h1>" + settings.name + "</h1> <button class='action' data-index='" + index + "'>Cancel</button> <p>requesting route..<br></p> <div id='map-" + index + "' style='width: 48%; height: 0; padding-top: 26%; background:gray; display: inline-block;'></div> </li>");
  hyperlapse = new GSVHyperlapse(settings);
  hyperlapse.setMap($("#map-" + index)[0]);
  hyperlapse.create();
  $("#task-" + index + " button").on('click', function() {
    var $elm;
    $elm = $(this);
    index = $elm.attr('data-index');
    return tasks[index].cancel();
  });
  return tasks.push(hyperlapse);
};

onCancel = function() {
  var $btn, $elm, index;
  index = tasks.indexOf(this);
  $elm = $("#task-" + index);
  $btn = $('<button>delete</button><br>');
  $btn.on('click', function() {
    return $elm.remove();
  });
  return $elm.children('p').append('canceled<br>').append($btn);
};

onAnalyzeComplete = function() {
  var $btnGen, $elm, index;
  index = tasks.indexOf(this);
  $elm = $("#task-" + index);
  $btnGen = $('<button>generate hyperlapse</button><br>');
  $btnGen.on('click', function() {
    return tasks[index].compose();
  });
  return $elm.children('p').append($btnGen);
};

onProgress = function(loaded, total) {
  var $elm, index;
  index = tasks.indexOf(this);
  $elm = $("#task-" + index);
  if (loaded < 1) {
    $elm.children('p').append($('<progress></progress>'));
  }
  return $elm.find("progress").last().attr({
    value: loaded,
    max: total,
    'data-label': "[" + loaded + "/" + total + "]"
  });
};

onMessage = function(message) {
  var $elm, index;
  index = tasks.indexOf(this);
  $elm = $("#task-" + index);
  return $elm.children('p').append(message + "<br>");
};

onPanoramaLoad = function(idx, canvas) {
  var $elm, index, params;
  index = tasks.indexOf(this);
  $elm = $("#task-" + index);
  $elm.append(canvas);
  params = {
    name: this.name,
    directory: settings.dir,
    number: idx,
    image: canvas.toDataURL('image/png')
  };
  return $.ajax({
    type: "POST",
    url: './save.php',
    data: params,
    success: function(json) {
      var result;
      result = $.parseJSON(json);
      if (result.status !== "success") {
        self.cancel();
        return $elm.children('p').append("an error occured" + "<br>");
      }
    }
  });
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdzdi1nZW5lcmF0b3IuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLElBQUEsK09BQUE7O0FBQUEsT0FBQSxHQUFVLEdBQVYsQ0FBQTs7QUFBQSxnQkFDQSxHQUFtQixDQURuQixDQUFBOztBQUFBLE9BR0EsR0FBVSx5Q0FIVixDQUFBOztBQUFBLE9BSUEsR0FBVSxLQUpWLENBQUE7O0FBQUEsTUFRQSxHQUFTLElBUlQsQ0FBQTs7QUFBQSxVQVNBLEdBQWlCLElBQUEsTUFBTSxDQUFDLElBQUksQ0FBQyxpQkFBWixDQUE4QixFQUE5QixDQVRqQixDQUFBOztBQUFBLEdBWUEsR0FBTSxJQVpOLENBQUE7O0FBQUEsTUFjQSxHQUFTLEVBZFQsQ0FBQTs7QUFBQSxPQWVBLEdBQVUsRUFmVixDQUFBOztBQUFBLFNBZ0JBLEdBQVksQ0FoQlosQ0FBQTs7QUFBQSxNQWtCQSxHQUFTLElBbEJULENBQUE7O0FBQUEsS0FvQkEsR0FBUSxFQXBCUixDQUFBOztBQUFBLFFBc0JBLEdBQVcsRUF0QlgsQ0FBQTs7QUFBQSxPQXdCQSxHQUFVLFlBeEJWLENBQUE7O0FBQUEsZUErQkEsR0FBa0IsU0FBQSxHQUFBO0FBQ2pCLEVBQUEsSUFBRyxPQUFPLENBQUMsT0FBUixLQUFtQixPQUF0QjtBQUNDLFVBQUEsQ0FERDtHQUFBO0FBQUEsRUFHQSxDQUFBLENBQUUsT0FBRixDQUFVLENBQUMsR0FBWCxDQUFnQixPQUFPLENBQUMsSUFBeEIsQ0FIQSxDQUFBO0FBQUEsRUFJQSxDQUFBLENBQUUsTUFBRixDQUFTLENBQUMsR0FBVixDQUFlLE9BQU8sQ0FBQyxHQUF2QixDQUpBLENBQUE7QUFBQSxFQUtBLENBQUEsQ0FBRSxNQUFGLENBQVMsQ0FBQyxHQUFWLENBQWUsT0FBTyxDQUFDLEdBQXZCLENBTEEsQ0FBQTtBQUFBLEVBTUEsQ0FBQSxDQUFFLGNBQUEsR0FBZSxPQUFPLENBQUMsVUFBdkIsR0FBa0MsR0FBcEMsQ0FBdUMsQ0FBQyxJQUF4QyxDQUE2QyxTQUE3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QyxDQUFDLElBQUYsQ0FDQztBQUFBLElBQUEsSUFBQSxFQUFNLE1BQU47QUFBQSxJQUNBLEdBQUEsRUFBSyxZQURMO0FBQUEsSUFFQSxJQUFBLEVBQU0sTUFGTjtBQUFBLElBR0EsT0FBQSxFQUFTLFNBQUMsSUFBRCxHQUFBO0FBQ1IsVUFBQSxNQUFBO0FBQUEsTUFBQSxNQUFBLEdBQVMsQ0FBQyxDQUFDLFNBQUYsQ0FBYSxJQUFiLENBQVQsQ0FBQTtBQUNBLE1BQUEsSUFBRyxNQUFNLENBQUMsTUFBUCxLQUFpQixTQUFwQjtBQUNDLFFBQUEsSUFBSSxDQUFDLE1BQUwsQ0FBQSxDQUFBLENBQUE7ZUFDQSxJQUFJLENBQUMsUUFBTCxDQUFjLEdBQWQsQ0FBa0IsQ0FBQyxNQUFuQixDQUEwQixrQkFBQSxHQUFxQixNQUEvQyxFQUZEO09BRlE7SUFBQSxDQUhUO0dBREQsRUFiZ0I7QUFBQSxDQS9KakIsQ0FBQSIsImZpbGUiOiJnc3YtZ2VuZXJhdG9yLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBjb25zdGFudHNcbk1BWF9QVFMgPSAxMDBcbkRJU1RfQkVUV0VFTl9QVFMgPSA1XG5cbkFQSV9LRVkgPSBcIkFJemFTeUJRMmR6RGZ5RjhZMER3ZS1RNkp6eDRfRzYyQU5yVG90UVwiXG5WRVJTSU9OID0gJzAuMSdcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyB2YXJpYWJsZXNcbmxvYWRlciA9IG51bGxcbmRpclNlcnZpY2UgPSBuZXcgZ29vZ2xlLm1hcHMuRGlyZWN0aW9uc1NlcnZpY2Uoe30pXG5cbiMgZWFjaCByZXNcbnJlcyA9IG51bGxcblxucmF3UHRzID0gW11cbnBhbm9JZHMgPSBbXVxudG90YWxEaXN0ID0gMFxuXG5jYW52YXMgPSBudWxsXG5cbnRhc2tzID0gW11cblxuc2V0dGluZ3MgPSB7fVxuXG5zdG9yYWdlID0gbG9jYWxTdG9yYWdlXG5cblxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIGluaXRcblxucmVzdG9yZVNldHRpbmdzID0gLT5cblx0aWYgc3RvcmFnZS52ZXJzaW9uICE9IFZFUlNJT05cblx0XHRyZXR1cm5cblxuXHQkKCcjbmFtZScpLnZhbCggc3RvcmFnZS5uYW1lIClcblx0JCgnI2RpcicpLnZhbCggc3RvcmFnZS5kaXIgKVxuXHQkKCcjdXJsJykudmFsKCBzdG9yYWdlLnVybCApXG5cdCQoXCJpbnB1dFt2YWx1ZT0je3N0b3JhZ2UudHJhdmVsTW9kZX1dXCIpLnByb3AoJ2NoZWNrZWQnLCB0cnVlKVxuXHQkKFwiaW5wdXRbdmFsdWU9I3tzdG9yYWdlLmhlYWRpbmd9XVwiKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSlcblx0JCgnI2xvb2thdCcpLnZhbCggc3RvcmFnZS5sb29rYXQgKVxuXHQkKCcjem9vbScpLnZhbCggc3RvcmFnZS56b29tIClcblx0JCgnI3N0ZXAnKS52YWwoIHN0b3JhZ2Uuc3RlcCApXG5cdCQoJyNzZWFyY2gtcmFkaXVzJykudmFsKCBzdG9yYWdlLnNlYXJjaFJhZGl1cyApXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgZnVuY3Rpb25zXG5cbnVwZGF0ZVNldHRpbmdzID0gLT5cblx0c2V0dGluZ3MubmFtZSBcdCAgICAgICAgPSAkKCcjbmFtZScpLnZhbCgpXG5cdHNldHRpbmdzLmRpciBcdCAgICAgICAgPSAkKCcjZGlyJykudmFsKClcblx0c2V0dGluZ3MudXJsIFx0ICAgICAgICA9ICQoJyN1cmwnKS52YWwoKVxuXHRzZXR0aW5ncy50cmF2ZWxNb2RlICAgICA9ICQoJ2lucHV0W25hbWU9dHJhdmVsXTpjaGVja2VkJykudmFsKClcblx0c2V0dGluZ3MuaGVhZGluZyAgICAgICAgPSAkKCdpbnB1dFtuYW1lPWhlYWRpbmddOmNoZWNrZWQnKS52YWwoKVxuXHRzZXR0aW5ncy5sb29rYXQgICAgICAgICA9ICQoJyNsb29rYXQnKS52YWwoKVxuXHRzZXR0aW5ncy56b29tXHQgICAgICAgID0gJCgnI3pvb20nKS52YWwoKVxuXHRzZXR0aW5ncy5zdGVwXHQgICAgICAgID0gJCgnI3N0ZXAnKS52YWwoKVxuXHRzZXR0aW5ncy5zZWFyY2hSYWRpdXNcdD0gJCgnI3NlYXJjaC1yYWRpdXMnKS52YWwoKVxuXHRzZXR0aW5ncy52ZXJzaW9uIFx0XHQ9IFZFUlNJT05cblxuXHQjIHNhdmUgdG8gd2ViIHN0b3JhZ2Vcblx0JC5leHRlbmQoc3RvcmFnZSwgc2V0dGluZ3MpXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgb24gbG9hZFxuXG4kIC0+XG5cblx0Y2FudmFzID0gJCgnI3Bhbm9yYW1hJylbMF1cblxuXHQkKCcjY3JlYXRlJykub24gJ2NsaWNrJywgY3JlYXRlXG5cblx0R1NWSHlwZXJsYXBzZS5vbk1lc3NhZ2UgPSBvbk1lc3NhZ2Vcblx0R1NWSHlwZXJsYXBzZS5vblBhbm9yYW1hTG9hZCA9IG9uUGFub3JhbWFMb2FkXG5cdEdTVkh5cGVybGFwc2Uub25Qcm9ncmVzcyA9IG9uUHJvZ3Jlc3Ncblx0R1NWSHlwZXJsYXBzZS5vbkFuYWx5emVDb21wbGV0ZSA9IG9uQW5hbHl6ZUNvbXBsZXRlXG5cdEdTVkh5cGVybGFwc2Uub25DYW5jZWwgPSBvbkNhbmNlbFxuXG5cdHJlc3RvcmVTZXR0aW5ncygpXG5cblx0JCgnaW5wdXQnKS5vbiAnY2hhbmdlJywgdXBkYXRlU2V0dGluZ3NcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY3JlYXRlID0gLT5cblxuXHR1cGRhdGVTZXR0aW5ncygpXG5cblx0aW5kZXggPSB0YXNrcy5sZW5ndGhcblxuXHQkKCcudGFza3MnKS5hcHBlbmQoXCJcblx0XHQ8bGkgaWQ9J3Rhc2stI3tpbmRleH0nPlxuXHRcdFx0PGgxPiN7c2V0dGluZ3MubmFtZX08L2gxPlxuXHRcdFx0PGJ1dHRvbiBjbGFzcz0nYWN0aW9uJyBkYXRhLWluZGV4PScje2luZGV4fSc+Q2FuY2VsPC9idXR0b24+XG5cdFx0XHQ8cD5yZXF1ZXN0aW5nIHJvdXRlLi48YnI+PC9wPlxuXHRcdFx0PGRpdiBpZD0nbWFwLSN7aW5kZXh9JyBzdHlsZT0nd2lkdGg6IDQ4JTsgaGVpZ2h0OiAwOyBwYWRkaW5nLXRvcDogMjYlOyBiYWNrZ3JvdW5kOmdyYXk7IGRpc3BsYXk6IGlubGluZS1ibG9jazsnPjwvZGl2PlxuXHRcdDwvbGk+XG5cdFwiKVxuXG5cdGh5cGVybGFwc2UgPSBuZXcgR1NWSHlwZXJsYXBzZSggc2V0dGluZ3MgKVxuXHRoeXBlcmxhcHNlLnNldE1hcCggJChcIiNtYXAtI3tpbmRleH1cIilbMF0gKVxuXHRoeXBlcmxhcHNlLmNyZWF0ZSgpXG5cblx0JChcIiN0YXNrLSN7aW5kZXh9IGJ1dHRvblwiKS5vbiAnY2xpY2snLCAtPlxuXHRcdCRlbG0gPSAkKEApXG5cdFx0aW5kZXggPSAkZWxtLmF0dHIoJ2RhdGEtaW5kZXgnKVxuXHRcdHRhc2tzW2luZGV4XS5jYW5jZWwoKVxuXG5cblx0dGFza3MucHVzaCggaHlwZXJsYXBzZSApXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbm9uQ2FuY2VsID0gLT5cblx0aW5kZXggPSB0YXNrcy5pbmRleE9mKCBAIClcblx0JGVsbSA9ICQoXCIjdGFzay0je2luZGV4fVwiKVxuXG5cdCRidG4gPSAkKCc8YnV0dG9uPmRlbGV0ZTwvYnV0dG9uPjxicj4nKTtcblxuXHQkYnRuLm9uICdjbGljaycsIC0+XG5cdFx0JGVsbS5yZW1vdmUoKTtcblxuXHQkZWxtLmNoaWxkcmVuKCdwJylcblx0XHQuYXBwZW5kKCdjYW5jZWxlZDxicj4nKVxuXHRcdC5hcHBlbmQoICRidG4gKTtcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxub25BbmFseXplQ29tcGxldGUgPSAtPlxuXHRpbmRleCA9IHRhc2tzLmluZGV4T2YoIEAgKVxuXHQkZWxtID0gJChcIiN0YXNrLSN7aW5kZXh9XCIpXG5cblxuXHQkYnRuR2VuID0gJCgnPGJ1dHRvbj5nZW5lcmF0ZSBoeXBlcmxhcHNlPC9idXR0b24+PGJyPicpO1xuXG5cdCRidG5HZW4ub24gJ2NsaWNrJywgLT5cblx0XHR0YXNrc1tpbmRleF0uY29tcG9zZSgpXG5cblx0JGVsbS5jaGlsZHJlbigncCcpLmFwcGVuZCggJGJ0bkdlbiApO1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5vblByb2dyZXNzID0gKGxvYWRlZCwgdG90YWwpIC0+XG5cdGluZGV4ID0gdGFza3MuaW5kZXhPZiggQCApXG5cdCRlbG0gPSAkKFwiI3Rhc2stI3tpbmRleH1cIilcblxuXHRpZiBsb2FkZWQgPCAxXG5cdFx0JGVsbS5jaGlsZHJlbigncCcpLmFwcGVuZCggJCgnPHByb2dyZXNzPjwvcHJvZ3Jlc3M+JykpXG5cblx0JGVsbS5maW5kKFwicHJvZ3Jlc3NcIikubGFzdCgpXG5cdFx0LmF0dHJcblx0XHRcdHZhbHVlOiBsb2FkZWRcblx0XHRcdG1heDogdG90YWxcblx0XHRcdCdkYXRhLWxhYmVsJzogIFwiWyN7bG9hZGVkfS8je3RvdGFsfV1cIlxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5vbk1lc3NhZ2UgPSAobWVzc2FnZSkgLT5cblx0aW5kZXggPSB0YXNrcy5pbmRleE9mKCBAIClcblx0JGVsbSA9ICQoXCIjdGFzay0je2luZGV4fVwiKVxuXG5cdCRlbG0uY2hpbGRyZW4oJ3AnKS5hcHBlbmQoIG1lc3NhZ2UgKyBcIjxicj5cIiApXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbm9uUGFub3JhbWFMb2FkID0gKGlkeCwgY2FudmFzKSAtPlxuXHRpbmRleCA9IHRhc2tzLmluZGV4T2YoIEAgKVxuXHQkZWxtID0gJChcIiN0YXNrLSN7aW5kZXh9XCIpXG5cblx0JGVsbS5hcHBlbmQoIGNhbnZhcyApXG5cblx0IyBzYXZlIGltYWdlXG5cdHBhcmFtcyA9XG5cdFx0bmFtZTogQG5hbWVcblx0XHRkaXJlY3Rvcnk6IHNldHRpbmdzLmRpclxuXHRcdG51bWJlcjogaWR4XG5cdFx0aW1hZ2U6IGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycpXG5cblx0JC5hamF4IFxuXHRcdHR5cGU6IFwiUE9TVFwiXG5cdFx0dXJsOiAnLi9zYXZlLnBocCdcblx0XHRkYXRhOiBwYXJhbXNcblx0XHRzdWNjZXNzOiAoanNvbikgLT5cblx0XHRcdHJlc3VsdCA9ICQucGFyc2VKU09OKCBqc29uIClcblx0XHRcdGlmIHJlc3VsdC5zdGF0dXMgIT0gXCJzdWNjZXNzXCJcblx0XHRcdFx0c2VsZi5jYW5jZWwoKVxuXHRcdFx0XHQkZWxtLmNoaWxkcmVuKCdwJykuYXBwZW5kKFwiYW4gZXJyb3Igb2NjdXJlZFwiICsgXCI8YnI+XCIpXG4iXX0=