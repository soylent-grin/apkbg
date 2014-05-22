
var map;
(function($) {
	'use strict';
	
	var marker_default_url = 'img/address-marker.svg';
	var marker_selected_url = 'img/selected-address-marker.svg';
	
	var Address_Marker = L.Icon.extend({
		options: {
			shadowUrl: null,
			iconAnchor: new L.Point(7, 7),
			iconSize: new L.Point(15, 15),
			iconUrl: marker_default_url
		}
	});
	
	var Selected_Address_Marker = L.Icon.extend({
		options: {
			shadowUrl: null,
			iconAnchor: new L.Point(15, 15),
			iconSize: new L.Point(30, 30),
			iconUrl: marker_selected_url
		}
	});
	
	function CityMap() {
		this.init();
	}
	CityMap.prototype = {
		constructor: CityMap,
		init: function() {
			var that = this;
			this.markers = [];
			this.map = L.map('map-container').setView([59.94, 30.35], 13);
			L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
				maxZoom: 18,
				attribution: '© <a href="http://mapbox.com">Mapbox</a>',
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
							color: '#f00'
						},
						showArea: true
					},
					polyline: {
						metric: false,
						shapeOptions: {
							stroke: true,
							color: '#f00',
							weight: 3,
							opacity: 0.7,
							fill: false,
							clickable: true
						},
					},
					circle: false,
					rectangle: {
						shapeOptions: {
							color: '#f00'
						}
					},
					marker: {
						icon: new Address_Marker()
					}
				},
				edit: {
					featureGroup: this.drawnItems
				}
			});
			this.map.addControl(drawControl);

			this.map.on('draw:created', function (e) {
				var type = e.layerType,
					layer = e.layer;
				
				that.build_section_info(type, layer);

				that.drawnItems.addLayer(layer);
			});
			
			this.map.on('draw:deleted', function (e) {
				console.log(e);
				for (var leaflet_id in e.layers._layers) {
					$('.section-info:not(.template)').each(function(i, section) {
						if ($(section).data('layer')._leaflet_id == leaflet_id ) {
							$(section).remove();
						}
					});
				}
			});
			
			$('.right').on('hover', '.info', function() {
				var $this = $(this);
				var layer = $this.parents('.section-info').data('layer');
				// set default
				$('svg path').attr('stroke-dasharray', "");
				for (var i = 0; i < that.markers.length; i++) {
					that.markers[i].setIcon(new Address_Marker());
				}
				// select marker or svg
				if (!$this.hasClass('active-info')) {					
					console.log(layer);
					if (layer._icon) {
						layer.setIcon(new Selected_Address_Marker());
						layer.fire('click');
					}
					else if (layer._container) {
						var svg = layer._container;
						$(svg).find('path').attr('stroke-dasharray', "10,10");
					}					
					$('.active-info').removeClass('active-info');
					$this.addClass('active-info');
				}
				else {					
					$('.active-info').removeClass('active-info');
				}
			});
			
			$('#cameras-address').geocomplete().bind("geocode:result", function(event, result){
				var coords = L.latLng(result.geometry.location.k, result.geometry.location.A)
				that.map.setView(coords);
				var radius = $('#cameras-radius').val();
				if (radius == 0) {					
					var marker = L.marker(coords, {icon: new Address_Marker()}).addTo(that.drawnItems);
					that.build_section_info('marker', marker);
				}
				else if ($.isNumeric(radius)) {
					L.circle(coords, radius * 1000, {
						color: '#f00',      // Stroke color
						opacity: 1,         // Stroke opacity
						weight: 4,         // Stroke weight
						fillColor: '#f00',  // Fill color
						fillOpacity: 0.4    // Fill opacity
					}).addTo(that.drawnItems);
				}
			});		
		},
		build_section_info: function(type, layer) {
			var template  = $('.template.section-info').clone(true).removeClass('template');
			var header, clazz;
			switch (type) {
				case 'marker':
					header = 'Адрес';
					clazz = 'address';
					this.markers.push(layer);
					this.setPopupAddress(layer);
					break;
				case 'polygon':
				case 'rectangle':
					header = 'Выделенная область';
					clazz = 'area';
					break;
				case 'polyline':
					header = 'Маршрут';
					clazz = 'route';
					break;
			}
			template.addClass(clazz).find('h5 > span').text(header);
			template.data("layer", layer);
			template.attr('data-leaflet-id', layer._leaflet_id);
			console.log(layer);
			template.appendTo('section.right');
		},
		setPopupAddress: function(layer) {
			var latlng = new google.maps.LatLng(layer._latlng.lat, layer._latlng.lng);
			var geocoder = new google.maps.Geocoder();
			var address = '';
			geocoder.geocode({'latLng': latlng}, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
						console.log(results[0]);
						address = results[0].formatted_address;
						layer.bindPopup(address);
						layer.fire('click');
				} 
			});
		}
	}
	$(document).ready(function() {
		$(".datepicker-el").datetimepicker({
			language: 'ru',
			pickTime: false
		});
		$(".timepicker-el").datetimepicker({
			language: 'ru',
			pickDate: false
		});
		map = new CityMap();
	});
})(jQuery);