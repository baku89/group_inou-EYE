var $addList, $autosearch, $form, $status, API_KEY, FPS, SUFFIX, VERSION, bLinkUpdate, bThrough, clear, cntMarker, exportJson, json, list, load, map, markerList, onLinksChanged, prevDate, prevId, service, setPano, settings, storage, svp, undo, updateSettings, updateStatus, urlReg;

API_KEY = "AIzaSyBQ2dzDfyF8Y0Dwe-Q6Jzx4_G62ANrTotQ";

VERSION = '0.1';

SUFFIX = 'pip';

FPS = 24.0;

storage = localStorage;

settings = {};

map = null;

svp = null;

urlReg = /!1s(.*)!2e/;

list = [];

$status = null;

$autosearch = null;

$addList = null;

$form = null;

prevId = '';

cntMarker = null;

bLinkUpdate = false;

bThrough = false;

prevDate = null;

service = new google.maps.StreetViewService();

markerList = [];

updateSettings = function() {
  return $form.find('input, textarea').each(function() {
    var type;
    type = $(this).attr('type');
    if (type === 'checkbox' || type === 'radio') {
      return settings[this.name] = $(this).is(':checked');
    } else {
      return settings[this.name] = $(this).val();
    }
  });
};

$(function() {
  var options;
  $form = $('#panoid-parser');
  $status = $('#status');
  $autosearch = $('[name=autosearch');
  $addList = $('[name=addlist]');
  $('#laod').on('click', load);
  $('#clear').on('click', clear);
  $('#undo').on('click', undo);
  $('#set-pano').on('click', setPano);
  $('#export').on('click', exportJson);
  $('input, textarea').on('change', updateSettings);
  $form.sisyphus();
  options = {
    zoom: 16,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map($('#map')[0], options);
  options = {
    enableCloseButton: false,
    imageDateControl: true
  };
  svp = new google.maps.StreetViewPanorama($('#svp')[0], options);
  cntMarker = new google.maps.Marker({
    map: map,
    icon: 'http://www.googlemapsmarkers.com/v1/009900'
  });
  return google.maps.event.addListener(svp, 'links_changed', onLinksChanged);
});

json = "";

undo = function() {
  if (list.length <= 1) {
    alert("cannot undo anymore");
    return;
  }
  markerList[markerList.length - 1].setMap(null);
  markerList.pop();
  list.pop();
  prevId = list.length >= 2 ? list[list.length - 2] : "";
  bThrough = true;
  svp.setPano(list[list.length - 1]);
  return updateSettings();
};

clear = function() {
  var i, len, m;
  console.log("clear");
  list.length = 0;
  for (i = 0, len = markerList.length; i < len; i++) {
    m = markerList[i];
    console.log(m);
    m.setMap(null);
  }
  markerList.length = 0;
  prevId = '';
  return updateStatus();
};

exportJson = function() {
  console.log("export");
  json = JSON.stringify(list);
  return $('#json').val(json);
};

load = function() {
  var panoId, result;
  updateSettings();
  result = urlReg.exec(settings.url);
  if (result != null) {
    panoId = result[1];
  } else {
    panoId = settings.url;
  }
  return svp.setPano(panoId);
};

updateStatus = function() {
  return $status.html("count: " + list.length + "<br>duration: " + ((list.length / FPS).toPrecision(2)));
};

setPano = function() {
  var newPano;
  newPano = map.getStreetView().getPano();
  return svp.setPano(newPano);
};

onLinksChanged = function() {
  var id, l, links, pos;
  links = svp.getLinks();
  if (!bLinkUpdate) {
    links = (function() {
      var i, len, results;
      results = [];
      for (i = 0, len = links.length; i < len; i++) {
        l = links[i];
        if (l.pano !== prevId) {
          results.push(l);
        }
      }
      return results;
    })();
    bLinkUpdate = true;
    svp.setLinks(links);
    return;
  }
  bLinkUpdate = false;
  pos = svp.getPosition();
  id = svp.getPano();
  if (bThrough) {
    map.setCenter(pos);
    cntMarker.setPosition(pos);
    bThrough = false;
    return;
  }
  return service.getPanoramaById(id, (function(_this) {
    return function(data, status) {
      var date, marker, nextId;
      if (status !== google.maps.StreetViewStatus.OK) {
        alert('cannot retrive pano id');
        return;
      }
      date = data.imageDate;
      if ((prevDate != null) && date !== prevDate) {
        $('#console').append("date changed: " + prevDate + " -> " + date);
      }
      prevDate = date;
      map.setCenter(pos);
      cntMarker.setPosition(pos);
      if ($addList.prop('checked')) {
        list.push(id);
        marker = new google.maps.Marker({
          position: pos,
          map: map,
          title: "" + (list.length - 1)
        });
        markerList.push(marker);
        updateStatus();
      }
      nextId = void 0;
      if ($autosearch.prop('checked')) {
        if (links.length === 1) {
          nextId = links[0].pano;
        }
      }
      prevId = svp.getPano();
      if (nextId != null) {
        return setTimeout(function() {
          return svp.setPano(nextId);
        }, 50);
      }
    };
  })(this));
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBhbm9pZC1wYXJzZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLElBQUE7O0FBQUEsT0FBQSxHQUFVOztBQUNWLE9BQUEsR0FBVTs7QUFDVixNQUFBLEdBQVM7O0FBQ1QsR0FBQSxHQUFNOztBQUdOLE9BQUEsR0FBVTs7QUFFVixRQUFBLEdBQVc7O0FBRVgsR0FBQSxHQUFNOztBQUNOLEdBQUEsR0FBTTs7QUFFTixNQUFBLEdBQVM7O0FBRVQsSUFBQSxHQUFPOztBQUdQLE9BQUEsR0FBVTs7QUFDVixXQUFBLEdBQWM7O0FBQ2QsUUFBQSxHQUFXOztBQUNYLEtBQUEsR0FBUTs7QUFFUixNQUFBLEdBQVM7O0FBRVQsU0FBQSxHQUFZOztBQUVaLFdBQUEsR0FBYzs7QUFDZCxRQUFBLEdBQVc7O0FBRVgsUUFBQSxHQUFXOztBQUVYLE9BQUEsR0FBYyxJQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsaUJBQVosQ0FBQTs7QUFFZCxVQUFBLEdBQWE7O0FBTWIsY0FBQSxHQUFpQixTQUFBO1NBQ2hCLEtBQUssQ0FBQyxJQUFOLENBQVcsaUJBQVgsQ0FBNkIsQ0FBQyxJQUE5QixDQUFtQyxTQUFBO0FBQ2xDLFFBQUE7SUFBQSxJQUFBLEdBQU8sQ0FBQSxDQUFFLElBQUYsQ0FBTyxDQUFDLElBQVIsQ0FBYSxNQUFiO0lBQ1AsSUFBRyxJQUFBLEtBQVEsVUFBUixJQUFzQixJQUFBLEtBQVEsT0FBakM7YUFDQyxRQUFTLENBQUEsSUFBSSxDQUFDLElBQUwsQ0FBVCxHQUFzQixDQUFBLENBQUUsSUFBRixDQUFPLENBQUMsRUFBUixDQUFXLFVBQVgsRUFEdkI7S0FBQSxNQUFBO2FBR0MsUUFBUyxDQUFBLElBQUksQ0FBQyxJQUFMLENBQVQsR0FBc0IsQ0FBQSxDQUFFLElBQUYsQ0FBTyxDQUFDLEdBQVIsQ0FBQSxFQUh2Qjs7RUFGa0MsQ0FBbkM7QUFEZ0I7O0FBV2pCLENBQUEsQ0FBRSxTQUFBO0FBQ0QsTUFBQTtFQUFBLEtBQUEsR0FBUSxDQUFBLENB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SUFBRyxjQUFIO2VBQ0MsVUFBQSxDQUFXLFNBQUE7aUJBQ1YsR0FBRyxDQUFDLE9BQUosQ0FBYSxNQUFiO1FBRFUsQ0FBWCxFQUVFLEVBRkYsRUFERDs7SUExQzJCO0VBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE1QjtBQXRCZ0IiLCJmaWxlIjoicGFub2lkLXBhcnNlci5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbIkFQSV9LRVkgPSBcIkFJemFTeUJRMmR6RGZ5RjhZMER3ZS1RNkp6eDRfRzYyQU5yVG90UVwiXG5WRVJTSU9OID0gJzAuMSdcblNVRkZJWCA9ICdwaXAnXG5GUFMgPSAyNC4wXG5cblxuc3RvcmFnZSA9IGxvY2FsU3RvcmFnZVxuXG5zZXR0aW5ncyA9IHt9XG5cbm1hcCA9IG51bGxcbnN2cCA9IG51bGxcblxudXJsUmVnID0gLyExcyguKikhMmUvXG5cbmxpc3QgPSBbXVxuXG4jIGpxXG4kc3RhdHVzID0gbnVsbFxuJGF1dG9zZWFyY2ggPSBudWxsXG4kYWRkTGlzdCA9IG51bGxcbiRmb3JtID0gbnVsbFxuXG5wcmV2SWQgPSAnJ1xuXG5jbnRNYXJrZXIgPSBudWxsXG5cbmJMaW5rVXBkYXRlID0gZmFsc2VcbmJUaHJvdWdoID0gZmFsc2VcblxucHJldkRhdGUgPSBudWxsXG5cbnNlcnZpY2UgPSBuZXcgZ29vZ2xlLm1hcHMuU3RyZWV0Vmlld1NlcnZpY2UoKVxuXG5tYXJrZXJMaXN0ID0gW11cblxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIGZ1bmNcblxudXBkYXRlU2V0dGluZ3MgPSAtPlxuXHQkZm9ybS5maW5kKCdpbnB1dCwgdGV4dGFyZWEnKS5lYWNoIC0+XG5cdFx0dHlwZSA9ICQodGhpcykuYXR0cigndHlwZScpXG5cdFx0aWYgdHlwZSA9PSAnY2hlY2tib3gnIHx8IHR5cGUgPT0gJ3JhZGlvJ1xuXHRcdFx0c2V0dGluZ3NbdGhpcy5uYW1lXSA9ICQodGhpcykuaXMoJzpjaGVja2VkJylcblx0XHRlbHNlXG5cdFx0XHRzZXR0aW5nc1t0aGlzLm5hbWVdID0gJCh0aGlzKS52YWwoKVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIGluaXRcblxuJCAtPlxuXHQkZm9ybSA9ICQoJyNwYW5vaWQtcGFyc2VyJylcblx0JHN0YXR1cyA9ICQoJyNzdGF0dXMnKVxuXHQkYXV0b3NlYXJjaCA9ICQoJ1tuYW1lPWF1dG9zZWFyY2gnKVxuXHQkYWRkTGlzdCA9ICQoJ1tuYW1lPWFkZGxpc3RdJylcblxuXHQkKCcjbGFvZCcpLm9uICdjbGljaycsIGxvYWRcblx0JCgnI2NsZWFyJykub24gJ2NsaWNrJywgY2xlYXJcblx0JCgnI3VuZG8nKS5vbiAnY2xpY2snLCB1bmRvXG5cdCQoJyNzZXQtcGFubycpLm9uICdjbGljaycsIHNldFBhbm9cblx0JCgnI2V4cG9ydCcpLm9uICdjbGljaycsIGV4cG9ydEpzb25cblxuXHQkKCdpbnB1dCwgdGV4dGFyZWEnKS5vbiAnY2hhbmdlJywgdXBkYXRlU2V0dGluZ3NcblxuXHQkZm9ybS5zaXN5cGh1cygpXG5cblx0b3B0aW9ucyA9IFxuXHRcdHpvb206IDE2XG5cdFx0bWFwVHlwZUlkOiBnb29nbGUubWFwcy5NYXBUeXBlSWQuUk9BRE1BUFxuXG5cdG1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAoICQoJyNtYXAnKVswXSwgb3B0aW9ucylcblxuXHRvcHRpb25zID1cblx0XHRlbmFibGVDbG9zZUJ1dHRvbjogZmFsc2Vcblx0XHRpbWFnZURhdGVDb250cm9sOiB0cnVlXG5cblx0c3ZwID0gbmV3IGdvb2dsZS5tYXBzLlN0cmVldFZpZXdQYW5vcmFtYSggJCgnI3N2cCcpWzBdLCBvcHRpb25zIClcblxuXHRjbnRNYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyXG5cdFx0bWFwOiBtYXBcblx0XHRpY29uOiAnaHR0cDovL3d3dy5nb29nbGVtYXBzbWFya2Vycy5jb20vdjEvMDA5OTAwJ1xuXG5cdGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKHN2cCwgJ2xpbmtzX2NoYW5nZWQnLCBvbkxpbmtzQ2hhbmdlZClcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBhY3Rpb25cblxuanNvbiA9IFwiXCIgXG5cbnVuZG8gPSAtPlxuXHRpZiBsaXN0Lmxlbmd0aCA8PSAxXG5cdFx0YWxlcnQoXCJjYW5ub3QgdW5kbyBhbnltb3JlXCIpXG5cdFx0cmV0dXJuXG5cblx0bWFya2VyTGlzdFttYXJrZXJMaXN0Lmxlbmd0aC0xXS5zZXRNYXAobnVsbClcblx0bWFya2VyTGlzdC5wb3AoKVxuXHRsaXN0LnBvcCgpXG5cdFxuXHRwcmV2SWQgPSBpZiBsaXN0Lmxlbmd0aCA+PSAyIHRoZW4gbGlzdFtsaXN0Lmxlbmd0aC0yXSBlbHNlIFwiXCJcblxuXHRiVGhyb3VnaCA9IHRydWVcblx0c3ZwLnNldFBhbm8oIGxpc3RbbGlzdC5sZW5ndGgtMV0gKVxuXG5cdHVwZGF0ZVNldHRpbmdzKClcblxuY2xlYXIgPSAtPlxuXHRjb25zb2xlLmxvZyBcImNsZWFyXCJcblx0bGlzdC5sZW5ndGggPSAwXG5cdGZvciBtIGluIG1hcmtlckxpc3Rcblx0XHRjb25zb2xlLmxvZyBtXG5cdFx0bS5zZXRNYXAobnVsbClcblx0bWFya2VyTGlzdC5sZW5ndGggPSAwXG5cdHByZXZJZCA9ICcnXG5cdHVwZGF0ZVN0YXR1cygpXG5cbmV4cG9ydEpzb24gPSAtPlxuXHRjb25zb2xlLmxvZyBcImV4cG9ydFwiXG5cdGpzb24gPSBKU09OLnN0cmluZ2lmeSggbGlzdCApXG5cdCQoJyNqc29uJykudmFsKCBqc29uIClcblxuXG5sb2FkID0gLT5cblx0dXBkYXRlU2V0dGluZ3MoKVxuXG5cdHJlc3VsdCA9IHVybFJlZy5leGVjKCBzZXR0aW5ncy51cmwgKVxuXG5cdGlmIHJlc3VsdD9cblx0XHRwYW5vSWQgPSByZXN1bHRbMV1cblx0ZWxzZVxuXHRcdHBhbm9JZCA9IHNldHRpbmdzLnVybFxuXG5cdHN2cC5zZXRQYW5vKCBwYW5vSWQgKVxuXG5cbnVwZGF0ZVN0YXR1cyA9IC0+XG5cdCRzdGF0dXMuaHRtbChcImNvdW50OiAje2xpc3QubGVuZ3RofTxicj5kdXJhdGlvbjogI3sobGlzdC5sZW5ndGggLyBGUFMpLnRvUHJlY2lzaW9uKDIpfVwiKVxuXG5zZXRQYW5vID0gLT5cblx0bmV3UGFubyA9IG1hcC5nZXRTdHJlZXRWaWV3KCkuZ2V0UGFubygpXG5cdHN2cC5zZXRQYW5vKCBuZXdQYW5vIClcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBldnRcblxub25MaW5rc0NoYW5nZWQgPSAtPlxuXG5cdGxpbmtzID0gc3ZwLmdldExpbmtzKClcblxuXHQjIHNldCBsaW5rc1xuXHRpZiBub3QgYkxpbmtVcGRhdGVcblx0XHRsaW5rcyA9IChsIGZvciBsIGluIGxpbmtzIHdoZW4gbC5wYW5vICE9IHByZXZJZClcblx0XHRiTGlua1VwZGF0ZSA9IHRydWVcblx0XHRzdnAuc2V0TGlua3MoIGxpbmtzIClcblx0XHRyZXR1cm5cblxuXHRiTGlua1VwZGF0ZSA9IGZhbHNlXG5cblx0cG9zID0gc3ZwLmdldFBvc2l0aW9uKClcblx0aWQgPSBzdnAuZ2V0UGFubygpXG5cblx0aWYgYlRocm91Z2hcblx0XHRtYXAuc2V0Q2VudGVyKCBwb3MgKVxuXHRcdGNudE1hcmtlci5zZXRQb3NpdGlvbiggcG9zIClcblx0XHRiVGhyb3VnaCA9IGZhbHNlXG5cdFx0cmV0dXJuXG5cdFx0XG5cdHNlcnZpY2UuZ2V0UGFub3JhbWFCeUlkIGlkLCAoZGF0YSwgc3RhdHVzKSA9PlxuXG5cdFx0aWYgc3RhdHVzICE9IGdvb2dsZS5tYXBzLlN0cmVldFZpZXdTdGF0dXMuT0sgXG5cdFx0XHRhbGVydCgnY2Fubm90IHJldHJpdmUgcGFubyBpZCcpXG5cdFx0XHRyZXR1cm5cblxuXHRcdCMgY2hlY2sgaWYgZGF0ZSBpcyBjb3JyZWN0XG5cdFx0ZGF0ZSA9IGRhdGEuaW1hZ2VEYXRlXG5cdFx0aWYgcHJldkRhdGU/ICYmIGRhdGUgIT0gcHJldkRhdGVcblx0XHRcdCMgaWYgIWNvbmZpcm0oJ2ltYWdlRGF0ZSBjaGFuZ2VkLiBjb250aW51ZT8nKVxuXHRcdFx0IyBcdHByZXZEYXRlID0gZGF0ZVxuXHRcdFx0IyBcdHN2cC5zZXRQYW5vKHByZXZJZClcblx0XHRcdCMgXHRyZXR1cm5cblx0XHRcdCQoJyNjb25zb2xlJykuYXBwZW5kKFwiZGF0ZSBjaGFuZ2VkOiAje3ByZXZEYXRlfSAtPiAje2RhdGV9XCIpXG5cdFx0cHJldkRhdGUgPSBkYXRlXG5cblx0XHRtYXAuc2V0Q2VudGVyKCBwb3MgKVxuXHRcdGNudE1hcmtlci5zZXRQb3NpdGlvbiggcG9zIClcblxuXHRcdCMgYWRkIG1hcmtlclxuXHRcdGlmICRhZGRMaXN0LnByb3AoJ2NoZWNrZWQnKVxuXG5cdFx0XHRsaXN0LnB1c2goIGlkIClcblxuXHRcdFx0bWFya2VyID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlclxuXHRcdFx0XHRwb3NpdGlvbjogcG9zXG5cdFx0XHRcdG1hcDogbWFwXG5cdFx0XHRcdHRpdGxlOiBcIiN7bGlzdC5sZW5ndGggLSAxfVwiXG5cblx0XHRcdG1hcmtlckxpc3QucHVzaCggbWFya2VyIClcblxuXHRcdFx0dXBkYXRlU3RhdHVzKClcblxuXHRcdCMgYXV0b3NlcmFjaFxuXHRcdG5leHRJZCA9IHVuZGVmaW5lZFxuXG5cdFx0aWYgJGF1dG9zZWFyY2gucHJvcCgnY2hlY2tlZCcpXG5cdFx0XHRpZiBsaW5rcy5sZW5ndGggPT0gMVxuXHRcdFx0XHRuZXh0SWQgPSBsaW5rc1swXS5wYW5vXG5cblx0XHRwcmV2SWQgPSBzdnAuZ2V0UGFubygpXG5cblx0XHRpZiBuZXh0SWQ/XG5cdFx0XHRzZXRUaW1lb3V0IC0+XG5cdFx0XHRcdHN2cC5zZXRQYW5vKCBuZXh0SWQgKVxuXHRcdFx0LCA1MFxuXG5cbiJdfQ==