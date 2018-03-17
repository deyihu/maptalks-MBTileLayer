var SphericalMercator=require('@mapbox/sphericalmercator');

var merc = new SphericalMercator({
    size: 256
});

var re=merc.xyz([-180,-85.05112877980659,180,85.0511287798066],5);

console.log(re)