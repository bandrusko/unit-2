//Initializes the map
var map;

//This function initiates the map, showing the leaflet on the website.
function createMap() {
    map = L.map('mapid').setView([33.4148, -111.9093], 11.8);
    L.tileLayer('https://tile.jawg.io/jawg-streets/{z}/{x}/{y}{r}.png?access-token=u45wMoF3kHbpkQ2FWaBw45sY8X2FKi9O1AmCvSYfaxyQLTCeHDqv8eubPN4OrmWw', {}).addTo(map);
    map.attributionControl.addAttribution("<a href=\"https://www.jawg.io?utm_medium=map&utm_source=attribution\" target=\"_blank\">&copy; Jawg</a> - <a href=\"https://www.openstreetmap.org?utm_medium=map-attribution&utm_source=jawg\" target=\"_blank\">&copy; OpenStreetMap</a>&nbsp;contributors");
    getData();
}

//Creates the data points by reading the geojson file from my given dataset.
function getData() {
    //Loads the data from the specific directory.
    fetch("data/1.08_Crash_Data_Report_(detail).geojson")
        .then(function (response) {
            return response.json();
        })
        //Determines what the points look like on the map, with each variable being adjustable to fit the map as it progresses.
        .then(function (json) {
            var geojsonMarkerOptions = {
                radius: 6,
                fillColor: "#ff0000",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            };
            //Filters the data from the geojson file to query out data on fatalities. This queries the Totalfatalities attribute to look for each crash with a fatality.
            //This is also created as a layer and adds it to the map.
            L.geoJson(json, {
                filter: function (feature, layer) {
                    return feature.properties.Totalfatalities > 0;
                },
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                },
                //Creates popups that show different attributes that were gathered for each crash.
                onEachFeature: function (feature, layer) {
                    if (feature.properties && feature.properties.Incidentid) {
                        layer.bindPopup(
                            "<b>Incident ID:</b> " + feature.properties.Incidentid + "<br>" +
                            "<b>Date/Time:</b> " + feature.properties.DateTime + "<br>" +
                            "<b>Street:</b> " + feature.properties.StreetName + "<br>" +
                            "<b>Total Fatalities:</b> " + feature.properties.Totalfatalities
                        );
                    }
                }
            }).addTo(map);
        });
}
document.addEventListener('DOMContentLoaded', createMap);