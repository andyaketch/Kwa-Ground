// main.js: the conductor. It connects the modules to the page
// and holds as little logic of its own as possible.
import { initBasemap } from './basemap.js';
import { boundsToRect } from './geo.js';   // TODO: create geo.js
import { fetchPlaces } from './api.js';    // api.js must export this first

// 1. Find the page elements once, at the top.
//    Your HTML needs elements with these ids: bbox, load-area, status.
const bboxOutput = document.querySelector('#bbox');
const loadButton = document.querySelector('#load-area');
const statusText = document.querySelector('#status');

// 2. Start the map at Nairobi.
const map = initBasemap('map-container', [-1.2864, 36.8172], 13);

// 3. Keep the current area in sync with what the map shows.
let currentRect = '';

function updateRect() {
  const bounds = map.getBounds();
  // TODO: build the "west,south,east,north" string.
  //   Leaflet gives you bounds.getWest(), getSouth(), getEast(), getNorth().
  //   Write boundsToRect in geo.js and call it here.
  currentRect = '';
  bboxOutput.textContent = currentRect;
}

map.on('moveend', updateRect); // fires after every pan or zoom
updateRect();                  // and once at the start

// 4. Load places for the current area when the button is clicked.
loadButton.addEventListener('click', async () => {
  statusText.textContent = 'Loading…';
  try {
    const places = await fetchPlaces(currentRect);
    // TODO: for now just log them. Later, draw them as pins.
    console.log(places);
    statusText.textContent = `${places.length} places loaded`;
  } catch (error) {
    statusText.textContent = `Could not load: ${error.message}`;
  }
});