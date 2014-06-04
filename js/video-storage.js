

(function($) {
	'use strict';

	L.Polygon.prototype.getCenter = function(){
		var pts = this._latlngs;
		var off = pts[0];
		var twicearea = 0;
		var x = 0;
		var y = 0;
		var nPts = pts.length;
		var p1,p2;
		var f;
		for (var i = 0, j = nPts - 1; i < nPts; j = i++) {
			p1 = pts[i];
			p2 = pts[j];
			f = (p1.lat - off.lat) * (p2.lng - off.lng) - (p2.lat - off.lat) * (p1.lng - off.lng);
			twicearea += f;
			x += (p1.lat + p2.lat - 2 * off.lat) * f;
			y += (p1.lng + p2.lng - 2 * off.lng) * f;
		}
		f = twicearea * 3;
		debugger
		return new L.LatLng(
			x / f + off.lat,
			y / f + off.lng
		);
	}
	
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
			$(".query-group > .query-group-header").on('click', function() {
				$(this).parent().toggleClass('expanded').find('.query-group-container').slideToggle();
			}); 
			$(".query-group > .query-info").on('click', function() {
				$(this).parent().addClass('expanded').find('.query-group-container').slideDown();
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
				if ($(this).hasClass('active')) {
					$(this).removeClass('active');
				}
				else {
					$('.query-list-header .active').removeClass("active");
					$(this).addClass('active');
				}
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
				$('#select-query-date').find('.add-on').addClass('active');
				$('#select-query-date .add-on').attr('title', "Выбранная дата: " + e.date.toLocaleDateString());
			});
			$('.save-area').on('click', function(e) {
				$('.popup-map').removeClass('active');
				that.map.invalidateSize();
				that.area ? that.map.setView(that.area) : $('.popup-map').hide();
			});
			$('.extended-search').on('click', function (e) {
				e.preventDefault();
				$(this).toggleClass('expanded');
				$('.extended-search-params').toggle();
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
				that.area = e.layer.getCenter();
				that.drawnItems.addLayer(e.layer);
				$(".leaflet-draw-draw-polygon").toggle();
			});
			this.map.on('draw:deleted', function (e) {
				var layer = e.layer;
				that.area = undefined;
				$(".leaflet-draw-draw-polygon").toggle();
			});
		},
		
		clear_map: function() {
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

function test_cross_domain(type, url) {
	url = url || "massevent/operators/";
	type = type || "GET";
	$.ajax({
		type: type,
		url: "http://10.1.30.3:7103/" + url,
	});
}
