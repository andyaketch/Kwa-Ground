
import { initBasemap } from './basemap.js';
import { boundsToRect, isAreaTooLarge, round6 } from './geo.js';
import { fetchPlaces, placeToRecord } from './api.js';
import { createStore } from './store.js';
import { validateRecord, STATUSES, STATUS_LABELS } from './validate.js';
import { GEOAPIFY_KEY, JSON_SERVER_URL } from './config.js';
import { setStatus, showErrors, showExisting, fillForm, readForm, setMode } from './ui.js';
//main.js combines all the files acting as the main file.importing all the required external files as modules.

const $ = (selector) => document.querySelector(selector);
// these two do the same function :document.querySelector('#load-area') $('#load-area')
//$ substitutes - querySelector('#load-area')

const bboxOutput = document.querySelector('#bbox');
const loadButton = document.querySelector('#load-area');
const countOutput = document.querySelector('#count');
const searchInput = document.querySelector('#search');
const filterSelect = document.querySelector('#status-filter');
const form = document.querySelector('#edit-form');

const store = createStore(JSON_SERVER_URL);
const map = initBasemap('map-container', [-1.2864, 36.8172], 13);
const markerLayer = L.layerGroup().addTo(map);
//grabbing page elements once for an efficient setup


let currentRect = '';
let records = [];     // everything in JSON Server
let selected = null;  // the record being edited, or null
let creating = false; // true while adding a brand-new building
// temporary storage 

for (const status of STATUSES) {
  $('#f-status').append(new Option(STATUS_LABELS[status], status));
  filterSelect.append(new Option(STATUS_LABELS[status], status));
}

function updateRect() {
  currentRect = boundsToRect(map.getBounds());
  bboxOutput.textContent = currentRect;
}
map.on('moveend', updateRect);
updateRect();
//gets the panned/zoomed box from the map (the area in focus and updates in to 'currentrect')
//map.on is an event listener

map.on('click', (event) => {
  if (!creating) return;
  $('#f-lat').value = round6(event.latlng.lat);
  $('#f-lon').value = round6(event.latlng.lng);
});
//whenever the map is clicked, call this function

function pinIcon(record) {
//designs the location pin
  let isSelected = false;
  if (selected !== null && selected.id === record.id) {
    isSelected = true;
  }
  //selected location, like the currently selected location
  const selectedClass = isSelected ? ' pin--selected' : '';

  return L.divIcon({
    className: `pin pin--${record.status}${selectedClass}`,
    iconSize: [20, 20],
  });
}

function matchesFilters(record, query, status) {
  const statusOk = status === 'all' || record.status === status;
  const nameOk = query === '' || record.name.toLowerCase().includes(query);
  return statusOk && nameOk;
}

function visibleRecords() {
  const query = searchInput.value.trim().toLowerCase();
  const status = filterSelect.value;

  // .filter() keeps the items for which the function returns true.
  return records.filter((record) => matchesFilters(record, query, status));
}

function renderMarkers() {
  // plots the facilities on the map
  markerLayer.clearLayers();
  const visible = visibleRecords();

  for (const record of visible) {
    const marker = L.marker([record.lat, record.lon], {
      icon: pinIcon(record),
      draggable: true,
      title: record.name,
    });

    marker.on('click', () => selectRecord(record.id));
    marker.on('dragend', () => onDragEnd(record.id, marker.getLatLng()));
    marker.addTo(markerLayer);
  }

  countOutput.textContent = `${visible.length} of ${records.length} shown`;
}

function syncPanels() {
  showExisting(selected);
  fillForm(selected);
  showErrors([]);
  setMode({ editing: selected !== null, creating: creating });
}


// .map() builds a new array. For each record we return either the updated one (if the ids match) or the old one untouched.don't edit the array in place; replace it.
function replaceRecord(updated) {
  records = records.map((record) => {
    if (record.id === updated.id) {
      return updated;
    }
    return record;
  });
}

// .find() returns the first match, or `undefined` if nothing matches.
function findRecordById(id) {
  return records.find((record) => record.id === id) || null;
}


//`async` marks a function that can pause.
// `await` pauses this very function until the promise finishes, withou freezing the page. 
async function refresh() {
  records = await store.list();
//`store.list()` talks to JSON Server over the network, so it returns a promise.
  if (selected !== null) {
    selected = findRecordById(selected.id);
  }
  renderMarkers();
}

function selectRecord(id) {
  selected = findRecordById(id);
  creating = false;
//Adding mode (creating is true): the user pressed “new building” and is placing a brand-new pin.
//Normal mode (creating is false): the user is looking at or editing buildings that already exist.
  syncPanels();
//syncs the panels such that the selected on the map is the one on the side panels
  renderMarkers();
}

async function onDragEnd(id, latlng) {
  const record = findRecordById(id);
  if (record === null) return;

  const changes = { lat: round6(latlng.lat), lon: round6(latlng.lng) };
  if (record.status === 'unchecked') {
    changes.status = 'moved';
  }
//This object will be sent to the server with PATCH, which means “update only these fields.”

  try {
    setStatus('Saving new position…');
    const updated = await store.patch(id, changes);
    replaceRecord(updated);
    selected = updated;
    creating = false;
    syncPanels();
    setStatus('Position saved.', 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  }

// Runs after success and failure. When failed, records still holds the old position, so redrawing snaps the pin back to where it was.
  renderMarkers();
}

//HERE WE ARE
// ---- 8. GET (Geoapify) then POST (our server): load a new area -------
async function handleLoadClick() {
  if (isAreaTooLarge(map.getBounds())) {
    setStatus('This area is too large. Zoom in and try again.', 'error');
    return;
  }

  loadButton.disabled = true; // stop double-clicks while we work
  setStatus('Loading places for this area…');

  try {
    // NOTE 11 (Promise.all): the two requests don't depend on each
    // other, so we start both at once and wait for BOTH to finish. That
    // is faster than awaiting them one after the other. The result is
    // an array in the same order, which we unpack with destructuring.
    const [places, existing] = await Promise.all([
      fetchPlaces(currentRect, GEOAPIFY_KEY),
      store.list(),
    ]);

    // NOTE 12 (Set): a Set is a collection of unique values with very
    // fast `.has()` lookups. We use it to skip places we've already
    // saved, so repeated loads don't create duplicates.
    const knownIds = new Set(existing.map((record) => record.placeId));
    const freshPlaces = places.filter((place) => !knownIds.has(place.placeId));

    // .map() here turns each place into a PROMISE (one POST request
    // each). Promise.all then waits for all of them together.
    // Trade-off: fast, but fires many requests at once. A `for...of`
    // loop with `await` inside would be slower but gentler.
    await Promise.all(
      freshPlaces.map((place) => store.create(placeToRecord(place)))
    );

    await refresh();
    const alreadySaved = places.length - freshPlaces.length;
    setStatus(`${freshPlaces.length} new, ${alreadySaved} already saved.`, 'success');
  } catch (error) {
    setStatus(`Could not load: ${error.message}`, 'error');
  } finally {
    // NOTE 13: `finally` runs whether we succeeded or failed, so the
    // button can never get stuck disabled.
    loadButton.disabled = false;
  }
}
loadButton.addEventListener('click', handleLoadClick);


// ---- 9. PUT (edit) or POST (new) from the form -----------------------
// NOTE 14: The submit handler was doing too much, so I split it. One
// function decides WHICH case we're in; two small ones do the work.

// POST: create a brand-new building that didn't exist in Geoapify.
async function createNewBuilding(formValues) {
  // NOTE 15 (spread in an object): `...formValues` copies every field
  // from formValues into this new object. If a key appears twice, the
  // LATER one wins, so put defaults first and overrides last.
  const created = await store.create({
    placeId: null,
    originalLat: null,
    originalLon: null,
    ...formValues,
  });

  // NOTE 16 (spread in an array): build a new array holding all the old
  // records plus the new one. Same idea as .concat() or `+` on lists in
  // Python, written the modern way.
  records = [...records, created];
  selected = created;
  creating = false;
  setStatus('Building added.', 'success');
}

// PUT: replace an existing building with the edited version.
async function saveExistingBuilding(formValues) {
  // Start from everything we already know (selected), then let the
  // form values overwrite the fields the user edited.
  const saved = await store.replace(selected.id, { ...selected, ...formValues });
  replaceRecord(saved);
  selected = saved;
  setStatus('Changes saved.', 'success');
}

async function handleSubmit(event) {
  // Stop the browser's default behaviour (reloading the page).
  event.preventDefault();

  const result = validateRecord(readForm());
  showErrors(result.errors);
  if (!result.valid) {
    setStatus('Fix the problems listed in the form.', 'error');
    return;
  }

  try {
    setStatus('Saving…');
    if (creating) {
      await createNewBuilding(result.value);
    } else if (selected !== null) {
      await saveExistingBuilding(result.value);
    }
    syncPanels();
    renderMarkers();
  } catch (error) {
    setStatus(error.message, 'error');
  }
}
form.addEventListener('submit', handleSubmit);


// ---- 10. Start adding a missing building -----------------------------
function handleNewClick() {
  selected = null;
  creating = true;
  syncPanels();

  const center = map.getCenter();
  $('#f-lat').value = round6(center.lat);
  $('#f-lon').value = round6(center.lng);
  $('#f-status').value = 'confirmed';
  renderMarkers();
  setStatus('Click the map to place the building, then fill in the form.');
}
$('#btn-new').addEventListener('click', handleNewClick);


// ---- 11. DELETE --------------------------------------------------------
async function handleDeleteClick() {
  if (selected === null) return;

  // NOTE 17: copy what we need BEFORE the await. See my message in chat
  // for why this matters.
  const idToDelete = selected.id;
  const nameToDelete = selected.name;

  if (!window.confirm(`Delete "${nameToDelete}" from the staging data?`)) return;

  try {
    setStatus('Deleting…');
    await store.remove(idToDelete);
    records = records.filter((record) => record.id !== idToDelete);
    selected = null;
    syncPanels();
    renderMarkers();
    setStatus('Record deleted.', 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  }
}
$('#btn-delete').addEventListener('click', handleDeleteClick);


// ---- 12. Use my location -----------------------------------------------
// NOTE 18 (callbacks): the browser's geolocation API is OLDER than
// promises, so it uses two callbacks: one for success, one for failure.
// You can't `await` it directly. (Stretch exercise later: wrap it in a
// Promise so you can.)
function handleLocateClick() {
  if (!navigator.geolocation) {
    setStatus('Your browser does not support location.', 'error');
    return;
  }

  setStatus('Finding your position…');
  navigator.geolocation.getCurrentPosition(onLocationFound, onLocationError);
}

function onLocationFound(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;
  $('#f-lat').value = round6(lat);
  $('#f-lon').value = round6(lon);
  map.setView([lat, lon], 18);
  setStatus('Position filled in. Check it, then save.', 'success');
}

function onLocationError() {
  setStatus('Could not get your position (permission denied?).', 'error');
}
$('#btn-locate').addEventListener('click', handleLocateClick);


// ---- 13. Filters -------------------------------------------------------
// The 'input' event fires on every keystroke; 'change' fires when a
// dropdown value changes. Both just redraw the markers.
searchInput.addEventListener('input', renderMarkers);
filterSelect.addEventListener('change', renderMarkers);


// ---- 14. Start ---------------------------------------------------------
// NOTE 19: the original used .then().catch(). That's the same idea as
// await + try/catch, just older-looking. I used async/await so the whole
// file reads one way.
async function start() {
  syncPanels();
  try {
    await refresh();
    setStatus('Ready. Pan to an area and press "Load this area".');
  } catch (error) {
    setStatus(error.message, 'error');
  }
}
start();


// ---- A note on REST parameters ----------------------------------------
// NOTE 20: you asked about rest. It uses the same `...` symbol as spread
// but does the OPPOSITE job: spread EXPANDS things out, rest COLLECTS
// leftovers into one. Nothing in this file needs it, so I didn't force
// it in. Typical uses:
//
//   function total(...numbers) { ... }       // numbers is an array
//   const { id, ...otherFields } = record;   // otherFields = everything but id