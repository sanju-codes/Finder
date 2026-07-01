/* ==========================================
   Finder v2 - script.js
========================================== */

"use strict";

let currentLat = null;
let currentLng = null;
let deferredPrompt = null;

const locationName = document.getElementById("locationName");
const weatherText = document.getElementById("weatherText");
const temperature = document.getElementById("temperature");
const weatherIcon = document.getElementById("weatherIcon");
const searchInput = document.getElementById("searchInput");

/* -------------------------------
   APP START
--------------------------------*/

window.addEventListener("load", () => {

    initTheme();

    getCurrentLocation();

});

/* -------------------------------
   LOCATION
--------------------------------*/

function getCurrentLocation() {

    if (!navigator.geolocation) {

        locationName.textContent =
        "Geolocation not supported";

        return;
    }

    navigator.geolocation.getCurrentPosition(

        onLocationSuccess,

        onLocationError,

        {

            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 0

        }

    );

}

async function onLocationSuccess(position) {

    currentLat = position.coords.latitude;

    currentLng = position.coords.longitude;

    await loadAddress();

    await loadWeather();

}

function onLocationError() {

    locationName.textContent =
    "Location unavailable";

    weatherText.textContent =
    "Enable GPS";

}

/* -------------------------------
   ADDRESS
--------------------------------*/

async function loadAddress() {

    try {

        const response = await fetch(

`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${currentLat}&lon=${currentLng}`

        );

        const data = await response.json();

        const city =

        data.address.city ||

        data.address.town ||

        data.address.village ||

        "";

        const state =

        data.address.state ||

        "";

        locationName.textContent =
        `${city}, ${state}`;

    }

    catch {

        locationName.textContent =
        "Current Location";

    }

}

/* -------------------------------
   WEATHER
--------------------------------*/

async function loadWeather() {

    try {

        const response = await fetch(

`https://api.open-meteo.com/v1/forecast?latitude=${currentLat}&longitude=${currentLng}&current=temperature_2m,weather_code`

        );

        const data = await response.json();

        temperature.textContent =
        data.current.temperature_2m + "°C";

        weatherText.textContent =
        "Live Weather";

        weatherIcon.src =
        "https://openweathermap.org/img/wn/01d@2x.png";

    }

    catch {

        weatherText.textContent =
        "Weather unavailable";

    }

}

/* -------------------------------
   GOOGLE MAPS
--------------------------------*/

function findPlace(place){

    if(currentLat===null){

        alert("Location not ready");

        return;

    }

    const url =

`https://www.google.com/maps/search/${encodeURIComponent(place)}/@${currentLat},${currentLng},15z`;

    window.open(url,"_blank");

}

/* -------------------------------
   REFRESH LOCATION
--------------------------------*/

function refreshLocation(){

    getCurrentLocation();

}

/* ==========================================
   SEARCH
========================================== */

if (searchInput) {
    searchInput.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {

            const value = this.value.trim();

            if (value.length > 0) {

                findPlace(value);

            }

        }

    });
}

/* ==========================================
   SHARE APP
========================================== */

async function shareApp() {

    if (navigator.share) {

        try {

            await navigator.share({

                title: "Finder",

                text: "Find nearby places with Finder",

                url: window.location.href

            });

        } catch (err) {

            console.log(err);

        }

    } else {

        alert("Sharing is not supported on this device.");

    }

}

/* ==========================================
   DARK MODE
========================================== */

function initTheme() {

    const saved = localStorage.getItem("theme");

    if (saved === "dark") {

        document.body.classList.add("dark");

    }

}

function toggleDarkMode() {

    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {

        localStorage.setItem("theme", "dark");

    } else {

        localStorage.setItem("theme", "light");

    }

}

/* ==========================================
   INSTALL PWA
========================================== */

window.addEventListener("beforeinstallprompt", (event) => {

    event.preventDefault();

    deferredPrompt = event;

});

async function installApp() {

    if (!deferredPrompt) {

        alert("Install option is not available yet.");

        return;

    }

    deferredPrompt.prompt();

    await deferredPrompt.userChoice;

    deferredPrompt = null;

}

/* ==========================================
   SERVICE WORKER
========================================== */

if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker.register("./service-worker.js")

            .then(() => {

                console.log("Service Worker Registered");

            })

            .catch((error) => {

                console.error(error);

            });

    });

}

/* ==========================================
   FAVORITES
========================================== */

function saveFavorite(place) {

    let favorites = JSON.parse(

        localStorage.getItem("favorites") || "[]"

    );

    if (!favorites.includes(place)) {

        favorites.push(place);

        localStorage.setItem(

            "favorites",

            JSON.stringify(favorites)

        );

    }

}

function getFavorites() {

    return JSON.parse(

        localStorage.getItem("favorites") || "[]"

    );

}

/* ==========================================
   WEATHER ICONS
========================================== */

function getWeather(code){

    if(code===0){

        return {
            text:"Clear Sky",
            icon:"https://openweathermap.org/img/wn/01d@2x.png"
        };

    }

    if([1,2,3].includes(code)){

        return {
            text:"Cloudy",
            icon:"https://openweathermap.org/img/wn/03d@2x.png"
        };

    }

    if([45,48].includes(code)){

        return {
            text:"Fog",
            icon:"https://openweathermap.org/img/wn/50d@2x.png"
        };

    }

    if([51,53,55,61,63,65,80,81,82].includes(code)){

        return {
            text:"Rain",
            icon:"https://openweathermap.org/img/wn/10d@2x.png"
        };

    }

    if([71,73,75,77,85,86].includes(code)){

        return {
            text:"Snow",
            icon:"https://openweathermap.org/img/wn/13d@2x.png"
        };

    }

    if([95,96,99].includes(code)){

        return {
            text:"Thunderstorm",
            icon:"https://openweathermap.org/img/wn/11d@2x.png"
        };

    }

    return {

        text:"Weather",

        icon:"https://openweathermap.org/img/wn/01d@2x.png"

    };

}

/* ==========================================
   UPDATE WEATHER FUNCTION
========================================== */

async function loadWeather(){

    try{

        const response = await fetch(

`https://api.open-meteo.com/v1/forecast?latitude=${currentLat}&longitude=${currentLng}&current=temperature_2m,weather_code`

        );

        const data = await response.json();

        const weather = getWeather(data.current.weather_code);

        temperature.textContent =
        data.current.temperature_2m + "°C";

        weatherText.textContent =
        weather.text;

        weatherIcon.src =
        weather.icon;

    }

    catch{

        weatherText.textContent =
        "Weather unavailable";

    }

}

/* ==========================================
   LOADING
========================================== */

document.addEventListener("DOMContentLoaded",()=>{

document.body.classList.remove("loading");

});

/* ==========================================
   NETWORK STATUS
========================================== */

window.addEventListener("offline",()=>{

alert("You are Offline");

});

window.addEventListener("online",()=>{

alert("Internet Connected");

});
