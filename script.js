/* ==========================================
   Finder v3
========================================== */

"use strict";

/* ---------- GLOBAL VARIABLES ---------- */

let currentLat = null;
let currentLng = null;

let map = null;
let userMarker = null;
let placeMarkers = [];

let deferredPrompt = null;

/* ---------- ELEMENTS ---------- */

const locationName = document.getElementById("locationName");
const weatherText = document.getElementById("weatherText");
const temperature = document.getElementById("temperature");
const weatherIcon = document.getElementById("weatherIcon");
const searchInput = document.getElementById("searchInput");
const results = document.getElementById("results");

/* ---------- APP START ---------- */

window.addEventListener("load", () => {

    initTheme();

    getCurrentLocation();

});

/* ---------- LOCATION ---------- */

function getCurrentLocation(){

    if(!navigator.geolocation){

        alert("Geolocation not supported");

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

async function successLocation(position){

    currentLat = position.coords.latitude;

    currentLng = position.coords.longitude;

    await loadAddress();

    await loadWeather();

    initMap();

}

function errorLocation(){

    locationName.textContent =

    "Location unavailable";

}

/* ---------- ADDRESS ---------- */

async function loadAddress(){

    try{

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
        data.address.state || "";

        locationName.textContent =

        city + ", " + state;

    }

    catch{

        locationName.textContent =

        "Current Location";

    }

}

/* ---------- WEATHER ---------- */

async function loadWeather(){

    try{

        const response = await fetch(

`https://api.open-meteo.com/v1/forecast?latitude=${currentLat}&longitude=${currentLng}&current=temperature_2m,weather_code`

        );

        const data = await response.json();

        temperature.textContent =

        data.current.temperature_2m + "°C";

        const weather = getWeatherInfo(

            data.current.weather_code

        );

        weatherText.textContent = weather.text;

        weatherIcon.src = weather.icon;

    }

    catch{

        weatherText.textContent =

        "Weather unavailable";

    }

}

/* ---------- WEATHER ICON ---------- */

function getWeatherInfo(code){

    if(code===0){

        return{

            text:"Clear Sky",

            icon:"https://openweathermap.org/img/wn/01d@2x.png"

        };

    }

    if([1,2,3].includes(code)){

        return{

            text:"Cloudy",

            icon:"https://openweathermap.org/img/wn/03d@2x.png"

        };

    }

    if([45,48].includes(code)){

        return{

            text:"Fog",

            icon:"https://openweathermap.org/img/wn/50d@2x.png"

        };

    }

    if([51,53,55,61,63,65,80,81,82].includes(code)){

        return{

            text:"Rain",

            icon:"https://openweathermap.org/img/wn/10d@2x.png"

        };

    }

    return{

        text:"Weather",

        icon:"https://openweathermap.org/img/wn/01d@2x.png"

    };

}

/* ==========================================
   MAP INITIALIZATION
========================================== */

function initMap() {

    if (map !== null) {
        map.remove();
    }

    map = L.map("map").setView([currentLat, currentLng], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {

        attribution: "&copy; OpenStreetMap Contributors",
        maxZoom: 19

    }).addTo(map);

    userMarker = L.marker([currentLat, currentLng])

        .addTo(map)

        .bindPopup("📍 You are here")

        .openPopup();

}

/* ==========================================
   REFRESH LOCATION
========================================== */

function refreshLocation() {

    getCurrentLocation();

}

/* ==========================================
   DISTANCE (HAVERSINE)
========================================== */

function calculateDistance(lat1, lon1, lat2, lon2) {

    const R = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;

    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =

        Math.sin(dLat / 2) ** 2 +

        Math.cos(lat1 * Math.PI / 180) *

        Math.cos(lat2 * Math.PI / 180) *

        Math.sin(dLon / 2) ** 2;

    const c =

        2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return (R * c).toFixed(1);

}

/* ==========================================
   GOOGLE DIRECTIONS
========================================== */

function navigate(lat, lng) {

    if (currentLat === null) return;

    window.open(

`https://www.google.com/maps/dir/${currentLat},${currentLng}/${lat},${lng}`,

"_blank"

    );

}

/* ==========================================
   SEARCH
========================================== */

searchInput.addEventListener("keydown", function(e){

    if(e.key !== "Enter") return;

    const keyword = this.value.trim();

    if(keyword === "") return;

    findPlace(keyword);

});

/* ==========================================
   CLEAR MARKERS
========================================== */

function clearMarkers(){

    placeMarkers.forEach(marker=>{

        map.removeLayer(marker);

    });

    placeMarkers=[];

}

/* ==========================================
   LOADING MESSAGE
========================================== */

function showLoading(){

    results.innerHTML =

    "<p class='text-center'>Loading nearby places...</p>";

}

function clearResults(){

    results.innerHTML="";

}

/* ==========================================
   OVERPASS API - NEARBY SEARCH
========================================== */

async function findPlace(type) {

    if (!currentLat || !currentLng) return;

    showLoading();

    clearMarkers();

    let tag = "";

    switch (type) {

        case "hotel":
            tag = 'tourism="hotel"';
            break;

        case "fuel":
            tag = 'amenity="fuel"';
            break;

        case "atm":
            tag = 'amenity="atm"';
            break;

        case "hospital":
            tag = 'amenity="hospital"';
            break;

        case "pharmacy":
            tag = 'amenity="pharmacy"';
            break;

        case "bus_station":
            tag = 'highway="bus_stop"';
            break;

        case "government office":
            tag = 'office="government"';
            break;

        default:
            tag = `name~"${type}",i`;

    }

    const query = `
[out:json][timeout:25];
(
node[${tag}](around:5000,${currentLat},${currentLng});
way[${tag}](around:5000,${currentLat},${currentLng});
relation[${tag}](around:5000,${currentLat},${currentLng});
);
out center;
`;

    try {

        const response = await fetch(
            "https://overpass-api.de/api/interpreter",
            {
                method: "POST",
                body: query
            }
        );

        const data = await response.json();

        displayPlaces(data.elements);

    } catch (error) {

        console.error(error);

        results.innerHTML =
        "<p class='text-center'>Unable to load places.</p>";

    }

}

/* ==========================================
   DISPLAY PLACES
========================================== */

function displayPlaces(places){

    clearResults();

    if(places.length===0){

        results.innerHTML =
        "<p class='text-center'>No places found.</p>";

        return;

    }

    places.forEach(place=>{

        const lat = place.lat || place.center.lat;
        const lng = place.lon || place.center.lon;

        const name =
        place.tags.name || "Unknown";

        const distance =
        calculateDistance(
            currentLat,
            currentLng,
            lat,
            lng
        );

        const marker = L.marker([lat,lng])

        .addTo(map)

        .bindPopup(
            `<b>${name}</b><br>${distance} km`
        );

        placeMarkers.push(marker);

        const card = document.createElement("div");

        card.className="place-card";

        card.innerHTML=`

        <h3>${name}</h3>

        <p>📏 ${distance} km away</p>

        <div class="actions">

        <button onclick="navigate(${lat},${lng})">

        🧭 Directions

        </button>

        <button onclick="saveFavorite('${name}')">

        ❤️ Favorite

        </button>

        </div>

        `;

        results.appendChild(card);

    });

}

/* ==========================================
   FAVORITES
========================================== */

function saveFavorite(name) {

    let favorites = JSON.parse(
        localStorage.getItem("finderFavorites") || "[]"
    );

    if (!favorites.includes(name)) {

        favorites.push(name);

        localStorage.setItem(
            "finderFavorites",
            JSON.stringify(favorites)
        );

        alert(name + " added to favorites.");

    } else {

        alert("Already in favorites.");

    }

}

function showFavorites() {

    const favorites = JSON.parse(
        localStorage.getItem("finderFavorites") || "[]"
    );

    clearResults();

    if (favorites.length === 0) {

        results.innerHTML =
        "<p class='text-center'>No favorites saved.</p>";

        return;

    }

    favorites.forEach(name => {

        const card = document.createElement("div");

        card.className = "place-card";

        card.innerHTML = `
            <h3>${name}</h3>
            <p>Saved Favorite</p>

            <div class="actions">

                <button onclick="findPlace('${name}')">
                    🔍 Search
                </button>

                <button onclick="removeFavorite('${name}')">
                    🗑 Remove
                </button>

            </div>
        `;

        results.appendChild(card);

    });

}

function removeFavorite(name) {

    let favorites = JSON.parse(
        localStorage.getItem("finderFavorites") || "[]"
    );

    favorites = favorites.filter(item => item !== name);

    localStorage.setItem(
        "finderFavorites",
        JSON.stringify(favorites)
    );

    showFavorites();

}

/* ==========================================
   RECENT SEARCHES
========================================== */

function saveRecent(keyword) {

    let recent = JSON.parse(
        localStorage.getItem("finderRecent") || "[]"
    );

    recent = recent.filter(item => item !== keyword);

    recent.unshift(keyword);

    recent = recent.slice(0, 10);

    localStorage.setItem(
        "finderRecent",
        JSON.stringify(recent)
    );

}

/* ==========================================
   DARK MODE
========================================== */

function initTheme() {

    const theme =
        localStorage.getItem("finderTheme");

    if (theme === "dark") {

        document.body.classList.add("dark");

    }

}

function toggleDarkMode() {

    document.body.classList.toggle("dark");

    const theme = document.body.classList.contains("dark")
        ? "dark"
        : "light";

    localStorage.setItem(
        "finderTheme",
        theme
    );

}

/* ==========================================
   SHARE APP
========================================== */

async function shareApp() {

    const shareData = {

        title: "Finder",

        text: "Find nearby places easily.",

        url: location.href

    };

    if (navigator.share) {

        try {

            await navigator.share(shareData);

        } catch (e) {

            console.log(e);

        }

    } else {

        alert("Share not supported.");

    }

}

/* ==========================================
   INSTALL PWA
========================================== */

window.addEventListener(
    "beforeinstallprompt",
    event => {

        event.preventDefault();

        deferredPrompt = event;

    }
);

async function installApp() {

    if (!deferredPrompt) {

        alert("Install option unavailable.");

        return;

    }

    deferredPrompt.prompt();

    await deferredPrompt.userChoice;

    deferredPrompt = null;

}

/* ==========================================
   NETWORK STATUS
========================================== */

window.addEventListener("offline", () => {

    alert("📴 You are offline.");

});

window.addEventListener("online", () => {

    alert("🌐 Internet connected.");

});

/* ==========================================
   SERVICE WORKER
========================================== */

if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker
            .register("service-worker.js")
            .then(() => {

                console.log("Service Worker Registered");

            })
            .catch(error => {

                console.log(error);

            });

    });

}

/* ==========================================
   END OF SCRIPT
========================================== */

console.log("Finder v3 Loaded Successfully");

