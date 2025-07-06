var map;
var minValue;

//Creates the map and the precise location and zoom level.
function createMap() {
  map = L.map('mapid').setView([33.3848, -111.9093], 11.25);
  L.tileLayer('https://tile.jawg.io/jawg-streets/{z}/{x}/{y}{r}.png?access-token=u45wMoF3kHbpkQ2FWaBw45sY8X2FKi9O1AmCvSYfaxyQLTCeHDqv8eubPN4OrmWw', {}).addTo(map);
  map.attributionControl.addAttribution("<a href=\"https://www.jawg.io?utm_medium=map&utm_source=attribution\" target=\"_blank\">&copy; Jawg</a> - <a href=\"https://www.openstreetmap.org?utm_medium=map-attribution&utm_source=jawg\" target=\"_blank\">&copy; OpenStreetMap</a>&nbsp;contributors");

  getData();
};

//Calculates the minumum value shown to query out data.
function calculateMinValue(data) {
  var allValues = [];
  for (var feature of data.features) {
    if (feature.properties && feature.properties.Totalfatalities > 0) {
      allValues.push(feature.properties.Totalfatalities);
    }
  }
  return Math.min(...allValues);
}

//Calculates the size of the visible dots on the map based off their values.
function calcPropRadius(attValue) {
  var minRad = 5;
  var radius = 1.0083 * Math.pow(attValue / minValue, 0.5715) * minRad;
  return radius;
}

//Attributes that determine the looks of the points. This function also includes a
//popup bar for further details and filters all the data to show points.
function createPropSymbols(json, yearFilter = null) {
  if (!map) return;

  //This function removes the existing tilelayer so another tilelayer can
  //replace it. This is to show the accident data that happens each year.
  map.eachLayer(layer => {
    if (layer.feature) {
      map.removeLayer(layer);
    }
  });

  //This creates the looks of the features shown on the map.
  var geojsonMarkerOptions = {
    fillColor: "#ff0000",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  };


  L.geoJson(json, {
    //This function filters the years and the number of fatalities per accident.
    filter: function (feature) {
      return (
        feature.properties.Totalfatalities > 0 &&
        (yearFilter === null || feature.properties.Year === yearFilter)
      );
    },
    //This helps resize and shape the features based off number of fatalities.
    pointToLayer: function (feature, latlng) {
      var attValue = Number(feature.properties.Totalfatalities);
      geojsonMarkerOptions.radius = calcPropRadius(attValue);
      return L.circleMarker(latlng, geojsonMarkerOptions);
    },
    //Creates a popup that shows the incident id, date/time of crash, street name and number of fatalities.
    onEachFeature: function (feature, layer) {
      var property = feature.properties;
      var popupContent =
        "<b>Incident ID:</b> " + property.Incidentid + "<br>" +
        "<b>Date/Time:</b> " + property.DateTime + "<br>" +
        "<b>Street:</b> " + property.StreetName + "<br>" +
        "<b>Fatalities:</b> " + property.Totalfatalities;
      layer.bindPopup(popupContent, {
        offset: new L.Point(0, -geojsonMarkerOptions.radius)
      });
    }
  }).addTo(map);
}

//Data that helps cycle through different years for the UI.
function processData(data) {
  var years = new Set();
  data.features.forEach(feature => {
    var year = feature.properties.Year;
    if (year >= 2012 && year <=2023){
      years.add(year);
    }
  });
  return Array.from(years).sort();
}

//Adds the sliders and buttons, as well as controls the increments in which
//each button and slider goes (with each slider/button being a year).
function createSequenceControls(years, jsonData) {
  var panel = document.querySelector("#panel");

  var sliderHTML = "<input class='range-slider' type='range'></input>";
  panel.insertAdjacentHTML('beforeend', sliderHTML);

  var slider = document.querySelector(".range-slider");
  slider.min = 0;
  slider.max = years.length - 1;
  slider.value = 0;
  slider.step = 1;

  slider.addEventListener("input", function () {
    var index = parseInt(this.value);
    var selectedYear = years[index];
    createPropSymbols(jsonData, selectedYear);
  });

  panel.insertAdjacentHTML('beforeend', '<button class="step" id="reverse">Reverse</button>');
  panel.insertAdjacentHTML('beforeend', '<button class="step" id="forward">Forward</button>');

  document.querySelectorAll('.step').forEach(button => {
    button.addEventListener("click", function () {
      let index = parseInt(slider.value);
      if (this.id === "forward") {
        index = (index + 1) % years.length;
      } else if (this.id === "reverse") {
        index = (index - 1 + years.length) % years.length;
      }
      slider.value = index;
      var selectedYear = years[index];
      createPropSymbols(jsonData, selectedYear);
    });
  });
}

//Loads data from directory.
function getData() {
  fetch("data/1.08_Crash_Data_Report_(detail).geojson")
    .then(response => response.json())
    .then(json => {
      minValue = calculateMinValue(json);
      var years = processData(json);
      createPropSymbols(json, years[0]);
      createSequenceControls(years, json);
    });
}

//Changes the shape of the symbols on the map, as well as the popup content.
function updatePropSymbols(attribute) {
  map.eachLayer(function (layer) {
    if (layer.feature && layer.feature.properties[attribute]) {
      var property = layer.feature.properties;
      var radius = calcPropRadius(property[attribute]);

      layer.setRadius(radius);

      var popupContent = "<b>Incident ID:</b> " + property.Incidentid + "<br>" +
        "<b>Date/Time:</b> " + property.DateTime + "<br>" +
        "<b>Street:</b> " + property.StreetName + "<br>" +
        "<b>" + attribute + " Fatalities:</b> " + proper[attribute];

      layer.bindPopup(popupContent, {
        offset: new L.Point(0, -radius)
      });
    }
  });
}
document.addEventListener('DOMContentLoaded', createMap);