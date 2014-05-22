 document.addEventListener("DOMContentLoaded", function() {
	var get_url_param = function(name) {
		return decodeURIComponent(
			(RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,""])[1]
		);
	};
	
	document.querySelector('#username').focus();
	document.querySelectorAll("form")[0].addEventListener("submit", function(e) {
		if (!(document.querySelector("#username").value) || !(document.querySelector("#password").value)) {
			document.querySelector("#error").style.display = "block";
			e.preventDefault();
		}
		return true;
	});

	var error = get_url_param("error");
	if (error) {
		document.querySelector("#error").style.display = "block";
	} else {
		document.querySelector("#error").style.display = "none";
	}
	var next = get_url_param("next");
	document.querySelector('#next').value = next ? next : "";
});