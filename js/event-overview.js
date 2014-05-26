(function($) {
	'use strict';
	function get_period() {
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
			start: date_start.setHours(0,0,0,0) + time_start,
			end: date_end.setHours(0,0,0,0) + time_end
		};
		return period;
	}
	
	function show_event() {
		var $this = $(this);
		var url = "event.html#existing";
		// ...
		// some preparations
		// ...
		window.location = url;
	}
	
	function search_events() {		
		if ($('#event-time-from input').val() !== '' || $('#event-time-to input').val() !== '' ) {
			if ($('#event-time-to').data('datetimepicker').getDate() < $('#event-time-from').data('datetimepicker').getDate())  {
				$('#event-time-to, #event-time-from').find('input').addClass('error');
				return 0;
			}
		}		
		var period = get_period();
		console.log('Searching events from ' + new Date(period.start) + ' to ' + new Date(period.end));
		var name = $('.search-event-name').val().toLowerCase();
		var address = $('.search-event-address').val().toLowerCase();
		
		$('.event-row:not(.template)').each(function(i, row) {
			row = $(row);
			if (name != '') {
				if (row.attr('data-name').toLowerCase().indexOf(name) != -1) {
					row.show();
					return 1;
				}
			}
			if (address != '') {
				if (row.attr('data-address').toLowerCase().indexOf(address) != -1) {
					row.show();
					return 1;
				}
			}
			if (row.attr('data-start') > period.start && row.attr('data-end') < period.end) {
				row.show();
			}
			else {
				row.hide();
			}
		});
		if ($('.event-row:visible').length === 0) {
			$('.no-results').show();
		}
		else {
			$('.no-results').hide();
		}
	}
	
	$(document).ready(function() {
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
			search_events();
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
			search_events();
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
		$('.search .button-search').on('click', search_events);
		$('.event-row').on('click', show_event);
		$('.search .clean-search').on('click', function(e) {
			e.preventDefault();
			$('.search input').val('');			
			$('.event-list .event-row').show();
			$('.event-list .event-row').length === 0 ? $('.no-results').show() : $('.no-results').hide();
		});
		$('body').on('click', '.error', function() {
			$(this).removeClass('error');
		});
	});
})(jQuery);