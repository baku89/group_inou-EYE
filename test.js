var CoordParser = require('google-maps-coordinate-parser'),
    Coord;
 
Coord = CoordParser.parse('https://www.google.com/maps/place/Film+Center+Building+Corporation/@40.760054,-73.991054,17z/data=!3m1!4b1!4m2!3m1!1s0x89c25853c9cfe7d3:0x44137c808ab6c9c3');
 
console.log(Coord); // {latitude: 40.760054, longitude: -73.991054} 
console.log(Coord.toString()); // '40.760054, -73.991054' 