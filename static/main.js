/*	Initialize
  ================================================================================== */

$(document).ready(function(){
	LOC.init($('div.card.location'));
	MAP.init($('div.card.map'));
});


/* 	Location service
  ================================================================================== */

var LOC = LOC || {
	// Options
	options: {
		enableHighAccuracy: true
	},

	// Support
	hasSupport: function() {
		if (navigator.geolocation)
			return true;

		return false;
	},

	// Success
	locationSuccess: function(card, location) {
		// Location
		card.find('td#latitude').text(location.coords.latitude);
		card.find('td#longitude').text(location.coords.longitude);
		card.find('td#altitude').text(location.coords.altitude);

		// Time
		card.find('td#time').text(moment(location.timestamp).format('DD.MM.YY, HH:mm:ss'));

		// Accuracy
		LOC.determineAccuracy(card.find('span#accuracy'), location.coords.accuracy);

		// Map
		MAP.updateLocation(location.coords);

		// Address
		MAP.getAddress(card.find('td#address'));

		// Altitude
		MAP.getAltitude(card.find('td#altitude'));

		// Enable sharing
		card.find('a.button.share').removeClass('disabled').click(function() {
			// Send to server
			console.log(JSON.stringify(location));

			// Feedback (purely cosmetic, not very elegant either)
			$('i.fa-location-arrow').fadeOut(300, function(){$('i.fa-check').fadeIn(600)})
			setTimeout(function(){ 
				$('i.fa-check').fadeOut(600, function(){$('i.fa-location-arrow').fadeIn(300)})
    		}, 3000); 
		});
	},

	// Error
	locationError: function(card, error) {
		console.log(error);
	},

	// Accuracy
	determineAccuracy: function(updateElement, accuracy) {
		var color = 'secondary';
		var text = 'Ukjent grad av nøyaktighet';

		if (accuracy >= 3000) {
			color = 'alert';
			text = 'Svært lav nøyaktighet';
		}
		if (accuracy >= 1000 && accuracy < 3000) {
			color = 'alert';
			text = 'Dårlig nøyaktighet';
		}
		if (accuracy >= 100 && accuracy < 1000) {
			color = 'warning';
			text = 'Lav nøyaktighet';
		}
		if (accuracy >= 50 && accuracy < 100) {
			color = 'warning';
			text = 'Middels nøyaktighet';
		}
		if (accuracy >= 25 && accuracy < 50) {
			text = 'Grei nøyaktighet';
		}
		if (accuracy >= 10 && accuracy < 25) {
			color = 'success';
			text = 'Høy nøyaktighet';
		}
		if (accuracy >= 0 && accuracy < 10) {
			color = 'success';
			text = 'Svært høy nøyaktighet';
		}

		// Color code
		updateElement
			.addClass(color)
			.text(text)
			.show()
			.next()
				.text(Math.round(accuracy) + ' m.')
				.show()

	},

	// Initialize
	init: function(card) {
		// Check support
        if (this.hasSupport())
        	// Callbacks
        	var locationSuccess = this.locationSuccess;
        	var locationError = this.locationError;

        	// Get location
        	navigator.geolocation.getCurrentPosition(
        		// Success
				function(location) {
     				locationSuccess(card, location);
 				},
 				// Error
 				function(error) {
 					locationError(card, error);
				}, 
				// Options
 				this.options
			);
	}
};


/* Mapping service
  ================================================================================== */

var MAP = MAP || {
	// Object
	obj: null,

	// Location
	location: null,

	// Options
	options: {
		center: new google.maps.LatLng(43, 11),
		zoom:   1
	},

	// Update location
	updateLocation: function(location) {
		// Set location
		this.location = new google.maps.LatLng(location.latitude, location.longitude);

		// Marker
		this.addMarker();

		// Accuracy radius
		this.drawAccuracyRadius(location.accuracy);
	},

	// Add marker
	addMarker: function() {
		// Marker
		var marker = new google.maps.Marker({
            map:        this.obj,
            animation:  google.maps.Animation.DROP,
            position:   this.location
        });

        // Zoom
        this.obj.setCenter(this.location);
        this.obj.setZoom(14);
	},

	// Get address
	getAddress: function(updateElement) {
		var geocoder = new google.maps.Geocoder();

        geocoder.geocode({'latLng': this.location}, function(data, status) {
            if(status == google.maps.GeocoderStatus.OK){
            	// Update address
                updateElement.text(data[1].formatted_address);
            }
        });
	},

	// Get altitude
	getAltitude: function(updateElement) {
        var elevator = new google.maps.ElevationService();

        elevator.getElevationForLocations({'locations': [this.location]}, function(results, status) {
            if (status == google.maps.ElevationStatus.OK) {
                if (results[0]) {
                    // Update altitude
                    updateElement.text(Math.round(results[0].elevation) + ' moh.');
                }
            }
        });
	},

	// Drav accuracy radius
	drawAccuracyRadius: function(accuracy, color) {
		// Draw radius
		var radius = new google.maps.Circle({
	        map: 			this.obj,
	        center: 		this.location,
	        radius: 		accuracy,
	        strokeColor:  	$('span#accuracy').css('background-color'),
	        strokeOpacity: 	0.3,
	        strokeWeight: 	1,
	        fillColor: 		$('span#accuracy').css('background-color'),
	        fillOpacity: 	0.2
	    });

	    // Fit bounds
	    this.obj.fitBounds(radius.getBounds());
	},

	// Initialize
	init: function(card) {
		this.obj = new google.maps.Map(card[0], this.options);
	}
};