export function initBasemap(containerId = 'map-container', center = [0.0, 36.0], zoom = 7) {
  // Initialize the Leaflet map
  const map = L.map(containerId).setView(center, zoom);

  // Attach OpenStreetMap tiles
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  return map;
}