
(function($) {
	'use strict';
	function Video_Storage() {
		this.options = {
			
		};
		this.init();
	}
	Video_Storage.prototype = {
		constructor: Video_Storage,
		init: function() {
			var that = this;
			this.init_map();
			// init datepickers
			$(".datepicker-el").datetimepicker({
				language: 'ru',
				pickTime: false
			});
			$(".timepicker-el").datetimepicker({
				language: 'ru',
				pickDate: false
			});
			
			// events 
			$(".query-group > .query-info").on('click', function() {
				$(this).parent().toggleClass('expanded').find('.query-group-container').slideToggle();
			}); 
			$(".query-info").on('click', function() {
				$('.query.active').removeClass('active');
				$(this).parent().toggleClass('active');
			});
			$('.query-form-mark-area').on('click', function(e) {
				e.preventDefault();
				$('.popup-map').show().addClass('active');
				that.map.invalidateSize();
			});
			$('.popup-close').on('click', function() {
				$('.popup-map').removeClass('active');
			});
			$('.query-list-header > a').on('click', function(e) {
				e.preventDefault();
				$('.query-list-header .active').removeClass("active");
				$(this).addClass('active');
			});
			$('#select-query-date .add-on').on('click', function(e) {
				if ($(this).hasClass('active')) {
					$('#select-query-date').data('datetimepicker').hide();
					e.stopPropagation();
					$(this).removeClass('active');
				}
			});
			$('#select-query-date').on('changeDate', function(e) {
				$('.query-list-header > a').removeClass("active");
				$('#select-query-date').find('.add-on').toggleClass('active');
			});
			$('.save-area').on('click', function(e) {
				var layer = that.map._layers[0];
				$('.popup-map').removeClass('active');
			});
			$('.extended-search').on('click', function (e) {
				e.preventDefault();
				$.ajax({
					type: "POST",
					url: "http://10.1.30.3:7777/rest/demo/2"
				})
			});
			
		},
		init_map: function() {
			var that = this;
			this.map = L.map('search-map').setView([59.94, 30.35], 13);
			L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
				maxZoom: 18,
				id: 'examples.map-i86knfo3'
			}).addTo(this.map);

			this.drawnItems = new L.FeatureGroup();
			this.map.addLayer(this.drawnItems);
			var drawControl = new L.Control.Draw({
				draw: {
					position: 'topleft',
					polygon: {
						allowIntersection: false,
						drawError: {
							color: '#b00b00',
							timeout: 1000
						},
						shapeOptions: {
							stroke: true,
							color: '#f00',
							weight: 3,
							opacity: 0.7,
							fill: '#f00',
							fillOpacity: 0.2, 
							clickable: true
						},
						showArea: true
					},
					polyline: false,
					circle: false,
					rectangle: false,
					marker: false
				},
				edit: {
					featureGroup: this.drawnItems
				}
			});
			this.map.addControl(drawControl);
			this.map.on('draw:created', function (e) {
				var layer = e.layer;
				that.drawnItems.addLayer(layer);
			});
		},
		
		clearMap: function() {
			var m = this.map;
			for(var i in m._layers) {
				if(m._layers[i]._path !== undefined) {
					try {
						m.removeLayer(m._layers[i]);
					}
					catch(e) {
						console.log("problem with " + e + m._layers[i]);
					}
				}
			}
		}	
	};
	
	$(document).ready(function() {
		var video_storage = new Video_Storage();
	});
})(jQuery);
