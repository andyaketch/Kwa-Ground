// 1. Initialize map inside <div id="map-container"></div>
// Coordinates format: [latitude, longitude], initial zoom level
const map = L.map('map-container').setView([0.0, 36.0], 7);

// 2. Fetch and attach OpenStreetMap tiles
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);