maptalks  Loads .mbtiles tilesets.

inspired by https://gitlab.com/IvanSanchez/Leaflet.TileLayer.MBTiles

![](gallery.png)

[demo](https://deyihu.github.io/src/maptalks-MBTileLayer/examples/)


<pre>
<h2>how  to use?</h2>

     var baseLayer = new maptalks.MBTileLayer('base',{
        dbUrl:'./countries-raster.mbtiles',
        attribution: '&copy; MapBox Maps'
      });

    
      var map = new maptalks.Map('map', {
        center:     [0,0],
        zoom:  0,
        baseLayer : baseLayer
      });
</pre>

