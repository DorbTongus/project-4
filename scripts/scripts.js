//API keys:
	//Ticketmaster: VSM1dd30tigblmZiOqtMF1E6HpUviitY
	//Zomato: 4a4256c7395ea0134e9a69678d0f4430
	//map: AIzaSyBmV0nu5MNELvqr2JloO0Xi54cnKeZ8QvE

//Create the object foodApp
var foodApp = {};

// create strings for ticket keys within foodApp object to be passed into data models
foodApp.ticketKey = "VSM1dd30tigblmZiOqtMF1E6HpUviitY";
foodApp.foodKey = "4a4256c7395ea0134e9a69678d0f4430";

//create the object myLatLng
var myLatLng = {};

//create the array markersData
var markersData = [];


//defines the data that will be pulled from the ticketmaster API
foodApp.getTicketInfo = function(keyword) {
	$.ajax({
		url: "https://app.ticketmaster.com/discovery/v2/events.json",
		method:"GET",
		dataType: "json",
		data:{
			keyword: keyword,
			classificationName: "music",
			apikey: foodApp.ticketKey
		}
	//promise to create varaibles from data model to be appended to HTML	
	}).then(function(res){
		var name = res._embedded.events[0].name;
		var venue = res._embedded.events[0]._embedded.venues[0].name;
		var city = res._embedded.events[0]._embedded.venues[0].city.name;
		var date = res._embedded.events[0].dates.start.localDate;
		var time = res._embedded.events[0].dates.start.localTime;

		var latitude = res._embedded.events[0]._embedded.venues[0].location.latitude;

		var	longitude = res._embedded.events[0]._embedded.venues[0].location.longitude;


		//calls the function getFoodInfo within foodApp object and passes in longitude and latitude values to the foodApp.getFoodInfo function parameters
		foodApp.getFoodInfo(latitude,longitude);
		// initMap(latitude,longitude);

		// calls the function displayEvent within the foodApp object and passes in data variables to the foodApp.displayEvent function parameters
		foodApp.displayEvent(name,venue,city,date,time);

		// create variable for map marker lat, parsefloat to change to integer with decimals intact
		var maplatitude = parseFloat(latitude);
		//create variable for map marker long parsefloat to change to integer with decimals intact
		var maplongitude = parseFloat(longitude);
		// pass variables maplatitude and maplongitude as properties into myLatLng object
		myLatLng.lat = maplatitude;
		myLatLng.lng = maplongitude;
		
		// call the function initMap and pass in myLatLng object as parameter (initmap function below)
		initMap(myLatLng);

	});
}

// appends event details to the relevent classes in the HTML
foodApp.displayEvent = function(name,venue,city,date,time){
	$(".eventName").text(name);
	$(".venue").text("Venue: " + venue);
	$(".city").text("City: " + city);
	$(".date").text("Date: " + date);
	$(".time").text("Time: " + time);
}

// prevents data from loading until submit is clicked with a value from the user in the text field - also prevents page from refreshing on submission
foodApp.userInput = function(){
	$('form').on('submit', function(event) {
		event.preventDefault();
		var userInput = $("input[name=search]").val();
		if($('#input').val()) {

			// passes the user's input into the foodApp.getTicketInfo function parameter which is then passed into the keyword in the data model
			foodApp.getTicketInfo(userInput);
		};
	});
}
// lat and lon are parameter names for latitude and longitude which are being passed in from the above function
foodApp.getFoodInfo = function(lat,lon) {
	$.ajax({
		url: "https://developers.zomato.com/api/v2.1/search",
		method:"GET",
		dataType: "json",
		data:{
			apikey: foodApp.foodKey,
			format:"json",
			lat: lat, //dynamic based on lat of venue
			lon: lon, //dynamic based on lon of venue
			radius: "5000",
			sort: "real_distance",
			q: "restaurant",
			count:10
		}
	}).then(function(res){

		//empties the restaurant list to prevent restaurants from stacking when a new search is performed
		$(".restList").empty();
		$(".overlay").fadeOut("slow");
		$(".concertInfo").fadeIn("slow");
		$(".restList").fadeIn("slow");
		// finds restaurants object in zomato API
		var possibleRest = res.restaurants;

		console.log(res.restaurants);


		// passes variable possibleRest into foodApp.displayRest function parameter
		foodApp.displayRest(possibleRest);
	});
}

// creates new HTML elements based on data pulled from the restaurants object and appends them to the relevant divs on the HTML for each restaurant (10 based on data model of zomato API)
foodApp.displayRest = function(resList) {
	resList.forEach(function(indivRes){
		// console.log(indivRes.restaurant.name);
		var restContainer = $("<div>").addClass("restBox");
		var restExtra = $("<div>").addClass("extraInfo");
		var restName = $("<h3>").text(indivRes.restaurant.name);
		var restAddress = $("<p>").text(indivRes.restaurant.location.address);
		var restRating = $("<p>").text("User Rating: " + indivRes.restaurant.user_rating.aggregate_rating);
		var restMenu = indivRes.restaurant.menu_url;
		// console.log(restMenu);
		var restMenuLink = $(`<a href="${restMenu}">Menu</a>`);
		$(restContainer).append(restName, restAddress);
		$(".restList").append(restContainer);
		$(restExtra).append(restRating, restMenuLink);
		$(restContainer).append(restExtra);
		
		// creates lon and lat varialbes for each of the 10 closest restaurants from the restaurant object
		var zomatoLat = indivRes.restaurant.location.latitude;
			zomatoLat = parseFloat(zomatoLat);
		var zomatoLon = indivRes.restaurant.location.longitude;
			zomatoLon = parseFloat(zomatoLon);
		
		// creates object varialbe for each zomato lat and lon
		var restaurantLocation = {
			lat: zomatoLat,
			lng: zomatoLon
		}

		// pushes object lon and lat data into markersData array
		markersData.push(restaurantLocation);

		// calls function displayMarkers and passes markersData array as parameter (locations)
		displayMarkers(markersData);

	});
}

// creates an empty object map
var map = {};
	
	// map function for google maps API
 	initMap = function(myLatLng) {

        map = new google.maps.Map(document.getElementById('map'), {
          zoom: 14,
          center: myLatLng
        });
        // pulls custom icons for map markers
        var icon = "assets/music-marker.png"
        var marker = new google.maps.Marker({
          // pulls data from myLatLng object (venue coordinates) and passes it into positional data for google maps
          position: myLatLng,
          icon: icon,
          map: map,

          title: 'Hello World!'
        });
    }

   displayMarkers = function(locations) {
   	// for loop for zomato locations lat and lon, iterates 10 times
    for (var i = 0; i < locations.length; i++){
    	   var latlng = new google.maps.LatLng(markersData[i].lat, markersData[i].lng);
	       createMarker(latlng);
     	}
    };

    createMarker = function(latlng) {
    	// pulls custom icons for map markers
	   var icon = "assets/restaurant-marker.png";
       var marker = new google.maps.Marker({
          map: map,
          icon: icon,
          position: latlng
    	});
     }


//final initialization for above functions
foodApp.init = function(){
	// foodApp.getTicketInfo();
	// foodApp.getFoodInfo();
	foodApp.userInput();
}

// document ready for initialization
$(function(){
	foodApp.init();
});

	