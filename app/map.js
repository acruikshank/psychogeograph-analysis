function RunMap(el) {
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
      source: new ol.source.Stamen({
        layer: 'toner'
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
    return 'rgba('
      + parseInt(Math.max(0,rerange(-1,1,-255,255,x)))
      +',0,'
      + parseInt(Math.max(0,rerange(1,-1,-255,255,x)))
      +','
      +rerange(0,1,.05,.1,Math.abs(x)) + ')'
  }

  function rerange(a, b, c, d, x) {
    var prel = (x - a) / (b - a);
    return c + prel*(d - c);
  }

  function mapStyle() {
    return [
      {elementType: 'geometry', stylers: [{color: '#2d3036'}]},
      {elementType: 'labels.text.stroke', stylers: [{color: '#1c2128'}]},
      {elementType: 'labels.text.fill', stylers: [{color: '#746855'}]},
      { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{color: '#d59563'}] },
      { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{color: 'rgba(213, 149, 99, 0.51)'}] },
      { featureType: 'poi.park', elementType: 'geometry', stylers: [{color: '#263c3f'}] },
      { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{color: '#6b9a76'}] },
      { featureType: 'road', elementType: 'geometry', stylers: [{color: '#38414e'}] },
      { featureType: 'road', elementType: 'geometry.stroke', stylers: [{color: '#212a37'}] },
      { featureType: 'road', elementType: 'labels.text.fill', stylers: [{color: '#9ca5b3'}] },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{color: '#746855'}] },
      { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{color: '#1f2835'}] },
      { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{color: 'rgba(244, 209, 156, 0.52)'}] },
      { featureType: 'transit', elementType: 'geometry', stylers: [{color: '#2f3948'}] },
      { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{color: 'rgba(213, 149, 99, 0.5)'}] },
      { featureType: 'water', elementType: 'geometry', stylers: [{color: '#17263c'}] },
      { featureType: 'water', elementType: 'labels.text.fill', stylers: [{color: '#515c6d'}] },
      { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{color: '#17263c'}] }
    ]
  }

  return { update: update, visualizeSignal: visualizeSignal }
}
