const platform = new H.service.Platform({
    'apikey': hereCredits.JSKEY
})
const defaultLayers = platform.createDefaultLayers()

const socket = io('/driver');     

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
    //  const dustbin = {lat:26.230784,lng:78.217216}
    var customStyle = {
      strokeColor: 'black',
      fillColor: 'rgba(255, 255, 255, 0.5)',
      lineWidth: 10,
      lineCap: 'square',
      lineJoin: 'bevel'
    };
    
    // Create a rectangle and pass the custom style as an options parameter:
    const shape = new H.geo.Rect(26.210, 78.207, 26.230, 78.227)
    var rect = new H.map.Rect(shape, 
      { style: customStyle });
    
    // Add the rectangle to the map:
    map.addObject(rect);
    // const geometry = shape.getGeometry();
    const wkt = shape.toString()
    
    // Zoom the map to fit the rectangle:
    map.getViewModel().setLookAtData({bounds: rect.getBoundingBox()});
 
    //Adding Behaviours to Maps
    const ui = H.ui.UI.createDefault(map, defaultLayers)
    const mapEvents = new H.mapevents.MapEvents(map)
    const behavior = new H.mapevents.Behavior(mapEvents) 
    geofencing = platform.getGeofencingService(); 

    //geofence upload
    const getLayers = ()=>{
        let fleetURL = "https://fleet.ls.hereapi.com/2/layers/list.json";
    
        return axios({
          method: 'get',
          url: fleetURL,
          params: {
            apiKey: hereCredits.JSKEY
          }
        })
        .then( response => {
          return response.data.layers
        })
        .catch( error => {
          console.log(error);
          return Promise.reject(error)
        })
    }
    
    const fenceRequest = (layerIds, position)=> {
        return new Promise((resolve, reject) => {
          geofencing.request(
            H.service.extension.geofencing.Service.EntryPoint.SEARCH_PROXIMITY,
            {
              'layer_ids': layerIds,
              'proximity': position.lat + "," + position.lng + "," + 100,
              'key_attributes': ['NAME']
            },
            result => {
              resolve(result)
            },
            error => {
              reject(error)
            }
          )
        })
    }
      
    getLayers().then(layers =>
        map.addEventListener("tap", (ev) => {
          var target = ev.target;
            
        //   map.removeObject(myPosition);
          myPosition = new H.map.Marker(map.screenToGeo(ev.currentPointer.viewportX, ev.currentPointer.viewportY));
          map.addObject(myPosition);
        console.log(myPosition);
          fenceRequest(layers, myPosition.b).then(result => {
              if(result.geometries.length > 0) {
                  socket.emit('withingeofence',myPosition.b);
              } else {
                  alert("You are outside of the geofence.")
              }
          });
        }, false)
      )

      const myPoints = [ {lat:26.22753654525063,lng:78.20984966626155},{lat:26.226493841398334,lng:78.21125860030465},
        {lat:26.218941858253277,lng:78.21073025044157},{lat:26.215244683811388,lng:78.2105541316707},
        {lat:26.215402685604293,lng:78.22182559756578}]
    
        myPoints.forEach((point) => {
            let marker = new H.map.Marker(point)
            marker.setData("User location")
            map.addObject(marker)                 
        }); 

    let imageIcon = new  H.map.Icon('./dustbin.png');

    // let pionterDustbin = new H.map.Marker(dustbin,{icon : imageIcon})
    // map.addObject(pionterDustbin)
    let pionterMarker = new H.map.Marker(myPosition)
    map.addObject(pionterMarker)

    var router = platform.getRoutingService(null,8);


    //all routing code
    socket.on('getSummary',startLocation=>{
        
        myPoints.forEach(myPosition=>{
            
            var routingParameters = {
                transportMode : "car",
                routingMode: 'fast',
                origin:""+startLocation.lat+","+startLocation.lng,
                destination :""+myPosition.lat+","+myPosition.lng,
                return :"polyline,summary"
            };
            
            router.calculateRoute(routingParameters,
                (result)=>{
                    console.log(result)
                    let totalLength,totalDuration;
            
                    if (result.routes.length) {
                        result.routes[0].sections.forEach((section) => {
                            // Create a linestring to use as a point source for the route line
                            let linestring = H.geo.LineString.fromFlexiblePolyline(section.polyline);
                    
                            // Create a polyline to display the route:
                            let routeLine = new H.map.Polyline(linestring, {
                            style: { strokeColor: 'blue', lineWidth: 3 }
                            });
                    
                            // Create a marker for the start point:
                            // let startMarker = new H.map.Marker(section.departure.place.location);
                    
                            // // Create a marker for the end point:
                            // let endMarker = new H.map.Marker(section.arrival.place.location);

                            totalLength = section.summary.length;
                            totalDuration = section.summary.duration;
                            console.log((totalDuration/60)+"min   "+totalLength/1000+"Km");
                    
                            // Add the route polyline and the two markers to the map:
                            // map.addObjects([routeLine]);
                    
                            // Set the map's viewport to make the whole route visible:
                            map.getViewModel().setLookAtData({bounds: routeLine.getBoundingBox()});
                        });
                    }
                },
                err=>console.error(err)
            )
        })

    })    
    let routeLines=null;
        socket.on('drawRoute',startPoint=>{
        //map.removeObject(myPosition);
        if(routeLines){
            map.removeObject(routeLines);
        }
        
        console.log(startPoint);
        var routingParameters = {
            transportMode : "car",
            routingMode: 'fast',
            origin:""+startPoint.lat+","+startPoint.lng,
            via:""+myPoints[0].lat+","+myPoints[0].lng,
            via:""+myPoints[4].lat+","+myPoints[4].lng,
            via:""+myPoints[2].lat+","+myPoints[2].lng,
            via:""+myPoints[1].lat+","+myPoints[1].lng,
            destination :""+myPoints[4].lat+","+myPoints[4].lng,
            return :"polyline,summary"
        };
        
        router.calculateRoute(routingParameters,
            (result)=>{
                console.log(result)
                let totalLength,totalDuration;
        
                if (result.routes.length) {
                    result.routes[0].sections.forEach((section) => {
                        // Create a linestring to use as a point source for the route line
                        let linestring = H.geo.LineString.fromFlexiblePolyline(section.polyline);
                
                        // Create a polyline to display the route:
                        let routeLine = new H.map.Polyline(linestring, {
                        style: { strokeColor: 'blue', lineWidth: 3 }
                        });
                
                        // Create a marker for the start point:
                        // let startMarker = new H.map.Marker(section.departure.place.location);
                
                        // // Create a marker for the end point:
                        // let endMarker = new H.map.Marker(section.arrival.place.location);
                
                        //Add the route polyline and the two markers to the map:
                        map.addObjects([routeLine]);
                
                        // Set the map's viewport to make the whole route visible:
                        map.getViewModel().setLookAtData({bounds: routeLine.getBoundingBox()});
                    });
                }
            },
            err=>console.error(err)
        )
    })
})


setInterval(()=>{
    navigator.geolocation.getCurrentPosition(pos=>{
        const {latitude:lat,longitude:lng} = pos.coords
        socket.emit('driverLocation',{lat,lng})
    },
    err=>{ console.error(err) })
},30000)



