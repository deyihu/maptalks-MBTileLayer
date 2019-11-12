import { TileLayer } from 'maptalks';
// var SphericalMercator = require('@mapbox/sphericalmercator');
import SphericalMercator from '@mapbox/sphericalmercator';

const merc = new SphericalMercator({
	size: 256
});

function renderercreateCallback(e) {
	e.renderer.loadTileImage = function (img, url) {
		const remoteImage = new Image();
		remoteImage.onload = function () {
			img.src = url;
		};
		remoteImage.src = url;
	};
}

function calTileRange(zoom) {
	return merc.xyz([-180, -85.05112877980659, 180, 85.0511287798066], zoom);
}

class MBTileLayer extends TileLayer {
	constructor(id, options) {
		super(id, options);
		this._initBUffer(options);

	}

	_initBUffer(options) {
		this.on('renderercreate', renderercreateCallback);
		const databaseUrl = options.dbUrl;
		this._databaseIsLoaded = false;
		if (typeof databaseUrl === 'string') {
			fetch(databaseUrl).then(response => {
				return response.arrayBuffer();
			}).then(buffer => {
				this._openDB(buffer);
			}).catch(err => {
				this.fire('databaseerror', { error: err });
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
	_openDB(buffer) {
		try {
			/// This assumes the `SQL` global variable to exist!!
			this._db = new window.SQL.Database(new Uint8Array(buffer));
			this._stmt = this._db.prepare('SELECT tile_data FROM tiles WHERE zoom_level = :z AND tile_column = :x AND tile_row = :y');

			// Load some metadata (or at least try to)
			const metaStmt = this._db.prepare('SELECT value FROM metadata WHERE name = :key');
			let row;

			row = metaStmt.getAsObject({ ':key': 'attribution' });
			if (row.value) { this.options.attribution = row.value; }

			row = metaStmt.getAsObject({ ':key': 'minzoom' });
			if (row.value) { this.options.minZoom = Number(row.value); }

			row = metaStmt.getAsObject({ ':key': 'maxzoom' });
			if (row.value) { this.options.maxZoom = Number(row.value); }

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

	getTileUrl(x, y, z) {
		if (!this._stmt) return undefined;
		const tileRange = calTileRange(this.map.getZoom());
		if (tileRange && tileRange.maxY) y = tileRange.maxY - y;
		const row = this._stmt.getAsObject({
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
}

export default MBTileLayer;