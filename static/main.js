/*  Initialize
  ================================================================================== */
if (window.jQuery) {
    $(document).ready(function(){
    	LOC.init($('div.card.location'));
        MAP.init($('div.card.map'));
        MON.init($('div.card.monitor'));
    });
}
else {
    document.documentElement.className += ' no-jquery';
}


/* 	Location service
  ================================================================================== */

var LOC = LOC || {
	// Options
	options: {
		enableHighAccuracy: true
	},

	// Success
	locationSuccess: function(card, location) {
		// Location
		card.find('td#latitude')
			.find('span').first().text(Number(location.coords.latitude).toFixed(6))
			.parent().find('span').last().html(LOC.convertLocation(location.coords.latitude, false));
		card.find('td#longitude')
			.find('span').first().text(Number(location.coords.longitude).toFixed(6))
			.parent().find('span').last().html(LOC.convertLocation(location.coords.longitude, true));
		card.find('td#altitude').text(location.coords.altitude);

		// Time
		card.find('td#time').text(moment(location.timestamp).format('DD.MM.YY, HH:mm:ss'));

		// Accuracy
		LOC.determineAccuracy(card.find('td#accuracy, span.label#accuracy_text'), Math.round(location.coords.accuracy));

		// Map
		MAP.updateLocation(location.coords);

		// Address
		MAP.getAddress(card.find('td#address'));

		// Altitude
		MAP.getAltitude(card.find('td#altitude'));

		// Enable sharing
		card.find('a.button')
			.removeClass('warning disabled')
			.addClass('share')
			.html('<i class="fa fa-location-arrow"></i>Del posisjon');

		card.find('a.button.share').click(function() {
			if (!$(this).hasClass('saved')) {
				// Location
				var loc = JSON.stringify({
		            type: 'location',
		            location: {
		                timestamp: location.timestamp,
		                latitude:  location.coords.latitude,
		                longitude: location.coords.longitude,
		                altitude:  location.coords.altitude,
		                accuracy:  location.coords.accuracy 
		            }
		        });

				// Send to server
				if((MON.wsmon) && (MON.wsmon.readyState == 1)) {
					// Socket
					MON.send(loc);

					// Close socket (no need for it anymore)
					console.log('=== CLOSE SOCKET ===');
					console.log(MON.wsmon);
					console.log(MON.wsmon.readyState);
					MON.wsmon.close();
					console.log(MON.wsmon);
					console.log(MON.wsmon.readyState);
					console.log('=== ============ ===');
				}
				else {
					// Post
					console.log('TODO: FALLBACK');

					/*
					$.ajax({
			        	type: 		'POST',
			        	url: 		'/save',
			        	dataType: 	'json',
			        	data: 		JSON.stringify(location),
			        	
			        	success: function(data) {	
							console.log(data);
						}
		    		});*/
				}

				// Disable
				$(this).addClass('disabled saved success').html('<i class="fa fa-check"></i>Posisjon lagret');
			}
		});
	},

	// Error
	locationError: function(card, error) {
		console.log('[ERROR] ' + error.code);

		// No support
		if (error.code == 0) {
			card.find('a.button').addClass('alert').html('<i class="fa fa-ban"></i>Din nettleser støtter ikke lokasjonsoppslag');
		}
		// Permission denied
		if (error.code == 1) {
			console.log('TEST');
			card.find('a.button').addClass('warning').html('<i class="fa fa-ban"></i>Manglende brukertillatelse (<a href="https://waziggle.com/BrowserAllow.aspx" target="_blank">les mer</a>)');
		}
		// Position unavailable
		if (error.code == 2) {
			card.find('a.button').addClass('alert').html('<i class="fa fa-times-circle-o"></i>Posisjon utilgjengelig');
		}
		// Timeout
		if (error.code == 3) {
			card.find('a.button').addClass('alert').html('<i class="fa fa-times-circle-o"></i>Tidsavbrudd');
		}
	},

	// Accuracy
	determineAccuracy: function(updateElement, accuracy) {
		var color = 'secondary';
		var text = 'Ukjent grad av nøyaktighet';
		var smly = 'fa-meh-o';

		if (accuracy >= 3000) {
			color = 'alert';
			text = 'Svært lav nøyaktighet';
			smly = 'fa-frown-o';
		}
		if (accuracy >= 1000 && accuracy < 3000) {
			color = 'alert';
			text = 'Dårlig nøyaktighet';
			smly = 'fa-frown-o';
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
			smly = 'fa-smile-o';
		}
		if (accuracy >= 0 && accuracy < 10) {
			color = 'success';
			text = 'Svært høy nøyaktighet';
			smly = 'fa-smile-o';
		}

		// Accuracy
		updateElement.first()
			.addClass(color)
			.text(text)
			.show();

		updateElement.last()
			.text(accuracy + ' m.')
			.append($('<i>')
				.addClass('fa')
				.addClass(smly)
				.addClass('hide-for-medium-up')
				.css('color', updateElement.first().css('background-color'))
			);
	},

	// Format conversion
	convertLocation: function(D, lng) {
		/* zyklus [http://stackoverflow.com/a/5786281] */
    	var dms = {
        	dir : D<0?lng?'W':'S':lng?'E':'N',
        	deg : 0|(D<0?D=-D:D),
        	min : 0|D%1*60,
        	sec :(0|D*60%1*6000)/100
    	};

    	return dms.dir + dms.deg + '&deg; ' + dms.min + '&#39; ' + dms.sec + '&quot;';
	},

	// Initialize
	init: function(card) {
		// Check support
        if ($('html').hasClass('geolocation')) {
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
		else {
			// No support
			this.locationError(card, {code: 0});
		}
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

		if (this.obj) {
			// Marker
			this.addMarker();

			// Accuracy radius
			this.drawAccuracyRadius(location.accuracy);
		}
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
	        strokeColor:  	$('span#accuracy_text').css('background-color'),
	        strokeOpacity: 	0.3,
	        strokeWeight: 	1,
	        fillColor: 		$('span#accuracy_text').css('background-color'),
	        fillOpacity: 	0.2
	    });

	    // Fit bounds
	    this.obj.fitBounds(radius.getBounds());
	},

	// Initialize
	init: function(card) {
		if (card.length)
			this.obj = new google.maps.Map(card[0], this.options);
	}
};


/* Monitor
  ================================================================================== */

var MON = MON || {
	// Card
	card: null,

	// Socket
	wsmon: null,

	// Monitor
	isMonitor: false,

	// Options
	options: {
		server: 'ws://mingeo.no/websocket'
	},

	// Timer
	keepAlive: null,

	// Send
	send: function(msg) {
		// Pass on
		if (this.wsmon.readyState == 1) {
			// Send
			this.wsmon.send(msg);
			console.log('[MON][Send] Message sent (' + msg + ')');
		}
		else {
			console.log('[MON][Send] Not connected');
		}
	},

	// On message
	onMessage: function(instance, evt) {
		// Parse as JSON
		data = $.parseJSON(evt.data);

		console.log('[MON][Received] ' + JSON.stringify(data));

		// Type
		switch(data.type) {
			// Conncted
			case 'connect':
      			$('span#client').find('span').text(data.id);
      		break;
      		// Client count
      		case 'clients':
				$('span#clients').find('span').text(data.count);
			break;
			// Location
			case 'location':
				$('table > tbody').prepend($('<tr>')
					.append($('<td>').text(data.location.timestamp))
					.append($('<td>').text(data.client))
					.append($('<td>').text(data.location.latitude + ', ' + data.location.longitude))
				);
			break;
			// Error
			case 'error':
				console.log('[ERROR] ' + data.message);
			break;
  		}
	},

	// On connect
	onConnect: function(instance, evt) {
		// ID
		$('span#client').show().find('span').text('?');

		// Keep-alive
		instance.keepAlive = setInterval(function(){
			// Ping
			instance.send('ping');
		}, 30000);

		// Info
  		if (instance.isMonitor) {
			// Status
			$('span#status')
	  			.html('<i class="fa fa-play"></i>Tilkoblet')
	  			.removeClass('warning alert')
	  			.addClass('success');

  			// Playback
	  		$('span#playback')
	  			.removeClass('success')
	  			.addClass('alert')
	  			.html($('<i>', {class: 'fa fa-stop', title: 'Stopp'}))
	  			.click(function(){
					// Disconnect
					instance.wsmon.close();
				})
				.show();

			// Clients
			$('span#clients').show().find('span').text('?');
		}
	},

	// On disconnect
	onDisconnect: function(instance, evt) {
		console.log('[Mon] Disconnected');

		// Clear keep alive timer
		clearTimeout(instance.keepAlive);

		// Status
		$('span#status')
  			.html('<i class="fa fa-stop"></i>Frakoblet')
  			.removeClass('warning success')
  			.addClass('alert');

  		// Playback
  		$('span#playback')
  			.removeClass('alert')
  			.addClass('success')
  			.html($('<i>', {class: 'fa fa-play', title: 'Fortsett'}))
  			.click(function(){
				// Connect
				console.log('connect');
			})
			.show();

  		// Info
		$('span#client').hide();
		$('span#clients').hide();
	},

	// Initialize
	init: function(card) {
		// Instance
		var instance = this;

		// Card
		instance.card = card;

		// Client type
		if (instance.card.length)
			instance.isMonitor = true;

		// Check support
        if ($('html').hasClass('websockets')) {
			// Connect
			this.wsmon = new WebSocket(instance.options.server);

	       	// Callbacks
	       	var onConnect = instance.onConnect;
	       	var onDisconnect = instance.onDisconnect;
	       	var onMessage = instance.onMessage;

	        this.wsmon.onopen = function(evt) {
	        	onConnect(instance, evt);
	        }
			this.wsmon.onclose = function(evt) {
				onDisconnect(instance, evt);
			}
			this.wsmon.onmessage = function(evt) {
				onMessage(instance, evt);
			}
		}
		else {
			// No support
			console.log('NO WebSocket support');
			// TODO: Fallback
		}
	}
}