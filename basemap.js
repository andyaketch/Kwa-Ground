export function initBasemap(containerId = 'map-container', center = [-1.2864, 36.8172], zoom = 13) {
  // Initialize the Leaflet map
  const map = L.map(containerId).setView(center, zoom);

  // Attach OpenStreetMap tiles
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  return map;
}
