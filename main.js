// main.js
import { initBasemap } from './basemap.js';

// Call the function when ready
const map = initBasemap('map-container', [0.0, 36.0], 7);

// You can now attach markers, bounds, or layers to this map instance