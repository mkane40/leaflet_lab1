/* Map of GeoJSON data from MegaCities.geojson */

//function to instantiate the Leaflet map
function createMap() {
    //create the map
    var map = L.map('map', {
        center: [20, 0],
        zoom: 2
    });

    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    //call getData function
    getData(map);
};

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = 100;
    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);

    return radius;
};

//Step 3: Add circle markers for point features to the map
function createPropSymbols(data, map){
    //create marker options
    var attribute = "Year_1830";
    
    var geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#ff7860",
        color: "#000",
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.8
    };

    //Example 1.2 line 13...create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
            //Step 5: For each feature, determine its value for the selected attribute
            var attValue = Number(feature.properties[attribute]);

            
            
            //Step 6: Give each feature's circle marker a radius based on its attribute value
            geojsonMarkerOptions.radius = calcPropRadius(attValue);
            
            //create circle markers
            return L.circleMarker(latlng, geojsonMarkerOptions);
            
            //build popup content string starting with city...Example 2.1 line 24
            var popupContent = "<p><b>Country:</b> " + feature.properties.Entity + "</p>";

            //add formatted attribute to popup content string
            var year = attribute.split("_")[1];
            popupContent += "<p><b>Fertility rate in " + year + ":</b> " + feature.properties[attribute] + " million</p>";
            
             //Example 2.1 line 27...bind the popup to the circle marker
            layer.bindPopup(popupContent);
            
            
            //original popupContent changed to panelContent...Example 2.2 line 1
            var panelContent = "<p><b>Country:</b> " + feature.properties.Country + "</p>";
            
            //add formatted attribute to panel content string
            var year = attribute.split("_")[1];
            panelContent += "<p><b>Population in " + year + ":</b> " + feature.properties[attribute] + " million</p>";
            
            
            //bind the popup to the circle marker
            layer.bindPopup(popupContent, {
                offset: new L.Point(0,-options.radius),
                closeButton: false
            });
            //event listeners to open popup on hover
            layer.on({
                mouseover: function(){
                    this.openPopup();
                },
                mouseout: function(){
                    this.closePopup();
                },
                click: function(){
                    $("#panel").html(popupContent);
                }
            });
            
            //bind the popup to the circle marker
            layer.bindPopup(popupContent, {
                offset: new L.Point(0,-options.radius)
            });

            //return the circle marker to the L.geoJson pointToLayer option
            return layer;

            
        }
    }).addTo(map);
};



//Step 2: Import GeoJSON data
function getData(map){
    //load the data
    $.ajax("data/fertilityrates.geojson", {
        dataType: "json",
        success: function(response){
            //call function to create proportional symbols
            createPropSymbols(response, map);
        }
    });
};




$(document).ready(createMap);