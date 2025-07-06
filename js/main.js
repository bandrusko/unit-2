/*
=== STUDENT CODE REVIEW: GLOBAL VARIABLES ===
GOOD: You're using global variables for map and minValue that need to be shared across functions.
FEEDBACK: Consider using 'const' or 'let' instead of 'var' for modern JavaScript best practices.
LEARNING: Global variables should be used sparingly - only when data truly needs to be shared.
*/
var map;
var minValue;

//Creates the map and the precise location and zoom level.
/*
=== STUDENT CODE REVIEW: createMap() FUNCTION ===
EXCELLENT: Clear function name and single responsibility (creating the map).
GOOD: Using meaningful coordinates for Tempe, AZ and appropriate zoom level.
GOOD: Proper attribution for map tiles (legal requirement for many tile services).

LEARNING POINTS:
- The setView() coordinates [33.3848, -111.9093] center the map on Tempe
- Zoom level 11.25 provides good city-level detail
- Always include proper attribution when using third-party tile services

POTENTIAL IMPROVEMENTS:
- Consider making coordinates and zoom level configurable parameters
- Could add error handling for map initialization
- API key should ideally be stored in environment variables for security
*/
function createMap() {
  map = L.map('mapid').setView([33.3848, -111.9093], 11.25);
  L.tileLayer('https://tile.jawg.io/jawg-streets/{z}/{x}/{y}{r}.png?access-token=u45wMoF3kHbpkQ2FWaBw45sY8X2FKi9O1AmCvSYfaxyQLTCeHDqv8eubPN4OrmWw', {}).addTo(map);
  map.attributionControl.addAttribution("<a href=\"https://www.jawg.io?utm_medium=map&utm_source=attribution\" target=\"_blank\">&copy; Jawg</a> - <a href=\"https://www.openstreetmap.org?utm_medium=map-attribution&utm_source=jawg\" target=\"_blank\">&copy; OpenStreetMap</a>&nbsp;contributors");

  getData();
};

//Calculates the minumum value shown to query out data.
/*
=== STUDENT CODE REVIEW: calculateMinValue() FUNCTION ===
EXCELLENT: Clear purpose and good data validation with the > 0 check.
GOOD: Using modern for...of loop syntax.
GOOD: Proper error handling by checking if properties exist.

LEARNING POINTS:
- The spread operator (...) is used to pass array elements as arguments to Math.min()
- This function helps normalize data for consistent symbol sizing
- Filtering out zero values prevents misleading visualizations

MINOR SUGGESTION:
- Consider adding a comment explaining why you filter out fatalities <= 0
- The function name has a typo: "minumum" should be "minimum"
*/
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
/*
=== STUDENT CODE REVIEW: calcPropRadius() FUNCTION ===
ADVANCED: You're using proportional symbol scaling - this is sophisticated cartographic technique!
EXCELLENT: The mathematical formula creates visually appropriate scaling.

LEARNING POINTS:
- The formula 1.0083 * Math.pow(attValue / minValue, 0.5715) * minRad creates perceptual scaling
- Using square root scaling (power ~0.57) helps because human eyes perceive area, not radius
- This prevents large values from creating disproportionately huge symbols

MATHEMATICAL EXPLANATION:
- attValue / minValue: normalizes the data (makes it relative to minimum)
- Math.pow(..., 0.5715): applies square root scaling for visual perception
- 1.0083: scaling coefficient to fine-tune the size range
- minRad: ensures even smallest symbols are visible

SUGGESTION: Add comments explaining this scaling technique for future reference!
*/
function calcPropRadius(attValue) {
  var minRad = 5;
  var radius = 1.0083 * Math.pow(attValue / minValue, 0.5715) * minRad;
  return radius;
}

//Attributes that determine the looks of the points. This function also includes a
//popup bar for further details and filters all the data to show points.
/*
=== STUDENT CODE REVIEW: createPropSymbols() FUNCTION ===
EXCELLENT: This is your main visualization function - well structured!
GOOD: Using default parameter (yearFilter = null) for optional filtering.
GOOD: Safety check with if (!map) return; prevents errors.
ADVANCED: Layer management for updating the display is sophisticated.

LEARNING POINTS:
- This function combines data filtering, styling, and interaction in one place
- The geojsonMarkerOptions object defines the visual appearance
- L.geoJson() is Leaflet's main method for adding GeoJSON data
- The filter, pointToLayer, and onEachFeature functions are callbacks

STRENGTHS:
1. Good error prevention with map existence check
2. Proper layer cleanup before adding new data
3. Meaningful popup content with relevant crash details
4. Conditional filtering by year and fatalities

AREAS FOR POTENTIAL IMPROVEMENT:
- This function is doing many things - could be split into smaller functions
- Consider extracting the popup content creation to a separate function
- The geojsonMarkerOptions could be moved to a configuration object
*/
function createPropSymbols(json, yearFilter = null) {
  if (!map) return;

  //This function removes the existing tilelayer so another tilelayer can
  //replace it. This is to show the accident data that happens each year.
  /*
  LEARNING NOTE: Layer Management
  This code removes existing markers before adding new ones.
  - map.eachLayer() iterates through all layers on the map
  - layer.feature checks if it's a GeoJSON feature layer (not the base map)
  - This prevents accumulating markers when switching between years
  - Essential for temporal data visualization!
  */
  map.eachLayer(layer => {
    if (layer.feature) {
      map.removeLayer(layer);
    }
  });

  //This creates the looks of the features shown on the map.
  /*
  LEARNING NOTE: Symbol Styling
  This object defines how markers look:
  - fillColor: "#ff0000" = red fill (appropriate for crash data)
  - color: "#000" = black border
  - weight: 1 = thin border
  - opacity: 1 = fully opaque border
  - fillOpacity: 0.8 = slightly transparent fill (allows overlapping symbols to show)
  
  GOOD CHOICE: Red color is universally associated with danger/accidents
  */
  var geojsonMarkerOptions = {
    fillColor: "#ff0000",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  };


  L.geoJson(json, {
    //This function filters the years and the number of fatalities per accident.
    /*
    LEARNING NOTE: Data Filtering
    The filter function determines which features to display:
    - feature.properties.Totalfatalities > 0: only show crashes with fatalities
    - yearFilter logic: if no year specified (null), show all; otherwise filter by year
    - The || operator provides fallback logic
    EXCELLENT: This creates clean, meaningful visualizations by excluding irrelevant data
    */
    filter: function (feature) {
      return (
        feature.properties.Totalfatalities > 0 &&
        (yearFilter === null || feature.properties.Year === yearFilter)
      );
    },
    //This helps resize and shape the features based off number of fatalities.
    /*
    LEARNING NOTE: Proportional Symbols
    pointToLayer function converts GeoJSON points to Leaflet markers:
    - Takes each feature's lat/lng and converts to a visual symbol
    - Number() ensures the value is treated as a number for calculations
    - calcPropRadius() determines size based on fatality count
    - L.circleMarker() creates circular symbols (better than default markers for data viz)
    ADVANCED: This is professional-level cartographic visualization!
    */
    pointToLayer: function (feature, latlng) {
      var attValue = Number(feature.properties.Totalfatalities);
      geojsonMarkerOptions.radius = calcPropRadius(attValue);
      return L.circleMarker(latlng, geojsonMarkerOptions);
    },
    //Creates a popup that shows the incident id, date/time of crash, street name and number of fatalities.
    /*
    LEARNING NOTE: Interactive Popups
    onEachFeature function adds interactivity to each marker:
    - Extracts relevant information from feature properties
    - Creates formatted HTML content for popup
    - bindPopup() attaches the popup to the marker
    - offset positions popup above the symbol so it doesn't cover the marker
    EXCELLENT: You've included the most relevant information for users!
    */
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
/*
=== STUDENT CODE REVIEW: processData() FUNCTION ===
EXCELLENT: Great data processing logic for temporal controls!
GOOD: Using Set to automatically handle duplicate years.
GOOD: Filtering to reasonable year range (2012-2023).
GOOD: Sorting the years for logical sequence.

LEARNING POINTS:
- Set automatically removes duplicates from year values
- Array.from() converts Set back to array for easier manipulation
- .sort() ensures chronological order for the slider
- The year range filter prevents outliers or bad data from affecting the UI

MINOR SUGGESTION: Consider making the year range (2012-2023) configurable constants
*/
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
/*
=== STUDENT CODE REVIEW: createSequenceControls() FUNCTION ===
EXCELLENT: Full-featured temporal navigation interface!
ADVANCED: You've implemented both slider and button controls for great UX.
GOOD: Event listeners properly update the visualization.

LEARNING POINTS:
- insertAdjacentHTML() is a safe way to add HTML to existing elements
- Range input provides intuitive sliding interaction
- Button controls offer precise step-by-step navigation
- The modulo operator (%) creates wrap-around behavior

STRENGTHS:
1. Multiple interaction methods (slider + buttons)
2. Wrap-around navigation (forward from last year goes to first)
3. Synchronized controls (slider and buttons update each other)
4. Clean DOM manipulation

UI/UX EXCELLENCE:
- Users can drag slider for quick navigation
- Buttons allow precise year-by-year stepping
- Reverse button with wrap-around is thoughtful design
*/
function createSequenceControls(years, jsonData) {
  var panel = document.querySelector("#panel");

  var sliderHTML = "<input class='range-slider' type='range'></input>";
  panel.insertAdjacentHTML('beforeend', sliderHTML);

  /*
  LEARNING NOTE: Slider Configuration
  - min: 0, max: years.length - 1 uses array indices instead of actual years
  - This simplifies the math for accessing the years array
  - step: 1 ensures users can only select valid year positions
  - value: 0 starts with the first (earliest) year
  */
  var slider = document.querySelector(".range-slider");
  slider.min = 0;
  slider.max = years.length - 1;
  slider.value = 0;
  slider.step = 1;

  /*
  LEARNING NOTE: Slider Event Handling
  - "input" event fires continuously as user drags the slider
  - parseInt() converts string value to integer for array indexing
  - years[index] gets the actual year from the slider position
  - Immediately updates the map when slider moves
  */
  slider.addEventListener("input", function () {
    var index = parseInt(this.value);
    var selectedYear = years[index];
    createPropSymbols(jsonData, selectedYear);
  });

  panel.insertAdjacentHTML('beforeend', '<button class="step" id="reverse">Reverse</button>');
  panel.insertAdjacentHTML('beforeend', '<button class="step" id="forward">Forward</button>');

  /*
  LEARNING NOTE: Button Event Handling
  - querySelectorAll() selects both buttons at once
  - forEach() adds the same event listener to each button
  - this.id determines which button was clicked
  - Modulo arithmetic (%) creates wrap-around behavior:
    * Forward: (index + 1) % years.length wraps from last to first
    * Reverse: (index - 1 + years.length) % years.length wraps from first to last
  - slider.value = index keeps slider in sync with button clicks
  */
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
/*
=== STUDENT CODE REVIEW: getData() FUNCTION ===
EXCELLENT: Modern async data loading with fetch() API!
GOOD: Proper promise chaining with .then() methods.
GOOD: Logical sequence of operations after data loads.

LEARNING POINTS:
- fetch() is the modern way to load data (replaces old XMLHttpRequest)
- .json() method parses the response as JSON data
- Promise chaining ensures operations happen in correct order
- Starting with years[0] shows the earliest year by default

STRENGTHS:
1. Clean, readable async code
2. Proper initialization sequence
3. Efficient - calculates minValue once and reuses it

POTENTIAL IMPROVEMENT:
- Consider adding error handling (.catch()) for failed data loading
- Could add loading indicators for better user experience
*/
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
/*
=== STUDENT CODE REVIEW: updatePropSymbols() FUNCTION ===
CONCEPT: This function appears to be for updating symbols with different attributes.

ISSUE DETECTED: There's a bug in this function!
- Line: "<b>" + attribute + " Fatalities:</b> " + proper[attribute];
- "proper" should be "property" (typo)
- This would cause a JavaScript error when called

LEARNING POINTS:
- This function shows how to update existing map layers
- setRadius() dynamically changes symbol sizes
- layer.feature.properties[attribute] shows dynamic property access

SUGGESTION: This function might not be used in your current workflow, but fixing the typo would prevent future errors.

NOTE: Currently your app works great without this function, but it could be useful for switching between different data attributes (like injuries vs fatalities).
*/
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
/*
=== STUDENT CODE REVIEW: INITIALIZATION ===
EXCELLENT: Using DOMContentLoaded event listener!
This ensures the map is created only after the HTML is fully loaded.

LEARNING POINT:
- DOMContentLoaded fires when HTML is parsed (but before images/stylesheets finish)
- This is better than window.onload (waits for everything) for most cases
- Prevents errors from trying to access DOM elements before they exist

PERFECT: This is the correct way to initialize web maps!
*/
document.addEventListener('DOMContentLoaded', createMap);

/*
=== OVERALL CODE REVIEW SUMMARY ===

STRENGTHS (What you did EXCELLENTLY):
🏆 Professional-level proportional symbol mapping
🏆 Sophisticated temporal navigation with slider and buttons
🏆 Modern JavaScript with fetch(), arrow functions, and proper event handling
🏆 Excellent data filtering and validation
🏆 Clean separation of concerns with focused functions
🏆 Proper map layer management
🏆 Meaningful user interactions with informative popups
🏆 Good visual design choices (red for accidents, appropriate scaling)

ADVANCED TECHNIQUES DEMONSTRATED:
✅ Proportional symbol cartography with perceptual scaling
✅ Temporal data visualization
✅ Interactive web mapping
✅ Asynchronous data loading
✅ Dynamic DOM manipulation
✅ Event-driven programming

MINOR AREAS FOR IMPROVEMENT:
🔧 One typo in updatePropSymbols() function ("proper" should be "property")
🔧 Could add error handling for data loading
🔧 Some functions are doing multiple tasks (could be split for easier maintenance)
🔧 API key could be externalized for security

LEARNING LEVEL: ADVANCED
This code demonstrates sophisticated understanding of:
- Web cartography principles
- Interactive visualization design
- Modern JavaScript programming
- User experience design

OVERALL Excellent work with room for minor improvements!

This is professional-quality code that demonstrates strong understanding of both
cartographic principles and web development best practices. Well done!
*/