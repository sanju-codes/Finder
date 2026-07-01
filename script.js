/* =====================================
   FINDER PWA
   SCRIPT.JS - PART 1
===================================== */

let latitude = null;
let longitude = null;

/* ===========================
   GET CURRENT LOCATION
=========================== */

window.onload = () => {

    getCurrentLocation();

};

/* ===========================
   LOCATION
=========================== */

function getCurrentLocation(){

    if(!navigator.geolocation){

        alert("Geolocation not supported.");

        return;

    }

    navigator.geolocation.getCurrentPosition(

        successLocation,

        errorLocation,

        {

            enableHighAccuracy:true,

            timeout:10000,

            maximumAge:0

        }

    );

}

/* ===========================
   LOCATION SUCCESS
=========================== */

function successLocation(position){

    latitude = position.coords.latitude;

    longitude = position.coords.longitude;

    document.getElementById("location").innerHTML =
    latitude.toFixed(5)+" , "+longitude.toFixed(5);

    loadWeather();

}

/* ===========================
   LOCATION ERROR
=========================== */

function errorLocation(){

    document.getElementById("location").innerHTML =
    "Location Permission Denied";

}

/* ===========================
   WEATHER
=========================== */

function loadWeather(){

const api =
`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;

fetch(api)

.then(res=>res.json())

.then(data=>{

document.getElementById("temp").innerHTML =
data.current_weather.temperature+"°C";

document.getElementById("weatherText").innerHTML =
"Live Weather";

})

.catch(()=>{

document.getElementById("weatherText").innerHTML =
"Unavailable";

});

}

/* ===========================
   OPEN GOOGLE MAPS
=========================== */

function findPlace(place){

if(latitude==null){

alert("Location not loaded.");

return;

}

window.open(

`https://www.google.com/maps/search/${place}/@${latitude},${longitude},16z`,

"_blank"

);

}

/* ===========================
   REFRESH LOCATION
=========================== */

function refreshLocation(){

getCurrentLocation();

}

/* =====================================
   SCRIPT.JS - PART 2
===================================== */

/* ===========================
   GET LOCATION NAME
=========================== */

async function getAddress(lat, lon) {

    try {

        const url =
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;

        const response = await fetch(url);

        const data = await response.json();

        const city =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.county ||
            "";

        const state =
            data.address.state || "";

        document.getElementById("location").innerHTML =
            city + ", " + state;

    }

    catch {

        document.getElementById("location").innerHTML =
            "Current Location";

    }

}

/* Call after GPS */

function successLocation(position){

    latitude = position.coords.latitude;

    longitude = position.coords.longitude;

    getAddress(latitude, longitude);

    loadWeather();

}


/* ===========================
   SEARCH
=========================== */

const searchBox =
document.querySelector(".search-box input");

searchBox.addEventListener("keypress", function(e){

    if(e.key==="Enter"){

        let value = this.value.trim();

        if(value!=""){

            findPlace(value);

        }

    }

});


/* ===========================
   SHARE APP
=========================== */

function shareApp(){

if(navigator.share){

navigator.share({

title:"Finder",

text:"Find Nearby Places",

url:window.location.href

});

}

}


/* ===========================
   DARK MODE
=========================== */

function toggleDarkMode(){

document.body.classList.toggle("dark");

localStorage.setItem(

"theme",

document.body.classList.contains("dark")

);

}

window.addEventListener("load",()=>{

if(localStorage.getItem("theme")=="true"){

document.body.classList.add("dark");

}

});


/* ===========================
   FAVORITES
=========================== */

function addFavorite(place){

let favs = JSON.parse(

localStorage.getItem("favorites")

)||[];

if(!favs.includes(place)){

favs.push(place);

localStorage.setItem(

"favorites",

JSON.stringify(favs)

);

alert(place+" Added");

}

}


/* ===========================
   LOADING ANIMATION
=========================== */

window.addEventListener("load",()=>{

document.body.classList.add("loaded");

});


/* ===========================
   INSTALL PWA
=========================== */

let deferredPrompt;

window.addEventListener(

"beforeinstallprompt",

(e)=>{

e.preventDefault();

deferredPrompt=e;

console.log("Install Ready");

});

function installApp(){

if(deferredPrompt){

deferredPrompt.prompt();

}

}

