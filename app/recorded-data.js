RecordedData = function() {
  var data = [];
  var out = {};

  out.fetchData = function fetchData(file, cb) {
    var request = new XMLHttpRequest();
    request.open("GET", file, true);

    request.onreadystatechange = function() {
      if (request.readyState > 3) {
        if (request.status != 200)
          console.error(request.responseText);
        else
          uploadComplete(request.response, cb);
      }
    }
    request.send();
  }

  function uploadComplete(csv, cb) {
    for (var re = /(.*)\r?\n/gm, m, i=0; m = re.exec(csv); i++) {
      if (i>0) {
        var sample = new Float64Array(m[1].split(',').map(function(v) { return parseFloat(v) }));
        data.push(sample);
        out.startTime = Math.min(sample[0], out.startTime || sample[0]);
        out.endTime = Math.max(sample[0], out.endTime || sample[0]);
      }
    }

    out.samples = data.length;

    if (cb) cb();
  }

  out.sampleAt = function sampleAt(time, start, end) {
    start = start || 0;
    end = (end == null ? data.length : end);
    if (end - start < 2)
      return data[start];
    var midpoint = start + Math.floor((end-start)/2);
    return time < data[midpoint][0]
      ? sampleAt(time, start, midpoint)
      : sampleAt(time, midpoint, end)
  }

  out.indexAt  = function indexAt(time, start, end) {
    start = start || 0;
    end = (end == null ? data.length : end);
    if (end - start < 2)
      return start;
    var midpoint = start + Math.floor((end-start)/2);
    return time < data[midpoint][0]
      ? indexAt(time, start, midpoint)
      : indexAt(time, midpoint, end)
  }

  out.samplesInRange = function samplesInRange(start, end) {
    var startIndex = out.indexAt(start)
    var endIndex = out.indexAt(end)
    return data.slice(startIndex, endIndex)
  }

  return out;
};
