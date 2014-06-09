
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
		this.is_past = event_params.is_past;
		this.is_watch = event_params.is_watch;
		this.watchers = $.getJSON('operators.json', function(data) {
			that.operators = data;
			// enable watchers combobox in DOM
			$.each(data, function(i, operator) {
				$('.camera-block').find('.operator').append("<option value={0}>{1}</option>".format(operator.id, operator.name));			
			});
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
		if (this.is_past) {
			$('#content').addClass('event-past');
			this.load_data();
		}
		if (this.is_watch) {
			$('#content').addClass('event-watch');
			this.load_data();
		}
		
		$('body').removeClass('preloader');
		var allow_edit = !this.is_past && !this.is_watch;
		this.map = new CityMap(allow_edit);
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
				if (that.is_watch) {
					that.fit_data_for_operator(data);
				}
				else {
					that.fit_data(data);
				}
			});
		},
		fit_data_for_operator: function(data) {
			this.map.fit_geo(data.geo, data.videosources);
		},
		fit_data: function(data) {
			$('#event-name').val(data.name);
			$('#event-description').val(data.description);
			$('#event-class').val(data.class);
			$('.to-sub-menu.active').text(data.name);
			this.fit_data_date(data.period);
			this.map.fit_geo(data.geo, data.videosources);
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
					'description': $('#event-description').val(),
					'type': $('#event-class').val(),
					'address': $('#event-address').val(),
					'period': this.get_period(),
					'geo': this.map.get_geo(),
					'videosources': this.map.get_videosources()
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
			return true;// $('.section-info:not(.template)').length < 10;
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
	
	function CityMap(allow_edit) {
		this.allow_edit = allow_edit;
		this.options = {
			Address_Marker: L.Icon.extend({
				options: {
					shadowUrl: null,
					iconAnchor: new L.Point(7, 7),
					iconSize: new L.Point(15, 15),
					iconUrl: 'img/address-marker.svg',
				}
			}),
			Address_Selected_Marker: L.Icon.extend({
				options: {
					shadowUrl: null,
					iconAnchor: new L.Point(15, 15),
					iconSize: new L.Point(30, 30),
					iconUrl: 'img/address-selected-marker.svg',
				}
			}),
			Camera_Marker: L.divIcon({
				iconAnchor: new L.Point(22, 50),
				iconSize: new L.Point(45, 50),
				popupAnchor:  [0, -40],
				html: '1',
				className: 'leaflet-camera-icon'
			}),
			Camera_Selected_Marker: L.Icon.extend({
				options: {
					shadowUrl: null,
					iconSize: [150, 102],
					iconAnchor: [42, 102],
					iconUrl: 'img/camera-selected-marker.png',
				}
			}),
			draw: {
				stroke: true,
				color: '#ec8584',
				weight: 2,
				opacity: 0.7,
				fillColor: '#b6bcbf',
				fillOpacity: 0.3, 
				clickable: true
			}
		};
		this.init(allow_edit);
	} 
	CityMap.prototype = {
		constructor: CityMap,
		init: function(allow_edit) {
			var that = this;
			this.address_markers = [];
			this.camera_markers = {};
			this.map = L.map('map-container').setView([59.94, 30.35], 13);
			L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
				maxZoom: 18,
				attribution: '© <a href="http://mapbox.com">Mapbox</a>',
				id: 'examples.map-i86knfo3'
			}).addTo(this.map);
			
			this.drawnItems = new L.FeatureGroup();
			this.map.addLayer(this.drawnItems);
			if (allow_edit) {
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
						featureGroup: this.drawnItems,
						// TODO: support the @edit@ function
						edit: false
					}
				});
				this.map.addControl(drawControl);
			}

			this.map.on('draw:created', function (e) {
				var type = e.layerType,
					layer = e.layer;				
				that.drawnItems.addLayer(layer);
				that.create_area(layer, type);				
			});
			
			/*
			// TODO: support the @edit@ function
			this.map.on('draw:edited', function (e) {
				var layers = e.layers;
				that.delete_area(layers);
				layers.eachLayer(function (layer) {
					debugger
					//that.create_area(layer, type);
				});									
			});
			*/
			
			this.map.on('draw:deleted', function (e) {
				that.delete_area(e.layers);
				that.update_cameras_numbers();
			});
			
			$('.right').on('click', '.section-info .info', function() {
				var $this = $(this).parents('.section-info');
				var layer = $this.data('layer');
				// set default
				$('svg path').attr('stroke-dasharray', "");
				for (var i = 0; i < that.address_markers.length; i++) {
					that.address_markers[i].setIcon(new that.options.Address_Marker());
				}
				// select marker or svg
				if (!$this.hasClass('active-info')) {		
					if (layer._icon) {
						layer.setIcon(new that.options.Address_Selected_Marker());
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
			
			$('.right').on('click', '.camera-block', function(e) {
				var $this = $(this);
				var layer = $this.data('camera').marker;
				// select marker or svg
				$('.camera-active').removeClass('camera-active');
				$this.addClass('camera-active');
				layer.openPopup();
			});
			
			$('.right').on('click', '.camera-block > label', function(e) {
				e.stopPropagation();
				$(this).siblings('input[type=checkbox]').click();
			});
			
			$('.right').on('change', '.camera-block input[type=checkbox]', function() {
			var icon = $($($(this).parent()).data('camera').marker._icon);
				icon.toggleClass('leaflet-selected-camera-icon');
				if ($(this).prop('checked')) {
					$(this).parent().find('.operator').removeAttr('disabled');
				}		
				else {
					$(this).parent().find('.operator').attr('disabled', 'disabled');
				}	
				$('.selected-cameras').text($('.camera-block input[type=checkbox]:checked').length);
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
		create_camera_marker: function(position, state) {
			var marker = L.marker([position[0], position[1]], {icon: this.options.Camera_Marker}).on('mouseover', function() {
				$('.camera-active').removeClass('camera-active');
				$('.camera-block[leaflet-id={0}]'.format(this._leaflet_id)).addClass('camera-active');
			}).on('mouseout', function() {
				$('.camera-block[leaflet-id={0}]'.format(this._leaflet_id)).removeClass('camera-active');
			});
			
			marker.addTo(this.drawnItems);
			if (state != 1) {
				$(marker._icon).addClass('leaflet-disabled-camera-icon');
			}
			return marker;
		},
		delete_camera_marker: function(camera) {
			delete this.camera_markers[camera.id];
			this.map.removeLayer(camera.marker);
		},
		update_cameras_numbers: function() {
			var marker,
				that = this;
			$('.section-info .camera-block').each(function(i, camera_block) {
				camera_block = $(camera_block);
				marker = camera_block.data('camera').marker;
				camera_block.find('.camera-name').text('{0}. {1}'.format(i+1, camera_block.data('camera').name));
				marker._icon.innerHTML = i+1;
			});
			$('.selected-cameras').text($('.camera-block input[type=checkbox]:checked').length);
		},
		create_area: function(layer, type) {
			var el = this.build_section_info(type, layer);				
			this.set_cameras(type, layer, el);
		},
		delete_area: function(layers) {
			var that = this;
			for (var leaflet_id in layers._layers) {
				$('.section-info:not(.template)').each(function(i, section) {
					if ($(section).data('layer')._leaflet_id == leaflet_id ) {
						var cameras = $(section).find('.camera-block');
						for (var i = 0; i < cameras.length; i++) {
							that.delete_camera_marker($(cameras[i]).data('camera'));
						}
						$(section).remove();
					}
				});
			}
			console.log(this.camera_markers);
		},
		build_section_info: function(type, layer) {
			$('#cameras-address').removeClass('error');
			var template  = $('.template.section-info').clone(true).removeClass('template');
			var header, clazz;
			switch (type) {
				case 'marker':
					header = 'Адрес';
					clazz = 'address';
					this.address_markers.push(layer);
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
			//this.set_cameras(type, layer, template);
		},
		set_cameras: function(type, layer, container) {
			var data = {};
			var that = this;
			var url = 'http://10.1.30.41:9000/massevent/videosources/';
			data.type = type;
			switch (type) {
				case 'marker':
					data.latitude = layer.getLatLng().lat;
					data.longitude = layer.getLatLng().lng;
					data.radius = 0.05;
					url += 'in/circle/';
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
			/*
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
			*/
			container.find('.no-cameras-message').addClass('preloader');
			$.ajax({
				dataType: "json",
				type: "POST",
				url: url,
				contentType: "application/json",
				data: JSON.stringify(data),
				crossDomain: true,
				success: function(cameras){
					that.fit_cameras(cameras, container);					
					container.find('.no-cameras-message').removeClass('preloader');
				},
				error: function() {
					console.error('Failed to load cameras in area');
					container.find('.no-cameras-message').removeClass('preloader');
				} 
			}); 			
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
		get_videosources: function() {
			var cameras = [];
			var camera, operator;
			$('.camera-block:not(.template) input[type=checkbox]').each(function(i, input) {
				camera = $(input).parents('.camera-block').data('camera');
				operator = $(input).prop('checked') ? $(input).parents('.camera-block').find('.operator').val() : "";
				cameras.push({
					id: camera.id,
					name: camera.name,
					operator: operator,
					position: [
						camera.marker._latlng.lat,
						camera.marker._latlng.lng
					]
				});
				
			});
			return cameras;
		},
		get_geo: function() {
			var layer;
			var data = {
				addresses: [],
				routes: [],
				polygons: [],
				circles: []
			};
			var points, i;
			$('.section-info:not(.template)').each(function(i, section) {
				layer = $(section).data('layer');
				// get selected cameras in area
				var videosources = [];
				$(section).find('.camera-block input[type=checkbox]').each(function(i, camera) {
					camera = $(this).parents('.camera-block'); 
					console.log($(camera).data('camera'));
					videosources.push(($(camera).data('camera').id).toString());
					
				});
				if ($(section).hasClass('area')) {
					points = [];
					for (i = 0; i < layer._latlngs.length; i++) {
						points.push([
							layer._latlngs[i].lat,
							layer._latlngs[i].lng
						]);
					}
					data.polygons.push({
						coords: points,
						videosources: videosources
					});					
				} else if ($(section).hasClass('route')) {
					points = [];
					for (i = 0; i < layer._latlngs.length; i++) {
						points.push([
							layer._latlngs[i].lat,
							layer._latlngs[i].lng,
						]);
					}
					data.routes.push({
						coords: points,
						videosources: videosources
					});					
				} else if ($(section).hasClass('address')) {
					data.addresses.push({
						coords: [
							layer._latlng.lat,
							layer._latlng.lng,
						],
						videosources: videosources
					});
				} else if ($(section).hasClass('circle')) {
					data.circles.push({
						latitude : layer._latlng.lat,
						longitude : layer._latlng.lng,
						radius : (layer._mRadius/1000).toFixed(3),
						videosources: videosources
					});
				}
				
			});
			return data;
		},
		fit_geo: function(geo, videosources) {
			var that = this;
			var i, counter = 0;
			for (i = 0; i < geo.polygons.length; i++) {
				this.fit_geo_area(geo.polygons[i], 'polygon', videosources);
				counter++;
			}
			for (i = 0; i < geo.routes.length; i++) {
				this.fit_geo_area(geo.routes[i], 'polyline', videosources);
				counter++;
			}
			for (i = 0; i < geo.circles.length; i++) {
				this.fit_geo_area(geo.circles[i], 'circle', videosources);
				counter++;
			}
			for (i = 0; i < geo.addresses.length; i++) {
				this.fit_geo_area(geo.addresses[i], 'marker', videosources);
				counter++;
			}
			$('.selected-cameras').text(counter);
		},
		fit_geo_area: function(area, type, videosources) {
			var layer, container, cameras;
			switch(type) {
				case "polygon":
					layer = L.polygon(area.coords, this.options.draw).addTo(this.drawnItems);
					break;
				case "polyline":
					layer = L.polyline(
						area.coords, 
						$.extend({}, this.options.draw, {
								fill: false
						})
					);
					break;
				case "circle":
					layer = L.circle([area.latitude, area.longitude], area.radius*1000, this.options.draw).addTo(this.drawnItems);
					break;
				case "marker":
					layer = L.marker([area.coords[0], area.coords[1]], {icon: new this.options.Address_Marker()}).addTo(this.drawnItems);
					break;
				default:
					break;					
			}
			container = this.build_section_info(type, layer);
			cameras = this.parse_cameras_from_areas(area.videosources, videosources);
			this.fit_cameras(cameras, container);
			
		},
		parse_cameras_from_areas: function(ids, videosources) {
			var cameras = [];
			for (var i = 0; i < ids.length; i++) {
				for (var j = 0; j < videosources.length; j++) {
					if (videosources[j].id == ids[i]) {
						cameras.push(videosources[j]);		
						break;
					}
				}
			}
			console.log(cameras);
			return cameras;			
		},
		fit_cameras: function(cameras, container) {
			// fit cameras into container					
			for (var i = 0; i < cameras.length; i++) {				
				// if camera is new on the map
				if (!this.camera_markers[cameras[i].id]) {
					if (cameras[i].operator != '' || this.allow_edit) {
						container.find('.no-cameras-message').hide();
						var camera_block = $('.template.camera-block').clone(true).removeClass('template');
						camera_block.find(".camera-name").text(cameras[i].name);
						cameras[i].state = cameras[i].state || 1;
						var marker = this.create_camera_marker(cameras[i].position, cameras[i].state);
						marker.bindPopup(cameras[i].name);
						var camera = {
							id: cameras[i].id,
							name: cameras[i].name,
							position: cameras[i].position,
							state: cameras[i].state, // 0 - not found, 1 - ok, 2 - break
							marker: marker
						};
						this.camera_markers[cameras[i].id] = camera;
						camera_block.attr('leaflet-id', marker._leaflet_id).data('camera', camera).appendTo(container);
						if (cameras[i].state != 1) {
							camera_block.addClass('camera-disable').find("[type=checkbox]").remove();
						}
						if (cameras[i].operator && cameras[i].operator != '') {
							camera_block.find('.operator').val(cameras[i].operator);
							camera_block.find('input[type=checkbox]').click();
						}
					}					
				}
			}
			this.update_cameras_numbers();
		}
	}
	$(document).ready(function() {
		var event, event_params = {
			is_new: true,
			is_past: false,
			is_watch: false
		};
		if (window.location.hash == "#existing") {
			// load existing event
			event_params.is_new = false;
		}
		if (window.location.hash == "#past") {
			// load past event to view post-factum
			event_params.is_past = true;
		}
		if (location.pathname == "/apkbg/event-watch.html") {
			// load to monitor during the event
			event_params.is_watch = true;
		}
		event = new CityEvent(event_params);
	});
})(jQuery);