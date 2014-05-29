
(function($) {
	'use strict';
	function ARM_Video() {
		this.options = {
			instrument: 'rect', // rect\screenshot
			mode: 'multiple' // single\multiple
		}
		this.init();
	}
	ARM_Video.prototype = {
		constructor: ARM_Video,
		init: function() {
			var that = this;
			this.calculate_video_position();
			$('.instrument').on('click', function() {
				$('.instrument.active').removeClass('active');
				$(this).addClass('active');
				that.options.instrument = $(this).attr('data-instrument');
			});
			
			$('.video-block').on('click', '.expand', function() {
				var container = $('.video-block');
				if ($(this).parents('.multiple-container').length > 0) {
					// expand one, turn on the single mode
					that.options.mode = 'single';
					var data = $(this).parents('.video-element').find('img').attr('src');
					$('.single-container img').attr('src', data);
					$('.video-block').addClass('single').removeClass('multiple');
				}
				else {
					// roll up one, turn on the multiple mode
					that.options.mode = 'multiple';
					$('.video-block').removeClass('single').addClass('multiple');
				}
				that.calculate_video_position();
			});
			
			////////
			$('.rectangle').on('click', function() {
				var video_element = $('.video-element.template').clone(true).removeClass('template').appendTo('.multiple-container');
				that.calculate_video_position();
			});
			$('.screenshot').on('click', function() {
				$('.multiple-container').find('.video-element').first().remove();
				that.calculate_video_position();
			});
			////////
		},
		calculate_video_position: function () {
			console.log('Repainting');
			var count = $('.multiple-container .video-element').length;
			var percentage;
			var ratio = 16/9
			var width, height;
			if (this.options.mode == 'multiple') {
				percentage = Math.floor(100/(Math.floor(count/3)));
				$('.video-element').css({
					width: 33 + "%",
					height: 33 + "%"
				});
			}
			if (this.options.mode == 'single') {
				percentage = Math.floor(100/(Math.ceil(count/2)));
				$('.video-element').css({
					width: 50 + "%",
					height: percentage + "%"
				});
			}
		}
	}
	$(document).ready(function() {
		var arm_video = new ARM_Video();
	});
})(jQuery);
