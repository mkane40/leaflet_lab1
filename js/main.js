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
    L.Control.geocoder().addTo(map);
    
    
    
    //L.Control.layers(overlayMaps, {position: 'topleft'})addTo(map);
    //call getData function
    getData(map);
}

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = 90;
    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;
    
    var radius =  Math.sqrt(area / Math.PI);
    //radius calculated based on area
   return radius;
}


function createPopup(properties, attribute, layer, radius){
    //add city to popup content string
    var popupContent = "<p><b>County: </b>" + properties.Country +"</p> ";

    //add formatted attribute to panel content string
    var year = attribute.split("_")[1];
    popupContent += "<p><b>Year " + year + ":</b> " + properties[attribute] + " Per Women</p>";

    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-radius),
        closeButton:false
    });
    
    //add popup mouseover functionality
    layer.on({
        mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        }
    });
};


//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes) {   
    
    //create marker options
    var attribute = attributes[0];
    
    //marker options style
    var geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#81A6A6",
        color: "#000",
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.8
    };
    
    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);
        
    //Give each feature's circle marker a radius based on its attribute value
    geojsonMarkerOptions.radius = calcPropRadius(attValue);
    
    //create circle layer
    var layer = L.circleMarker(latlng, geojsonMarkerOptions);
    
    createPopup(feature.properties, attribute, layer, geojsonMarkerOptions.radius);

    
    //add popup mouseover functionality
    layer.on({
        mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        }
    });
    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
     
};

//function array through attributes
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes within year_rate values
        if (attribute.indexOf("Year") > -1){
            attributes.push(attribute);
        };
    };

    return attributes;
};


//create a Leaflet GeoJSON layer and add it to the map
function createPropSymbols(data, map, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

function updatePropSymbols(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;

            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            //Example 1.3 line 6...in UpdatePropSymbols()
            createPopup(props, attribute, layer, radius);
            
            updateLegend(map, attribute);
        };
    });
};

function createLegend(map, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            //PUT YOUR SCRIPT TO CREATE THE TEMPORAL LEGEND HERE
            $(container).append('<div id="temporal-legend">')
            
            //Step 1: start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="160px" height="70px">';
            
            //object to base loop on...replaces Example 3.10 line 1
            var circles = {
                max: 20,
                mean: 40,
                min: 60
            };
    
            //loop to add each circle and text to svg string
            for (var circle in circles){
                //circle string
                svg += '<circle class="legend-circle" id="' + circle + '" fill="#81A6A6" fill-opacity="0.8" stroke="#000000" cx="30"/>';
    
                //text string
                svg += '<text id="' + circle + '-text" x="65" y="' + circles[circle] + '"></text>';
            };

            //close svg string
            svg += "</svg>";

            //add attribute legend svg to container
            $(container).append(svg);

            return container;
        }
    });

    map.addControl(new LegendControl());
    
    updateLegend(map, attributes[0]);
};


//Calculate the max, mean, and min values for a given attribute
function getCircleValues(map, attribute){
    //start with min at highest possible and max at lowest possible number
    var min = Infinity,
        max = -Infinity;

    map.eachLayer(function(layer){
        //get the attribute value
        if (layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);

            //test for min
            if (attributeValue < min){
                min = attributeValue;
            };

            //test for max
            if (attributeValue > max){
                max = attributeValue;
            };
        };
    });

    //set mean
    var mean = (max + min) / 2;

    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};


function updateLegend(map, attribute){
    //create content for legend
    var year = attribute.split("_")[1];
    var content = "<p><b>Year: </b>" + year;
    
    $('#temporal-legend').html(content);
    
    //get the max, mean, and min values as an object
    var circleValues = getCircleValues(map, attribute);
    
    for (var key in circleValues){
        //get the radius
        var radius = calcPropRadius(circleValues[key]);

        //Step 3: assign the cy and r attributes
        $('#'+key).attr({
            cy: 50 - radius,
            r: radius
        });
        
         //Step 4: add legend text
        $('#'+key+'-text').text(Math.round(circleValues[key]*100)/100 + " Per Women");
    };
};

function createSequenceControls(map, attributes){
     var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function (map) {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            // ... initialize other DOM elements, add listeners, etc.
            //create range input element (slider)
            $(container).append('<input class="range-slider" type="range">');
            $(container).append('<button class="skip" id="reverse">❮</button>');
            $(container).append('<button class="skip" id="forward">❯</button>');
            
            
            //kill any mouse event listeners on the map What about sliding?
            $(container).on('mousedown dblclick', function(e){
                L.DomEvent.stopPropagation(e);
            });
            
            $(container).on('mouseover', function () {
                map.dragging.disable();

            });
            
             $(container).on('mouseout', function () {
                map.dragging.enable();
            });
            
            return container;
        }
    });

    map.addControl(new SequenceControl());
    
    //create range input element (slider)
    //$('#panel').append('<input class="range-slider" type="range">');
    //$('#panel').append('<button class="skip" id="reverse">❮</button>');
    //$('#panel').append('<button class="skip" id="forward">❯</button>');
    
    //set up slider properties
    $('.range-slider').attr({
        max: 7,
        min: 0,
        value: 0,
        step: 1
    });
    
    $('.skip').click(function(){
        //sequence
        var index = $('.range-slider').val();
        //Step 6: increment or decrement depending on button clicked
        if ($(this).attr('id') == 'forward'){
            index++;
            //Step 7: if past the last attribute, wrap around to first attribute
            index = index > 6 ? 0 : index;
        } else if ($(this).attr('id') == 'reverse'){
            index--;
            //Step 7: if past the first attribute, wrap around to last attribute
            index = index < 0 ? 6 : index;
        };
        
        $('.range-slider').val(index);
        
        console.log(attributes);
        console.log(index);
        console.log(attributes[index])
        updatePropSymbols(map, attributes[index]);
    });
    
    //Step 5: input listener for slider
    $('.range-slider').on('input', function(){
        //sequence
        var index = $(this).val();
        updatePropSymbols(map, attributes[index]);
    });
    
};


//Step 2: Import GeoJSON data
function getData(map){
    //load the data
    $.ajax("data/fertilityrates.geojson", {
        dataType: "json",
        success: function(response){
            //add array of attributes
            var attributes = processData(response);
            
            //call function to create proportional symbols
            createPropSymbols(response, map, attributes);
            createSequenceControls(map, attributes);
            createLegend(map,attributes);
        }
    });
};

$(document).ready(createMap);