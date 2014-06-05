
(function($) {
	'use strict';	
	
	BASE_URL = BASE_URL || "localhost";
	
	//string formatting god, follow him!
	String.prototype.format = function() {
		var pattern = /\{\d+\}/g;
		var args = arguments;
		return this.replace(pattern, function(capture){ return args[capture.match(/\d+/)]; });
	};
	
	function CityEvent(event_params) {
		var that = this;
		this.is_new = event_params.is_new;
		this.watchers = $.getJSON('operators.json', function(data) {
			that.operators = data;
			// enable watchers combobox in DOM
			$.each(data, function(i, operator) {
				$('.camera-block').find('.supervisor').append("<option value={0}>{1}</option>".format(operator.id, operator.name));			
			});
			$('.camera-block').find('.supervisor').attr('disable', 'none');
			console.log(that.operators);
		});
		// init datepickers
		$(".datepicker-el").datetimepicker({
			language: 'ru',
			pickTime: false
		});
		$(".timepicker-el").datetimepicker({
			language: 'ru',
			pickDate: false
		});	
		
		// toggle one datepicker groups when other is active
		$("#event-date-overall").on('changeDate', function () {
			var input = $(this).find('input');
			if (input.val() !== '') {
				input.removeClass('disabled');
				$('#event-date-from, #event-date-to').find('input').addClass('disabled').val('');
			}
			else {
				$('#event-date-from, #event-date-to').find('input').removeClass('disabled');
			}
		});
		$("#event-date-from").on('changeDate', function () {
			var input = $(this).find('input');
			if (input.val() !== '') {
				$('#event-date-from, #event-date-to').find('input').removeClass('disabled');
				$('#event-date-overall').find('input').addClass('disabled').val('');
			}
			else {
				$('#event-date-overall').find('input').removeClass('disabled');
			}
		});
		// set max and min date according to period
		$("#event-date-from").on('changeDate', function () {		
			var start_date = $('#event-date-from').data('datetimepicker').getDate();
			$("#event-date-to").data('datetimepicker').setStartDate(start_date);
		});
		$("#event-date-to").on('changeDate', function () {
			var end_date = $('#event-date-to').data('datetimepicker').getDate();
			$("#event-date-from").data('datetimepicker').setEndDate(end_date);
		});
		
		// minor events
		$('.save-block').on('click', ".button", function () {
			that.save_event();
		});
		$('.popup-close').on('click', function () {
			$(this).parents('.popup-error').hide();
		});
		$('body').on('click', '.error', function() {
			$(this).removeClass('error');
		});
		if (!this.is_new) {
			$('#content').addClass('event-existing');
			this.load_data();
		}
		
		$('body').removeClass('preloader');
		this.map = new CityMap(this.is_new);
		// initialize lightbox
		$(".photos-list a").colorbox({
			rel:'img-group',
			maxWidth: "800",
			maxHeight: "800",
		});
	}
	
	CityEvent.prototype = {
		load_data: function() {
			var that = this;
			$.getJSON('event.json', function (data) {
				that.data = data;
				that.fit_data(data);
			});
		},
		fit_data: function(data) {
			$('#event-name').val(data.name);
			$('#event-description').val(data.desc);
			$('#event-class').val(data.class);
			this.fit_data_date(data.period);
			this.map.fit_data_geo(data.geo);
		},
		fit_data_date: function(period) {
			var date_start = new Date(period.start*1000);
			var date_end = new Date(period.end*1000);
			console.log(date_start, date_end);
			// if times are in the same day
			if((date_end - date_start) / (1000 * 60 * 60) < 24) {
				$('#event-date-overall').data('datetimepicker').setDate(date_start);
				$('#event-date-from, #event-date-to').find('input').addClass('disabled');
			}
			else {
				$('#event-date-from').data('datetimepicker').setLocalDate(date_start);
				$('#event-date-to').data('datetimepicker').setLocalDate(date_end);
				$('#event-date-overall').find('input').addClass('disabled');
			}
			$('#event-time-from').data('datetimepicker').setLocalDate(date_start);
			$('#event-time-to').data('datetimepicker').setLocalDate(date_end);
			
		},
		save_event: function() {
			if (this.is_valid_event()) {
				var data = {
					'name': $('#event-name').val(),
					'desc': $('#event-description').val(),
					'class': $('#event-class').val(),
					'address': $('#event-address').val(),
					'period': this.get_period(),
					'geo': this.map.get_geo()
				};
				
				$.ajax({
					type: "POST",
					url: "/post_event",
					data: JSON.stringify(data),
				});
			}
		},
		is_valid_event: function() {
			var flag = true;
			if ($('#event-name').val() === "") {
				$('#event-name').addClass('error');
				flag = false;
			}
			if ($('#event-date-overall input').val() === "" && $('#event-date-from input').val() === "") {
				$('#event-date-overall, #event-date-from').find('input').addClass('error');
				flag = false;
			}	
			if ($('#event-date-from input').val() !== "" && $('#event-date-to input').val() == "") {
				$('#event-date-overall, #event-date-to').find('input').addClass('error');
				flag = false;
			}
			if ($('#event-time-from input').val() === "") {
				$('#event-time-from input').addClass('error');
				flag = false;
			}
			if ($('#event-time-to input').val() === "") {
				$('#event-time-to input').addClass('error');
				flag = false;
			}
			if ($('#event-date-to').data('datetimepicker').getDate() <= $('#event-date-from').data('datetimepicker').getDate()) {
				if ($('#event-time-to').data('datetimepicker').getDate() < $('#event-time-from').data('datetimepicker').getDate()) {
					$('#event-time-to, #event-time-from').find('input').addClass('error');
					flag = false;
				}
			}
			
			if ($('.section-info:not(.template)').length == 0) {
				$('#cameras-address').addClass('error');
				flag = false;
			}
			
			if (!this.is_valid_cameras()) {
				$(".popup-error").show();
				flag = false;
			}
			return flag;
		},
		is_valid_cameras: function() {
			// dummy for camera validation
			return $('.section-info:not(.template)').length < 10;
		},
		get_period: function() {
			var period = {};
			var date_start, date_end, time_start, time_end;
			if ($('#event-date-overall input').val() !== "") {
				date_start = date_end = $('#event-date-overall').data('datetimepicker').getDate();
			}
			else {
				date_start = $('#event-date-from').data('datetimepicker').getDate();
				date_end = $('#event-date-to').data('datetimepicker').getDate();
			}		

			// get milliseconds from the day start
			time_start = $('#event-time-from').data('datetimepicker').getLocalDate().getTime();
			time_start = new Date(time_start) - new Date(time_start).setHours(0, 0, 0, 0);

			time_end = $('#event-time-to').data('datetimepicker').getLocalDate().getTime();
			time_end = new Date(time_end) - new Date(time_end).setHours(0, 0, 0, 0);

			// finally
			period = {
				start: parseInt((date_start.setHours(0,0,0,0) + time_start)/1000),
				end: parseInt((date_end.setHours(0,0,0,0) + time_end)/1000)
			};
			console.log(period.start*1000, period.end*1000);
			return period;
		}
	};
	
	function CityMap(is_new) {
		this.is_new = is_new;
		this.options = {
			Address_Marker: L.Icon.extend({
				options: {
					shadowUrl: null,
					iconAnchor: new L.Point(7, 7),
					iconSize: new L.Point(15, 15),
					iconUrl: 'img/address-marker.svg',
				}
			}),
			Selected_Address_Marker: L.Icon.extend({
				options: {
					shadowUrl: null,
					iconAnchor: new L.Point(15, 15),
					iconSize: new L.Point(30, 30),
					iconUrl: 'img/selected-address-marker.svg',
				}
			}),
			draw: {
				stroke: true,
				color: '#f00',
				weight: 3,
				opacity: 0.7,
				fill: '#f00',
				fillOpacity: 0.2, 
				clickable: true
			}
		};
		this.init(is_new);
	} 
	CityMap.prototype = {
		constructor: CityMap,
		init: function(is_new) {
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
			if (is_new) {
				var drawControl = new L.Control.Draw({
					draw: {
						position: 'topleft',
						polygon: {
							allowIntersection: false,
							drawError: {
								color: '#b00b00',
								timeout: 1000
							},
							shapeOptions: this.options.draw,
							showArea: true
						},
						polyline: {
							metric: false,
							shapeOptions: $.extend({}, that.options.draw, {
								fill: false
							}),
						},
						circle: {
							shapeOptions: this.options.draw,
						},
						rectangle: {
							shapeOptions: this.options.draw,
						},
						marker: {
							icon: new that.options.Address_Marker()
						}
					},
					edit: {
						featureGroup: this.drawnItems
					}
				});
				this.map.addControl(drawControl);
			}

			this.map.on('draw:created', function (e) {
				var type = e.layerType,
					layer = e.layer;
				
				that.drawnItems.addLayer(layer);
				var el = that.build_section_info(type, layer);				
				that.get_cameras(type, layer, el);
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
			
			$('.right').on('hover', '.section-info', function() {
				var $this = $(this);
				var layer = $this.data('layer');
				// set default
				$('svg path').attr('stroke-dasharray', "");
				for (var i = 0; i < that.markers.length; i++) {
					that.markers[i].setIcon(new that.options.Address_Marker());
				}
				// select marker or svg
				if (!$this.hasClass('active-info')) {		
					if (layer._icon) {
						layer.setIcon(new that.options.Selected_Address_Marker());
						//layer.fire('click');
					}
					else if (layer._container) {
						var svg = layer._container;
						$(svg).find('path').attr('stroke-dasharray', "10,10");
					}
					layer.openPopup();
					$('.active-info').removeClass('active-info');
					$this.addClass('active-info');
				}
				else {					
					$('.active-info').removeClass('active-info');
				}
			});
			
			/*
			$('#cameras-address').geocomplete().bind("geocode:result", function(event, result){
				var coords = L.latLng(result.geometry.location.k, result.geometry.location.A)
				that.map.setView(coords);
				var radius = $('#cameras-radius').val();
				if (that.is_new) {					
					if (radius == 0) {					
						var marker = L.marker(coords, {icon: new that.options.Address_Marker()}).addTo(that.drawnItems);
						that.build_section_info('marker', marker);
					}
					else if ($.isNumeric(radius)) {
						var circle = L.circle(coords, radius * 1000, that.options.draw).addTo(that.drawnItems);
					}
					that.build_section_info('circle', circle);
				}
				else {
					L.setView(coords);
				}
			});
			*/
		},
		create_camera_marker: function(position) {
			var marker = L.marker([position[0], position[1]], {icon: new this.options.Address_Marker()}).addTo(this.drawnItems);
			return marker;
		},
		build_section_info: function(type, layer) {
			$('#cameras-address').removeClass('error');
			var template  = $('.template.section-info').clone(true).removeClass('template');
			var header, clazz;
			switch (type) {
				case 'marker':
					header = 'Адрес';
					clazz = 'address';
					this.markers.push(layer);
					this.setPopupAddress(layer);
					break;					
				case 'circle':
					header = 'Выделенная область';
					clazz = 'circle';
					layer.bindPopup(header);
					break;
				case 'polygon':
				case 'rectangle':
					header = 'Выделенная область';
					clazz = 'area';					
					layer.bindPopup(header);
					break;
				case 'polyline':
					header = 'Маршрут';
					clazz = 'route';							
					layer.bindPopup(header);
					break;
			}
			template.addClass(clazz).find('h5 > span').text(header);
			template.data("layer", layer);
			template.attr('data-leaflet-id', layer._leaflet_id);
			console.log(layer);
			template.appendTo('section.right > .cameras-list');
			return template;
			//this.get_cameras(type, layer, template);
		},
		get_cameras: function(type, layer, container) {
			var data = {};
			var that = this;
			var url = 'http://10.1.30.41:9000/massevent/videosources/';
			data.type = type;
			switch (type) {
				case 'marker':
					data.latlng = layer.getLatLng()					
					break;					
				case 'circle':
					data.latitude = layer.getLatLng().lat;
					data.longitude = layer.getLatLng().lng;
					data.radius = layer.getRadius()/1000;
					url += 'in/circle/';
					break;
				case 'polygon':
				case 'rectangle':
				case 'polyline':
					data = [];
					var latlangs = layer.getLatLngs();
					for (var i=0; i < latlangs.length; i++) {
						data.push([latlangs[i].lat, latlangs[i].lng]);
					}
					url += 'in/polygon/';
					break;
			}
			url = "/cameras.json";
			$.getJSON("cameras.json", function(cameras) {
				console.log(cameras);
				// fit cameras into container
				for (var i = 0; i < cameras.length; i++) {						
					var camera_block = $('.template.camera-block').clone(true).removeClass('template');
					camera_block.find(".camera-name").text(cameras[i].name);
					var marker = that.create_camera_marker(cameras[i].position);
					camera_block.data('marker', marker).appendTo(container);
				}
				container.find('.no-cameras-message').removeClass('preloader');
			});
			/*
			$.ajax({
				dataType: "json",
				//type: "POST",
				url: url,
				//contentType: "application/json",
				//data: JSON.stringify(data),
				//crossDomain: true,
				success: function(cameras){
					console.log(cameras);
					// fit cameras into container
					for (var i = 0; i < cameras.length; i++) {						
						var camera_block = $('.template.camera-block').clone(true).removeClass('template');
						camera_block.find(".camera-name").text(cameras[i].name);
						var marker = that.map.create_camera_marker(cameras[i].position);
						camera_block.data('marker', marker).appendTo(container);
					}
					container.find('.no-cameras-message').removeClass('preloader');
				},
				error: function() {
					console.error('Failed to load cameras in area');
					container.find('.no-cameras-message').removeClass('preloader');
				} 
			}); 
			*/
		},
		setPopupAddress: function(layer) {
			var latlng = new google.maps.LatLng(layer._latlng.lat, layer._latlng.lng);
			var geocoder = new google.maps.Geocoder();
			var address = '';
			geocoder.geocode({'latLng': latlng}, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					address = results[0].formatted_address;
					layer.bindPopup(address);
					layer.fire('click');
				} 
			});
		},
		get_geo: function() {
			var layer;
			var data = {
				addresses: [],
				routes: [],
				areas: [],
				circles: []
			};
			var points, i;
			$('.section-info:not(.template)').each(function(i, section) {
				layer = $(section).data('layer');
				if ($(section).hasClass('area')) {
					points = [];
					for (i = 0; i < layer._latlngs.length; i++) {
						points.push([
							layer._latlngs[i].lat,
							layer._latlngs[i].lng,
						]);
					}
					data.areas.push(points);					
				} else if ($(section).hasClass('route')) {
					points = [];
					for (i = 0; i < layer._latlngs.length; i++) {
						points.push([
							layer._latlngs[i].lat,
							layer._latlngs[i].lng,
						]);
					}
					data.routes.push(points);					
				} else if ($(section).hasClass('address')) {
					data.addresses.push([
						layer._latlng.lat,
						layer._latlng.lng,
					]);
				} else if ($(section).hasClass('circle')) {
					data.circles.push({
						latitude : layer._latlng.lat,
						longitude : layer._latlng.lng,
						radius : (layer._mRadius/1000).toFixed(3)
					});
				}
			});
			return data;
		},
		fit_data_geo: function(geo) {
			var that = this;
			var i, layer, counter = 0;
			for (i = 0; i < geo.areas.length; i++) {
				layer = L.polygon(geo.areas[i], this.options.draw).addTo(this.drawnItems);
				this.build_section_info('polygon', layer);
				counter++;
			}
			for (i = 0; i < geo.routes.length; i++) {
				layer = L.polyline(
					geo.routes[i], 
					$.extend({}, that.options.draw, {
						fill: false
					})
				).addTo(this.drawnItems);
				this.build_section_info('polyline', layer);
				counter++;
			}
			for (i = 0; i < geo.circles.length; i++) {
				layer = L.circle([geo.circles[i].latitude, geo.circles[i].longitude], geo.circles[i].radius*1000, that.options.draw).addTo(this.drawnItems);
				this.build_section_info('circle', layer);
				counter++;
			}
			for (i = 0; i < geo.addresses.length; i++) {
				layer = L.marker([geo.addresses[i][0], geo.addresses[i][1]], {icon: new that.options.Address_Marker()}).addTo(this.drawnItems);
				this.build_section_info('marker', layer);
				counter++;
			}
			$('.selected-cameras').text(counter);
		}
	}
	$(document).ready(function() {
		var event, event_params = {
			is_new: true
		};
		if (window.location.hash == "#existing") {
			// load existing event to view post-factum
			event_params.is_new = false;
		}
		event = new CityEvent(event_params);
	});
})(jQuery);