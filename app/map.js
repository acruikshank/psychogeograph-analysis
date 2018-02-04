function RunMap(el) {
  let redTransfer = new Uint8Array(256);
  let greenTransfer = new Uint8Array(256);
  let blueTransfer = new Uint8Array(256);
  let gradientStops = [
    {x: 0, r: 0, g: 107, b: 255},
    {x: .24, r: 71, g: 176, b: 240},
    {x: .47, r: 163, g: 187, b: 165},
    {x: .77, r: 255, g: 172, b: 56},
    {x: 1, r: 254, g: 73, b: 57}
  ]

  let currentLocation = ol.proj.fromLonLat([-85.293, 35.047]);
  let map;
  let markerStyle = new ol.style.Style({
    image: new ol.style.Circle({
      radius: 7, snapToPixel: false,
      fill: new ol.style.Fill({color: '#4c9de1'}),
      stroke: new ol.style.Stroke({ color: 'white', width: 2 })
    })
  });
  let mapViz = [];

  initMap()

  function initMap() {

    document.getElementById('map').innerHTML = '';

    var imagery = new ol.layer.Tile({
      source: new ol.source.OSM({
        url: 'http://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
      })
    });

    map = new ol.Map({
      layers: [imagery],
      target: 'map',
      view: new ol.View({center: currentLocation, zoom: 15})
    });

    map.on('postcompose', function(event) {
      var currentPoint = new ol.geom.Point(currentLocation);
      var feature = new ol.Feature(currentPoint);
      mapViz.forEach((feature) => event.vectorContext.drawFeature(feature, feature.getStyle()));
      event.vectorContext.drawFeature(feature, markerStyle);
    })

    for (let i=0; i<256; i++) {
      redTransfer[i] = 32 + parseInt(i/255 * 400);
      greenTransfer[i] = 35 + parseInt(i/255 * 400);
      blueTransfer[i] = 41 + parseInt(i/255 * 400);
    }

    imagery.on('postcompose', function(event) {

      let context = event.context;
      let canvas = context.canvas;
      let width = canvas.width;
      let height = canvas.height;

      let inputData = context.getImageData(0, 0, width, height).data;

      let output = context.createImageData(width, height);
      let outputData = output.data;

      let byteCount = width*height*4;
      for (let i=0; i<byteCount; i++) {
        outputData[i] = redTransfer[inputData[i++]];
        outputData[i] = greenTransfer[inputData[i++]];
        outputData[i] = blueTransfer[inputData[i++]];
        outputData[i] = 255;
      }

      context.putImageData(output, 0, 0);
    });
  }

  function bounds(data, startRange, endRange) {
    var startIndex = data.indexAt(startRange / 1000);
    var endIndex = data.indexAt(endRange / 1000);

    var bounds = {lat: {}, lon: {}};
    for (var i=startIndex; i<=endIndex; i++) {
      var sample = data.data[i];
      bounds.lat.min = min(bounds.lat.min, sample[LAT_SAMPLE]);
      bounds.lat.max = max(bounds.lat.max, sample[LAT_SAMPLE]);
      bounds.lon.min = min(bounds.lon.min, sample[LON_SAMPLE]);
      bounds.lon.max = max(bounds.lon.max, sample[LON_SAMPLE]);
    }
    return bounds;
  }

  function min(a,b) {
    if (isNaN(b)) return a;
    if (isNaN(a)) return b;
    return Math.min(a,b)
  }

  function max(a,b) {
    if (isNaN(b)) return a;
    if (isNaN(a)) return b;
    return Math.max(a,b)
  }

  function update(lat, lon) {
    currentLocation = ol.proj.fromLonLat([lon, lat])
    map.getView().setCenter(currentLocation);
  }

  function visualizeSignal(data, signal, startRange, endRange) {
    var boundsRect = bounds(data, startRange, endRange)
    if (boundsRect.lon.min != boundsRect.lon.max && boundsRect.lat.min != boundsRect.lat.max) {
      var extent = ol.extent.boundingExtent([
        ol.proj.fromLonLat([boundsRect.lon.min, boundsRect.lat.min]),
        ol.proj.fromLonLat([boundsRect.lon.max, boundsRect.lat.max])
      ])
      map.getView().fit(extent, map.getSize())

      var ranges = signal.statRanges(data, startRange, endRange);
      var startIndex = data.indexAt(startRange / 1000);
      var endIndex = data.indexAt(endRange / 1000);

      mapViz = signal.map(data, startRange, endRange, function(signal, i, sample) {
        var currentPoint = new ol.geom.Point(ol.proj.fromLonLat([sample[LON_SAMPLE], sample[LAT_SAMPLE]]));
        var overUnder = clamp(-1, 1, rerange(ranges.min, ranges.max, -1, 1, signal));
        var feature = new ol.Feature(currentPoint);

        if (!isNaN(signal)) {
          feature.setStyle(new ol.style.Style({
            image: new ol.style.Circle({
              radius: rerange(0,1,2,8,Math.pow(Math.abs(overUnder),2)),
              snapToPixel: false,
              fill: new ol.style.Fill({color: overUnderColor(overUnder)})
            })
          }))
        }

        return feature
      });
      map.render();
    }
  }

  function clamp(min, max, x) {
    return Math.min(max, Math.max(min, x))
  }

  function overUnderColor(x) {
    var color = gradient(rescale(-1,1,0,1,x), gradientStops);
    return 'rgba('+parseInt(color.r)+','+parseInt(color.g)+','+parseInt(color.b)+','+rerange(0,1,.05,.1,Math.abs(x)) + ')'
  }

  function rerange(a, b, c, d, x) {
    var prel = (x - a) / (b - a);
    return c + prel*(d - c);
  }

  function gradient(x, stopPoints) {
    let last = stopPoints[0];
    let next = stopPoints[0];
    for (let i=1; i<stopPoints.length && last.x < x; i++) {
      last = next;
      next = stopPoints[i];
    }
    if ((next.x < x) || (next.x == last.x))
      return next;
    return {
      r: rescale(last.x, next.x, last.r, next.r, x),
      g: rescale(last.x, next.x, last.g, next.g, x),
      b: rescale(last.x, next.x, last.b, next.b, x)
    }
  }

  function rescale(a,b,c,d,x) {
    return c + (x - a) * (d - c) / (b - a);
  }

  return { update: update, visualizeSignal: visualizeSignal }
}
