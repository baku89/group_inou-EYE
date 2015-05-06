var $addList, $autosearch, $status, API_KEY, FPS, SUFFIX, VERSION, bLinkUpdate, clear, cntMarker, exportJson, list, load, map, onLinksChanged, prevDate, prevId, restoreSettings, service, settings, storage, svp, updateSettings, updateStatus, urlReg;

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

prevId = '';

cntMarker = null;

bLinkUpdate = false;

prevDate = null;

service = new google.maps.StreetViewService();

restoreSettings = function() {
  var $elm;
  $elm = $('nav');
  $('[name=url]').val(storage['pip-url']);
  $('[name=addlist]').prop('checked', storage['pip-addlist']);
  return $('[name=autosearch').prop('checked', storage['pip-autosearch']);
};

updateSettings = function() {
  var $elm, key, val;
  $elm = $('#nav');
  settings.url = $('[name=url]').val();
  settings.addlist = $('[name=addlist]').prop('checked');
  settings.autosearch = $('[name=autosearch]').prop('checked');
  for (key in settings) {
    val = settings[key];
    storage[SUFFIX + "-" + key] = val;
  }
  return console.log(storage);
};

$(function() {
  var options;
  $status = $('#status');
  $autosearch = $('[name=autosearch');
  $addList = $('[name=addlist]');
  $('#laod').on('click', load);
  $('#clear').on('click', clear);
  $('#export').on('click', exportJson);
  $('input, textarea').on('change', updateSettings);
  restoreSettings();
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

clear = function() {
  list = [];
  prevId = '';
  return updateStatus();
};

exportJson = function() {
  var json;
  json = JSON.stringify(list);
  return $('#json').html(json);
};

load = function() {
  var panoId, result;
  updateSettings();
  result = urlReg.exec(settings.url);
  panoId = result[1];
  return svp.setPano(panoId);
};

updateStatus = function() {
  return $status.html("count: " + list.length + "<br>duration: " + ((list.length / FPS).toPrecision(2)));
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
  return service.getPanoramaById(id, (function(_this) {
    return function(data, status) {
      var date, marker, nextId;
      if (status !== google.maps.StreetViewStatus.OK) {
        alert('cannot retrive pano id');
        return;
      }
      date = data.imageDate;
      console.log(date);
      if ((prevDate != null) && date !== prevDate) {
        if (!confirm('imageDate changed. continue?')) {
          prevDate = date;
          return;
        }
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
        return svp.setPano(nextId);
      }
    };
  })(this));
};

//# sourceMappingURL=data:application/json;base64,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QUNaO0FBQUEsVUFBQSxRQUFBLEVBQVUsR0FBVjtBQUFBLFVBQ0EsR0FBQSxFQUFLLEdBREw7QUFBQSxVQUVBLEtBQUEsRUFBTyxFQUFBLEdBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTCxHQUFjLENBQWYsQ0FGVDtTQURZLENBRmIsQ0FBQTtBQUFBLFFBT0EsWUFBQSxDQUFBLENBUEEsQ0FGRDtPQW5CQTtBQUFBLE1BK0JBLE1BQUEsR0FBUyxNQS9CVCxDQUFBO0FBaUNBLE1BQUEsSUFBRyxXQUFXLENBQUMsSUFBWixDQUFpQixTQUFqQixDQUFIO0FBQ0MsUUFBQSxJQUFHLEtBQUssQ0FBQyxNQUFOLEtBQWdCLENBQW5CO0FBQ0MsVUFBQSxNQUFBLEdBQVMsS0FBTSxDQUFBLENBQUEsQ0FBRSxDQUFDLElBQWxCLENBREQ7U0FERDtPQWpDQTtBQUFBLE1BcUNBLE1BQUEsR0FBUyxHQUFHLENBQUMsT0FBSixDQUFBLENBckNULENBQUE7QUF1Q0EsTUFBQSxJQUFHLGNBQUg7ZUFDQyxHQUFHLENBQUMsT0FBSixDQUFhLE1BQWIsRUFERDtPQXpDMkI7SUFBQSxFQUFBO0VBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE1QixFQWhCZ0I7QUFBQSxDQXZIakIsQ0FBQSIsImZpbGUiOiJwYW5vaWQtcGFyc2VyLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiQVBJX0tFWSA9IFwiQUl6YVN5QlEyZHpEZnlGOFkwRHdlLVE2Snp4NF9HNjJBTnJUb3RRXCJcblZFUlNJT04gPSAnMC4xJ1xuU1VGRklYID0gJ3BpcCdcbkZQUyA9IDI0LjBcblxuXG5zdG9yYWdlID0gbG9jYWxTdG9yYWdlXG5cbnNldHRpbmdzID0ge31cblxubWFwID0gbnVsbFxuc3ZwID0gbnVsbFxuXG51cmxSZWcgPSAvITFzKC4qKSEyZS9cblxubGlzdCA9IFtdXG5cbiMganFcbiRzdGF0dXMgPSBudWxsXG4kYXV0b3NlYXJjaCA9IG51bGxcbiRhZGRMaXN0ID0gbnVsbFxuXG5wcmV2SWQgPSAnJ1xuXG5jbnRNYXJrZXIgPSBudWxsXG5cbmJMaW5rVXBkYXRlID0gZmFsc2VcblxucHJldkRhdGUgPSBudWxsXG5cbnNlcnZpY2UgPSBuZXcgZ29vZ2xlLm1hcHMuU3RyZWV0Vmlld1NlcnZpY2UoKVxuXG5cblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBmdW5jXG5cbnJlc3RvcmVTZXR0aW5ncyA9IC0+XG5cdCRlbG0gPSAkKCduYXYnKVxuXG5cdCQoJ1tuYW1lPXVybF0nKS52YWwgc3RvcmFnZVsncGlwLXVybCddXG5cdCQoJ1tuYW1lPWFkZGxpc3RdJykucHJvcCgnY2hlY2tlZCcsIHN0b3JhZ2VbJ3BpcC1hZGRsaXN0J10pXG5cdCQoJ1tuYW1lPWF1dG9zZWFyY2gnKS5wcm9wKCdjaGVja2VkJywgc3RvcmFnZVsncGlwLWF1dG9zZWFyY2gnXSlcblxuXG51cGRhdGVTZXR0aW5ncyA9IC0+XG5cdCRlbG0gPSAkKCcjbmF2JylcblxuXHRzZXR0aW5ncy51cmwgPSAkKCdbbmFtZT11cmxdJykudmFsKClcblx0c2V0dGluZ3MuYWRkbGlzdCA9ICQoJ1tuYW1lPWFkZGxpc3RdJykucHJvcCgnY2hlY2tlZCcpXG5cdHNldHRpbmdzLmF1dG9zZWFyY2ggPSAkKCdbbmFtZT1hdXRvc2VhcmNoXScpLnByb3AoJ2NoZWNrZWQnKVxuXG5cdGZvciBrZXksIHZhbCBvZiBzZXR0aW5nc1xuXHRcdHN0b3JhZ2VbXCIje1NVRkZJWH0tI3trZXl9XCJdID0gdmFsXG5cblx0Y29uc29sZS5sb2cgc3RvcmFnZVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIGluaXRcblxuJCAtPlxuXHQkc3RhdHVzID0gJCgnI3N0YXR1cycpXG5cdCRhdXRvc2VhcmNoID0gJCgnW25hbWU9YXV0b3NlYXJjaCcpXG5cdCRhZGRMaXN0ID0gJCgnW25hbWU9YWRkbGlzdF0nKVxuXG5cdCQoJyNsYW9kJykub24gJ2NsaWNrJywgbG9hZFxuXHQkKCcjY2xlYXInKS5vbiAnY2xpY2snLCBjbGVhclxuXHQkKCcjZXhwb3J0Jykub24gJ2NsaWNrJywgZXhwb3J0SnNvblxuXHQkKCdpbnB1dCwgdGV4dGFyZWEnKS5vbiAnY2hhbmdlJywgdXBkYXRlU2V0dGluZ3NcblxuXHRyZXN0b3JlU2V0dGluZ3MoKVxuXG5cdG9wdGlvbnMgPSBcblx0XHR6b29tOiAxNlxuXHRcdG1hcFR5cGVJZDogZ29vZ2xlLm1hcHMuTWFwVHlwZUlkLlJPQURNQVBcblxuXHRtYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwKCAkKCcjbWFwJylbMF0sIG9wdGlvbnMpXG5cblx0b3B0aW9ucyA9XG5cdFx0ZW5hYmxlQ2xvc2VCdXR0b246IGZhbHNlXG5cdFx0aW1hZ2VEYXRlQ29udHJvbDogdHJ1ZVxuXG5cdHN2cCA9IG5ldyBnb29nbGUubWFwcy5TdHJlZXRWaWV3UGFub3JhbWEoICQoJyNzdnAnKVswXSwgb3B0aW9ucyApXG5cblx0Y250TWFya2VyID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlclxuXHRcdG1hcDogbWFwXG5cdFx0aWNvbjogJ2h0dHA6Ly93d3cuZ29vZ2xlbWFwc21hcmtlcnMuY29tL3YxLzAwOTkwMCdcblxuXHRnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihzdnAsICdsaW5rc19jaGFuZ2VkJywgb25MaW5rc0NoYW5nZWQpXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgYWN0aW9uXG5cbmNsZWFyID0gLT5cblx0bGlzdCA9IFtdXG5cdHByZXZJZCA9ICcnXG5cdHVwZGF0ZVN0YXR1cygpXG5cbmV4cG9ydEpzb24gPSAtPlxuXHRqc29uID0gSlNPTi5zdHJpbmdpZnkoIGxpc3QgKVxuXHQkKCcjanNvbicpLmh0bWwoIGpzb24gKVxuXG5cbmxvYWQgPSAtPlxuXHR1cGRhdGVTZXR0aW5ncygpXG5cblx0cmVzdWx0ID0gdXJsUmVnLmV4ZWMoIHNldHRpbmdzLnVybCApXG5cdHBhbm9JZCA9IHJlc3VsdFsxXVxuXHRcblx0c3ZwLnNldFBhbm8oIHBhbm9JZCApXG5cblxudXBkYXRlU3RhdHVzID0gLT5cblx0JHN0YXR1cy5odG1sKFwiY291bnQ6ICN7bGlzdC5sZW5ndGh9PGJyPmR1cmF0aW9uOiAjeyhsaXN0Lmxlbmd0aCAvIEZQUykudG9QcmVjaXNpb24oMil9XCIpXG5cblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBldnRcblxub25MaW5rc0NoYW5nZWQgPSAtPlxuXG5cdGxpbmtzID0gc3ZwLmdldExpbmtzKClcblxuXHQjIHNldCBsaW5rc1xuXHRpZiBub3QgYkxpbmtVcGRhdGVcblx0XHRsaW5rcyA9IChsIGZvciBsIGluIGxpbmtzIHdoZW4gbC5wYW5vICE9IHByZXZJZClcblx0XHRiTGlua1VwZGF0ZSA9IHRydWVcblx0XHRzdnAuc2V0TGlua3MoIGxpbmtzIClcblx0XHRyZXR1cm5cblxuXHRiTGlua1VwZGF0ZSA9IGZhbHNlXG5cblx0cG9zID0gc3ZwLmdldFBvc2l0aW9uKClcblx0aWQgPSBzdnAuZ2V0UGFubygpXG5cblx0c2VydmljZS5nZXRQYW5vcmFtYUJ5SWQgaWQsIChkYXRhLCBzdGF0dXMpID0+XG5cblx0XHRpZiBzdGF0dXMgIT0gZ29vZ2xlLm1hcHMuU3RyZWV0Vmlld1N0YXR1cy5PSyBcblx0XHRcdGFsZXJ0KCdjYW5ub3QgcmV0cml2ZSBwYW5vIGlkJylcblx0XHRcdHJldHVyblxuXG5cdFx0ZGF0ZSA9IGRhdGEuaW1hZ2VEYXRlXG5cblx0XHRjb25zb2xlLmxvZyBkYXRlXG5cblx0XHRpZiBwcmV2RGF0ZT8gJiYgZGF0ZSAhPSBwcmV2RGF0ZVxuXHRcdFx0aWYgIWNvbmZpcm0oJ2ltYWdlRGF0ZSBjaGFuZ2VkLiBjb250aW51ZT8nKVxuXHRcdFx0XHRwcmV2RGF0ZSA9IGRhdGVcblx0XHRcdFx0cmV0dXJuXG5cblx0XHRwcmV2RGF0ZSA9IGRhdGVcblxuXHRcdG1hcC5zZXRDZW50ZXIoIHBvcyApXG5cdFx0Y250TWFya2VyLnNldFBvc2l0aW9uKCBwb3MgKVxuXG5cdFx0IyBhZGQgbWFya2VyXG5cdFx0aWYgJGFkZExpc3QucHJvcCgnY2hlY2tlZCcpXG5cblx0XHRcdGxpc3QucHVzaCggaWQgKVxuXG5cdFx0XHRtYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyXG5cdFx0XHRcdHBvc2l0aW9uOiBwb3Ncblx0XHRcdFx0bWFwOiBtYXBcblx0XHRcdFx0dGl0bGU6IFwiI3tsaXN0Lmxlbmd0aCAtIDF9XCJcblxuXHRcdFx0dXBkYXRlU3RhdHVzKClcblxuXHRcdCMgYXV0b3NlcmFjaFxuXHRcdG5leHRJZCA9IHVuZGVmaW5lZFxuXG5cdFx0aWYgJGF1dG9zZWFyY2gucHJvcCgnY2hlY2tlZCcpXG5cdFx0XHRpZiBsaW5rcy5sZW5ndGggPT0gMVxuXHRcdFx0XHRuZXh0SWQgPSBsaW5rc1swXS5wYW5vXG5cblx0XHRwcmV2SWQgPSBzdnAuZ2V0UGFubygpXG5cblx0XHRpZiBuZXh0SWQ/XG5cdFx0XHRzdnAuc2V0UGFubyggbmV4dElkIClcblxuXG4iXX0=