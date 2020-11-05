const platform = new H.service.Platform({
    'apikey': hereCredits.JSKEY
})

const defaultLayers = platform.createDefaultLayers()

    //Config. Maps
      

//Maps code
navigator.geolocation.getCurrentPosition(pos=>{

    let myPosition = {lat: pos.coords.latitude ,lng: pos.coords.longitude }    
    
    const map = new H.Map(
      document.getElementById('mapContainer'),
      defaultLayers.vector.normal.map,
      {
      zoom: 15,
      center: myPosition
      }
    )
    
    console.log(myPosition)
    const dustbin = {lat:22.9834229,lng:78.6968942}
 
    //Adding Behaviours to Maps
    const ui = H.ui.UI.createDefault(map, defaultLayers)
    const mapEvents = new H.mapevents.MapEvents(map)
    const behavior = new H.mapevents.Behavior(mapEvents)  

    let imageIcon = new  H.map.Icon('./dustbin.png');

    let pionterDustbin = new H.map.Marker(dustbin,{icon : imageIcon})
    map.addObject(pionterDustbin)
    let pionterMarker = new H.map.Marker(myPosition)
    map.addObject(pionterMarker)

    var router = platform.getRoutingService(null,8);

    var routingParameters = {
        transportMode : "car",
        routingMode: 'fast',
        origin:""+myPosition.lat+","+myPosition.lng,
        destination :""+dustbin.lat+","+dustbin.lng,
        return :"polyline"
    };
    
    router.calculateRoute(routingParameters,
        (result)=>{
            console.log(result)
    
            if (result.routes.length) {
                result.routes[0].sections.forEach((section) => {
                    // Create a linestring to use as a point source for the route line
                    let linestring = H.geo.LineString.fromFlexiblePolyline(section.polyline);
            
                    // Create a polyline to display the route:
                    let routeLine = new H.map.Polyline(linestring, {
                    style: { strokeColor: 'blue', lineWidth: 3 }
                    });
            
                    // Create a marker for the start point:
                    let startMarker = new H.map.Marker(section.departure.place.location);
            
                    // Create a marker for the end point:
                    let endMarker = new H.map.Marker(section.arrival.place.location);
            
                    // Add the route polyline and the two markers to the map:
                    map.addObjects([routeLine]);
            
                    // Set the map's viewport to make the whole route visible:
                    map.getViewModel().setLookAtData({bounds: routeLine.getBoundingBox()});
                });
            }
        },
        err=>console.error(err)
    )
})   



