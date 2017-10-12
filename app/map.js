function RunMap(el) {
  let mapMarker;
  let map;

  initMap()

  function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 35.047, lng: -85.293},
      zoom: 15,
      mapTypeId: 'terrain',
      disableDefaultUI: true,
      styles: mapStyle()
    });
    var pinIcon = new google.maps.MarkerImage(
      "map-icon.png", null, null, null, new google.maps.Size(15, 15)
    );
    mapMarker = new google.maps.Marker({
      position: {lat: 35.047, lng: -85.293},
      clickable: false,
      map: map
    });
    mapMarker.setIcon(pinIcon);
  }

  function update(lat, lon) {
    var newPos = new google.maps.LatLng(lat, lon);
    mapMarker.setPosition(newPos);
    map.panTo(newPos);
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

  return { update: update }
}
