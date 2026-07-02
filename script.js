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

/* ==========================================
   LEAFLET MAP + OVERPASS API
========================================== */

let map = null;
let markers = [];

function initMap() {

    if (!currentLat || !currentLng) return;

    if (map) {

        map.remove();

    }

    map = L.map("map").setView([currentLat, currentLng], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap"
    }).addTo(map);

    L.marker([currentLat, currentLng])
        .addTo(map)
        .bindPopup("You are here")
        .openPopup();

}

async function loadNearby(type) {

    if (!currentLat || !currentLng) return;

    clearMarkers();

    const query = `
[out:json];
(
 node["amenity"="${type}"](around:5000,${currentLat},${currentLng});
 way["amenity"="${type}"](around:5000,${currentLat},${currentLng});
 relation["amenity"="${type}"](around:5000,${currentLat},${currentLng});
);
out center;
`;

    const response = await fetch(
        "https://overpass-api.de/api/interpreter",
        {
            method: "POST",
            body: query
        }
    );

    const data = await response.json();

    data.elements.forEach(place => {

        const lat = place.lat || place.center.lat;
        const lng = place.lon || place.center.lon;

        const distance =
            calculateDistance(
                currentLat,
                currentLng,
                lat,
                lng
            );

        const name =
            place.tags.name || "Unknown";

        const marker = L.marker([lat, lng])
            .addTo(map);

        marker.bindPopup(`
            <b>${name}</b><br>
            Distance : ${distance} km<br><br>

            <button onclick="navigate(${lat},${lng})">
            Directions
            </button>
        `);

        markers.push(marker);

    });

}

function clearMarkers(){

    markers.forEach(marker=>{

        map.removeLayer(marker);

    });

    markers=[];

}

/* ==========================================
   NAVIGATION
========================================== */

function navigate(lat,lng){

    window.open(

`https://www.google.com/maps/dir/${currentLat},${currentLng}/${lat},${lng}`,

"_blank"

    );

}

/* ==========================================
   CATEGORY FUNCTIONS
========================================== */

function findPlace(type){

    initMap();

    switch(type){

        case "hotel":
            loadNearby("restaurant");
            break;

        case "hospital":
            loadNearby("hospital");
            break;

        case "ATM":
            loadNearby("atm");
            break;

        case "fuel station":
            loadNearby("fuel");
            break;

        case "medical shop":
            loadNearby("pharmacy");
            break;

        case "bus stop":
            loadNearby("bus_station");
            break;

        default:

            window.open(

`https://www.google.com/maps/search/${type}/@${currentLat},${currentLng},15z`

);

    }

}

/* ==========================================
   SEARCH RESULTS
========================================== */

const resultsContainer = document.getElementById("results");

function showResults(list) {

    if (!resultsContainer) return;

    resultsContainer.innerHTML = "";

    if (list.length === 0) {

        resultsContainer.innerHTML =
        "<p class='empty'>No places found.</p>";

        return;

    }

    list.forEach(place => {

        const lat = place.lat || place.center.lat;
        const lng = place.lon || place.center.lon;

        const name = place.tags.name || "Unknown Place";

        const distance = calculateDistance(
            currentLat,
            currentLng,
            lat,
            lng
        );

        const address =
            place.tags["addr:street"] || "";

        const div = document.createElement("div");

        div.className = "place-card";

        div.innerHTML = `
        <h3>${name}</h3>

        <p>${address}</p>

        <p>📏 ${distance} km Away</p>

        <div class="actions">

            <button onclick="navigate(${lat},${lng})">
            🧭 Directions
            </button>

            <button onclick="saveFavorite('${name}')">
            ❤️ Favorite
            </button>

            <button onclick="sharePlace('${name}',${lat},${lng})">
            📤 Share
            </button>

        </div>
        `;

        resultsContainer.appendChild(div);

    });

}

/* ==========================================
   SHARE PLACE
========================================== */

function sharePlace(name, lat, lng) {

    const url =
`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    if (navigator.share) {

        navigator.share({

            title: name,

            text: name,

            url: url

        });

    } else {

        window.open(url);

    }

}

/* ==========================================
   RECENT SEARCHES
========================================== */

function saveRecent(place) {

    let recent = JSON.parse(
        localStorage.getItem("recent") || "[]"
    );

    recent = recent.filter(item => item !== place);

    recent.unshift(place);

    recent = recent.slice(0, 10);

    localStorage.setItem(
        "recent",
        JSON.stringify(recent)
    );

}

/* ==========================================
   FAVORITES LIST
========================================== */

function showFavorites() {

    const fav = getFavorites();

    console.log(fav);

}

/* ==========================================
   NETWORK STATUS
========================================== */

window.addEventListener("offline", () => {

    alert("📴 Offline Mode");

});

window.addEventListener("online", () => {

    alert("🌐 Internet Connected");

});

/* ==========================================
   APP READY
========================================== */

window.addEventListener("load", () => {

    console.log("Finder Ready");

});
