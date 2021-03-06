/*
 * maptalks-mbtilelayer v0.0.1
 * this is extends maptalks.js 
 * build by deyihu 
*/

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('maptalks')) :
	typeof define === 'function' && define.amd ? define(['exports', 'maptalks'], factory) :
	(global = global || self, factory(global.maptalks = global.maptalks || {}, global.maptalks));
}(this, function (exports, maptalks) { 'use strict';

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var sphericalmercator = createCommonjsModule(function (module, exports) {
	    var SphericalMercator = function () {

	        // Closures including constants and other precalculated values.
	        var cache = {},
	            D2R = Math.PI / 180,
	            R2D = 180 / Math.PI,

	        // 900913 properties.
	        A = 6378137.0,
	            MAXEXTENT = 20037508.342789244;

	        function isFloat(n) {
	            return Number(n) === n && n % 1 !== 0;
	        }

	        // SphericalMercator constructor: precaches calculations
	        // for fast tile lookups.
	        function SphericalMercator(options) {
	            options = options || {};
	            this.size = options.size || 256;
	            if (!cache[this.size]) {
	                var size = this.size;
	                var c = cache[this.size] = {};
	                c.Bc = [];
	                c.Cc = [];
	                c.zc = [];
	                c.Ac = [];
	                for (var d = 0; d < 30; d++) {
	                    c.Bc.push(size / 360);
	                    c.Cc.push(size / (2 * Math.PI));
	                    c.zc.push(size / 2);
	                    c.Ac.push(size);
	                    size *= 2;
	                }
	            }
	            this.Bc = cache[this.size].Bc;
	            this.Cc = cache[this.size].Cc;
	            this.zc = cache[this.size].zc;
	            this.Ac = cache[this.size].Ac;
	        }
	        // Convert lon lat to screen pixel value
	        //
	        // - `ll` {Array} `[lon, lat]` array of geographic coordinates.
	        // - `zoom` {Number} zoom level.
	        SphericalMercator.prototype.px = function (ll, zoom) {
	            if (isFloat(zoom)) {
	                var size = this.size * Math.pow(2, zoom);
	                var d = size / 2;
	                var bc = size / 360;
	                var cc = size / (2 * Math.PI);
	                var ac = size;
	                var f = Math.min(Math.max(Math.sin(D2R * ll[1]), -0.9999), 0.9999);
	                var x = d + ll[0] * bc;
	                var y = d + 0.5 * Math.log((1 + f) / (1 - f)) * -cc;
	                x > ac && (x = ac);
	                y > ac && (y = ac);
	                //(x < 0) && (x = 0);
	                //(y < 0) && (y = 0);
	                return [x, y];
	            } else {
	                var d = this.zc[zoom];
	                var f = Math.min(Math.max(Math.sin(D2R * ll[1]), -0.9999), 0.9999);
	                var x = Math.round(d + ll[0] * this.Bc[zoom]);
	                var y = Math.round(d + 0.5 * Math.log((1 + f) / (1 - f)) * -this.Cc[zoom]);
	                x > this.Ac[zoom] && (x = this.Ac[zoom]);
	                y > this.Ac[zoom] && (y = this.Ac[zoom]);
	                //(x < 0) && (x = 0);
	                //(y < 0) && (y = 0);
	                return [x, y];
	            }
	        };

	        // Convert screen pixel value to lon lat
	        //
	        // - `px` {Array} `[x, y]` array of geographic coordinates.
	        // - `zoom` {Number} zoom level.
	        SphericalMercator.prototype.ll = function (px, zoom) {
	            if (isFloat(zoom)) {
	                var size = this.size * Math.pow(2, zoom);
	                var bc = size / 360;
	                var cc = size / (2 * Math.PI);
	                var zc = size / 2;
	                var g = (px[1] - zc) / -cc;
	                var lon = (px[0] - zc) / bc;
	                var lat = R2D * (2 * Math.atan(Math.exp(g)) - 0.5 * Math.PI);
	                return [lon, lat];
	            } else {
	                var g = (px[1] - this.zc[zoom]) / -this.Cc[zoom];
	                var lon = (px[0] - this.zc[zoom]) / this.Bc[zoom];
	                var lat = R2D * (2 * Math.atan(Math.exp(g)) - 0.5 * Math.PI);
	                return [lon, lat];
	            }
	        };

	        // Convert tile xyz value to bbox of the form `[w, s, e, n]`
	        //
	        // - `x` {Number} x (longitude) number.
	        // - `y` {Number} y (latitude) number.
	        // - `zoom` {Number} zoom.
	        // - `tms_style` {Boolean} whether to compute using tms-style.
	        // - `srs` {String} projection for resulting bbox (WGS84|900913).
	        // - `return` {Array} bbox array of values in form `[w, s, e, n]`.
	        SphericalMercator.prototype.bbox = function (x, y, zoom, tms_style, srs) {
	            // Convert xyz into bbox with srs WGS84
	            if (tms_style) {
	                y = Math.pow(2, zoom) - 1 - y;
	            }
	            // Use +y to make sure it's a number to avoid inadvertent concatenation.
	            var ll = [x * this.size, (+y + 1) * this.size]; // lower left
	            // Use +x to make sure it's a number to avoid inadvertent concatenation.
	            var ur = [(+x + 1) * this.size, y * this.size]; // upper right
	            var bbox = this.ll(ll, zoom).concat(this.ll(ur, zoom));

	            // If web mercator requested reproject to 900913.
	            if (srs === '900913') {
	                return this.convert(bbox, '900913');
	            } else {
	                return bbox;
	            }
	        };

	        // Convert bbox to xyx bounds
	        //
	        // - `bbox` {Number} bbox in the form `[w, s, e, n]`.
	        // - `zoom` {Number} zoom.
	        // - `tms_style` {Boolean} whether to compute using tms-style.
	        // - `srs` {String} projection of input bbox (WGS84|900913).
	        // - `@return` {Object} XYZ bounds containing minX, maxX, minY, maxY properties.
	        SphericalMercator.prototype.xyz = function (bbox, zoom, tms_style, srs) {
	            // If web mercator provided reproject to WGS84.
	            if (srs === '900913') {
	                bbox = this.convert(bbox, 'WGS84');
	            }

	            var ll = [bbox[0], bbox[1]]; // lower left
	            var ur = [bbox[2], bbox[3]]; // upper right
	            var px_ll = this.px(ll, zoom);
	            var px_ur = this.px(ur, zoom);
	            // Y = 0 for XYZ is the top hence minY uses px_ur[1].
	            var x = [Math.floor(px_ll[0] / this.size), Math.floor((px_ur[0] - 1) / this.size)];
	            var y = [Math.floor(px_ur[1] / this.size), Math.floor((px_ll[1] - 1) / this.size)];
	            var bounds = {
	                minX: Math.min.apply(Math, x) < 0 ? 0 : Math.min.apply(Math, x),
	                minY: Math.min.apply(Math, y) < 0 ? 0 : Math.min.apply(Math, y),
	                maxX: Math.max.apply(Math, x),
	                maxY: Math.max.apply(Math, y)
	            };
	            if (tms_style) {
	                var tms = {
	                    minY: Math.pow(2, zoom) - 1 - bounds.maxY,
	                    maxY: Math.pow(2, zoom) - 1 - bounds.minY
	                };
	                bounds.minY = tms.minY;
	                bounds.maxY = tms.maxY;
	            }
	            return bounds;
	        };

	        // Convert projection of given bbox.
	        //
	        // - `bbox` {Number} bbox in the form `[w, s, e, n]`.
	        // - `to` {String} projection of output bbox (WGS84|900913). Input bbox
	        //   assumed to be the "other" projection.
	        // - `@return` {Object} bbox with reprojected coordinates.
	        SphericalMercator.prototype.convert = function (bbox, to) {
	            if (to === '900913') {
	                return this.forward(bbox.slice(0, 2)).concat(this.forward(bbox.slice(2, 4)));
	            } else {
	                return this.inverse(bbox.slice(0, 2)).concat(this.inverse(bbox.slice(2, 4)));
	            }
	        };

	        // Convert lon/lat values to 900913 x/y.
	        SphericalMercator.prototype.forward = function (ll) {
	            var xy = [A * ll[0] * D2R, A * Math.log(Math.tan(Math.PI * 0.25 + 0.5 * ll[1] * D2R))];
	            // if xy value is beyond maxextent (e.g. poles), return maxextent.
	            xy[0] > MAXEXTENT && (xy[0] = MAXEXTENT);
	            xy[0] < -MAXEXTENT && (xy[0] = -MAXEXTENT);
	            xy[1] > MAXEXTENT && (xy[1] = MAXEXTENT);
	            xy[1] < -MAXEXTENT && (xy[1] = -MAXEXTENT);
	            return xy;
	        };

	        // Convert 900913 x/y values to lon/lat.
	        SphericalMercator.prototype.inverse = function (xy) {
	            return [xy[0] * R2D / A, (Math.PI * 0.5 - 2.0 * Math.atan(Math.exp(-xy[1] / A))) * R2D];
	        };

	        return SphericalMercator;
	    }();

	    {
	        module.exports = exports = SphericalMercator;
	    }
	});

	var classCallCheck = function (instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	};

	var createClass = function () {
	  function defineProperties(target, props) {
	    for (var i = 0; i < props.length; i++) {
	      var descriptor = props[i];
	      descriptor.enumerable = descriptor.enumerable || false;
	      descriptor.configurable = true;
	      if ("value" in descriptor) descriptor.writable = true;
	      Object.defineProperty(target, descriptor.key, descriptor);
	    }
	  }

	  return function (Constructor, protoProps, staticProps) {
	    if (protoProps) defineProperties(Constructor.prototype, protoProps);
	    if (staticProps) defineProperties(Constructor, staticProps);
	    return Constructor;
	  };
	}();

	var inherits = function (subClass, superClass) {
	  if (typeof superClass !== "function" && superClass !== null) {
	    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
	  }

	  subClass.prototype = Object.create(superClass && superClass.prototype, {
	    constructor: {
	      value: subClass,
	      enumerable: false,
	      writable: true,
	      configurable: true
	    }
	  });
	  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
	};

	var possibleConstructorReturn = function (self, call) {
	  if (!self) {
	    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	  }

	  return call && (typeof call === "object" || typeof call === "function") ? call : self;
	};

	var merc = new sphericalmercator({
		size: 256
	});

	function renderercreateCallback(e) {
		e.renderer.loadTileImage = function (img, url) {
			var remoteImage = new Image();
			remoteImage.onload = function () {
				img.src = url;
			};
			remoteImage.src = url;
		};
	}

	function calTileRange(zoom) {
		return merc.xyz([-180, -85.05112877980659, 180, 85.0511287798066], zoom);
	}

	var MBTileLayer = function (_TileLayer) {
		inherits(MBTileLayer, _TileLayer);

		function MBTileLayer(id, options) {
			classCallCheck(this, MBTileLayer);

			var _this = possibleConstructorReturn(this, (MBTileLayer.__proto__ || Object.getPrototypeOf(MBTileLayer)).call(this, id, options));

			_this._initBUffer(options);

			return _this;
		}

		createClass(MBTileLayer, [{
			key: '_initBUffer',
			value: function _initBUffer(options) {
				var _this2 = this;

				this.on('renderercreate', renderercreateCallback);
				var databaseUrl = options.dbUrl;
				this._databaseIsLoaded = false;
				if (typeof databaseUrl === 'string') {
					fetch(databaseUrl).then(function (response) {
						return response.arrayBuffer();
					}).then(function (buffer) {
						_this2._openDB(buffer);
					}).catch(function (err) {
						_this2.fire('databaseerror', { error: err });
					});
				} else if (databaseUrl instanceof ArrayBuffer) {
					this._openDB(databaseUrl);
				} else {
					this.fire('databaseerror');
				}
			}

			/**
	   *  copy from https://gitlab.com/IvanSanchez/Leaflet.TileLayer.MBTiles
	   * @param {*} buffer
	   */

		}, {
			key: '_openDB',
			value: function _openDB(buffer) {
				try {
					/// This assumes the `SQL` global variable to exist!!
					this._db = new window.SQL.Database(new Uint8Array(buffer));
					this._stmt = this._db.prepare('SELECT tile_data FROM tiles WHERE zoom_level = :z AND tile_column = :x AND tile_row = :y');

					// Load some metadata (or at least try to)
					var metaStmt = this._db.prepare('SELECT value FROM metadata WHERE name = :key');
					var row = void 0;

					row = metaStmt.getAsObject({ ':key': 'attribution' });
					if (row.value) {
						this.options.attribution = row.value;
					}

					row = metaStmt.getAsObject({ ':key': 'minzoom' });
					if (row.value) {
						this.options.minZoom = Number(row.value);
					}

					row = metaStmt.getAsObject({ ':key': 'maxzoom' });
					if (row.value) {
						this.options.maxZoom = Number(row.value);
					}

					row = metaStmt.getAsObject({ ':key': 'format' });
					if (row.value && row.value === 'png') {
						this._format = 'image/png';
					} else if (row.value && row.value === 'jpg') {
						this._format = 'image/jpg';
					} else {
						// Fall back to PNG, hope it works.
						this._format = 'image/png';
					}

					// 🍂event databaseloaded
					// Fired when the database has been loaded, parsed, and ready for queries
					this.fire('databaseloaded');
					this._databaseIsLoaded = true;
					this.load();
				} catch (ex) {
					// 🍂event databaseloaded
					// Fired when the database could not load for any reason. Might contain
					// an `error` property describing the error.
					this.fire('databaseerror', { error: ex });
				}
			}
		}, {
			key: 'getTileUrl',
			value: function getTileUrl(x, y, z) {
				if (!this._stmt) return undefined;
				var tileRange = calTileRange(this.map.getZoom());
				if (tileRange && tileRange.maxY) y = tileRange.maxY - y;
				var row = this._stmt.getAsObject({
					':x': x,
					':y': y,
					':z': z
				});
				if ('tile_data' in row) {
					return window.URL.createObjectURL(new Blob([row.tile_data], { type: 'image/png' }));
				} else {
					return undefined;
				}
			}
		}]);
		return MBTileLayer;
	}(maptalks.TileLayer);

	exports.MBTileLayer = MBTileLayer;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=maptalks-mbtilelayer.js.map
