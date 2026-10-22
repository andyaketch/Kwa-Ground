// Iinitialize the map inside the 'map' div: [latitude, longitude], zoomLevel
    const map = L.map('map').setView([0.0, 36.0], 7);

    // Add the OpenStreetMap basemap tile layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Optional: Add a bounding rectangle overlay on top of the basemap
    const bounds = [[-0.5, 34.5], [0.5, 35.5]];
    L.rectangle(bounds, { color: '#ff7800', weight: 2 }).addTo(map);