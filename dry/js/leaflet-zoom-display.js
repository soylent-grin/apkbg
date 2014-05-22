var ZoomDisplay = L.Control.extend({
	options: {
		position: 'topleft'
	},

	onAdd: function(map) {
		this.map = map;
		this.container = L.DomUtil.create('div', 'zoom-display leaflet-bar ');
		this.start_level = map.getZoom(); // its the max level for us
		this.container.innerHTML = '100%';
		map.on('zoomend', this.update, this);
		return this.container;
	},

	update: function(e) {
		var value = 100 / Math.pow(2, this.start_level - this.map.getZoom());
		if (value < 6) {
			value = value.toFixed(2);
		}
		this.container.innerHTML = value + '%';
	},
});