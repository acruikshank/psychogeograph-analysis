function RunMap(el, cb) {
  let config = { showLocation: true }
  let redTransfer = new Uint8Array(256);
  let greenTransfer = new Uint8Array(256);
  let blueTransfer = new Uint8Array(256);
  let gradientStops = [
    {x: 0, r: 0, g: 171, b: 249},
    {x: .50, r: 190, g: 189, b: 195},
    {x: 1, r: 254, g: 30, b: 255}
    // {x: 0, r: 0, g: 107, b: 255},
    // {x: .18, r: 43, g: 138, b: 190},
    // {x: .50, r: 109, g: 130, b: 100},
    // {x: .77, r: 202, g: 135, b: 43},
    // {x: 1, r: 254, g: 73, b: 57}
  ]

  let currentLocation = ol.proj.fromLonLat([-85.293, 35.047]);
  let map;
  let initialTiles = 0;
  let markerStyle = new ol.style.Style({
    image: new ol.style.Circle({
      radius: 5, snapToPixel: false,
      fill: new ol.style.Fill({color: 'rgba(76, 157, 224, 0.62)'}),
      stroke: new ol.style.Stroke({ color: 'white', width: 1 })
    })
  });
  let mapViz = [];

  initMap()

  function initMap() {

    el.innerHTML = '';

    let source = new ol.source.OSM({
      url: 'https://api.mapbox.com/styles/v1/acruikshank/cjd9cm80m9ssn2rnvv3hjdpa0/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYWNydWlrc2hhbmsiLCJhIjoiY2piYXp3endqMTBrMTJycWZzOXJyNW1ybSJ9.8qqV2o6iC-B8CAALQkKfzw'
    })
    let imagery = new ol.layer.Tile({ source: source });

    map = new ol.Map({
      layers: [imagery],
      target: el,
      view: new ol.View({center: currentLocation, zoom: 15})
    });

    map.on('postcompose', function(event) {
      mapViz.forEach((feature) => event.vectorContext.drawFeature(feature, feature.getStyle()));
      if (config.showLocation) {
        var currentPoint = new ol.geom.Point(currentLocation);
        var feature = new ol.Feature(currentPoint);
        event.vectorContext.drawFeature(feature, markerStyle);
      }
    })

    if (cb) {
      source.on('tileloadstart', () => { initialTiles++ })
      source.on('tileloadend', () => {
        initialTiles--;
        if (initialTiles <= 0)
          setTimeout(() => { cb(); cb=undefined}, 500);
      })
    }

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
      map.getView().fit(extent, {padding: [5, 5, 5, 5], constrainResolution: false})

      let ranges = signal.ranges(data, startRange, endRange);
      let startIndex = data.indexAt(startRange / 1000);
      let endIndex = data.indexAt(endRange / 1000);

      mapViz = lerpSignalToSamples(signal, data, startRange, endRange).map(function(sample) {
        let currentPoint = new ol.geom.Point(ol.proj.fromLonLat([sample.lon, sample.lat]));
        let feature = new ol.Feature(currentPoint);

        if (!isNaN(sample.value)) {
          let overUnder = rerange(ranges.min, ranges.max, -1, 1, sample.value);
          feature.setStyle(new ol.style.Style({
            image: new ol.style.Circle({
              radius: rerange(0,1,2,4,Math.pow(Math.abs(overUnder),4)),
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

  // reduce over signal, adding samples with same location to cohort, and then lerping positions of cohort
  // from last location to next.
  function lerpSignalToSamples(signal, data, startRange, endRange) {
    let lerpState = signal.reduce(data, startRange, endRange, function(state, signal, i, sample) {
      let position = [sample[LON_SAMPLE], sample[LAT_SAMPLE]];
      state.cohort.push(signal);

      if (!state.lastPosition)
        state.lastPosition = position;

      if (state.lastPosition && !positionEqual(position, state.lastPosition)) {
        state.lerped = state.lerped.concat(state.cohort.map(function(signal, index) {
          // position has change, lerp all points between last position and current one
          return {
            value: signal,
            lon: rescale(0, state.cohort.length, state.lastPosition[0], position[0], index+1),
            lat: rescale(0, state.cohort.length, state.lastPosition[1], position[1], index+1)
          }
        }))
        state.cohort.length = 0;
        state.lastPosition = position;
      }
      return state
    }, {cohort: [], lerped: []});

    // use last know position to map remaining points
    let lastCohort = lerpState.cohort.map((s,i) => {return {value: s, lon: lerpState.lastPosition[0], lat: lerpState.lastPosition[1]}})

    return lerpState.lerped.concat(lastCohort)
  }

  function distance(a,b) { return Math.sqrt(Math.pow(a[0]-b[0],2) + Math.pow(a[1]-b[1],2))}

  function positionEqual(a, b) {
    return Math.abs(a[0] - b[0]) < .0005 && Math.abs(a[1] - b[1]) < .0005
  }

  function clamp(min, max, x) {
    return Math.min(max, Math.max(min, x))
  }

  function overUnderColor(x) {
    var color = gradient(rescale(-1,1,0,1,x), gradientStops);
    return 'rgba('+parseInt(color.r)+','+parseInt(color.g)+','+parseInt(color.b)+','+ rerange(0,1,.4,.6,Math.pow(x,4))+')' // rerange(0,1,.6,.8,Math.pow(x,4))
  }

  function rerange(a, b, c, d, x) {
    var prel = (x - a) / (b - a);
    return c + prel*(d - c);
  }

  function gradient(x, stopPoints) {
    let last = stopPoints[0];
    let next = stopPoints[0];
    for (let i=1; i<stopPoints.length && next.x < x; i++) {
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

  return { update: update, visualizeSignal: visualizeSignal, config: config }
}
