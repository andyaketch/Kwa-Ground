
import { initBasemap } from './basemap.js';
import { boundsToRect, isAreaTooLarge, round6 } from './geo.js';
import { fetchPlaces, placeToRecord } from './api.js';
import { createStore } from './store.js';
import { validateRecord, STATUSES, STATUS_LABELS } from './validate.js';
import { GEOAPIFY_KEY, JSON_SERVER_URL } from './config.js';
import { setStatus, showErrors, showExisting, fillForm, readForm, setMode } from './ui.js';
//main.js combines all the files acting as the main file.importing all the required external files as modules.

const $ = (selector) => document.querySelector(selector);


const bboxOutput = $('#bbox');
const loadButton = $('#load-area');
const countOutput = $('#count');
const searchInput = $('#search');
const filterSelect = $('#status-filter');
const form = $('#edit-form');

const store = createStore(JSON_SERVER_URL);
const map = initBasemap('map-container', [-1.2864, 36.8172], 13);
const markerLayer = L.layerGroup().addTo(map);
//grabbing page elements once for an efficient setup

// ---- State -----------------------------------------------------------
let currentRect = '';
let records = [];     // everything in JSON Server
let selected = null;  // the record being edited, or null
let creating = false; // true while adding a brand-new building

// ---- Fill the dropdowns from validate.js (single source of truth) ----
for (const status of STATUSES) {
  $('#f-status').append(new Option(STATUS_LABELS[status], status));
  filterSelect.append(new Option(STATUS_LABELS[status], status));
}

// ---- Map: keep the current area in sync ------------------------------
function updateRect() {
  currentRect = boundsToRect(map.getBounds());
  bboxOutput.textContent = currentRect;
}
map.on('moveend', updateRect);
updateRect();

// Clicking the map fills lat/lon while adding a new building.
map.on('click', (event) => {
  if (!creating) return;
  $('#f-lat').value = round6(event.latlng.lat);
  $('#f-lon').value = round6(event.latlng.lng);
});

// ---- Rendering -------------------------------------------------------
function pinIcon(record) {
  const isSelected = selected && selected.id === record.id;
  return L.divIcon({
    className: `pin pin--${record.status}${isSelected ? ' pin--selected' : ''}`,
    iconSize: [20, 20],
  });
}

function visibleRecords() {
  const query = searchInput.value.trim().toLowerCase();
  const status = filterSelect.value;
  return records.filter(
    (r) =>
      (status === 'all' || r.status === status) &&
      (!query || r.name.toLowerCase().includes(query))
  );
}

function renderMarkers() {
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
  setMode({ editing: Boolean(selected), creating });
}

function replaceRecord(updated) {
  records = records.map((r) => (r.id === updated.id ? updated : r));
}

// ---- GET: load everything we've saved --------------------------------
async function refresh() {
  records = await store.list();
  if (selected) selected = records.find((r) => r.id === selected.id) ?? null;
  renderMarkers();
}

// ---- Selecting a pin -------------------------------------------------
function selectRecord(id) {
  selected = records.find((r) => r.id === id) ?? null;
  creating = false;
  syncPanels();
  renderMarkers();
}

// ---- PATCH: drag a pin to correct its position ----------------------
async function onDragEnd(id, latlng) {
  const record = records.find((r) => r.id === id);
  if (!record) return;
  const changes = { lat: round6(latlng.lat), lon: round6(latlng.lng) };
  if (record.status === 'unchecked') changes.status = 'moved';

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
  renderMarkers(); // on failure this snaps the pin back
}

// ---- GET (Geoapify) then POST (our server): load a new area ---------
loadButton.addEventListener('click', async () => {
  if (isAreaTooLarge(map.getBounds())) {
    setStatus('This area is too large. Zoom in and try again.', 'error');
    return;
  }
  loadButton.disabled = true;
  setStatus('Loading places for this area…');
  try {
    const [places, existing] = await Promise.all([
      fetchPlaces(currentRect, GEOAPIFY_KEY),
      store.list(),
    ]);
    const known = new Set(existing.map((r) => r.placeId));
    const fresh = places.filter((p) => !known.has(p.placeId));
    await Promise.all(fresh.map((p) => store.create(placeToRecord(p))));
    await refresh();
    setStatus(
      `${fresh.length} new, ${places.length - fresh.length} already saved.`,
      'success'
    );
  } catch (error) {
    setStatus(`Could not load: ${error.message}`, 'error');
  } finally {
    loadButton.disabled = false;
  }
});

// ---- PUT (edit) or POST (new) from the form --------------------------
form.addEventListener('submit', async (event) => {
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
      const created = await store.create({
        placeId: null,
        originalLat: null,
        originalLon: null,
        ...result.value,
      });
      records = [...records, created];
      selected = created;
      creating = false;
      setStatus('Building added.', 'success');
    } else if (selected) {
      const saved = await store.replace(selected.id, { ...selected, ...result.value });
      replaceRecord(saved);
      selected = saved;
      setStatus('Changes saved.', 'success');
    }
    syncPanels();
    renderMarkers();
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

// ---- POST: start adding a missing building ---------------------------
$('#btn-new').addEventListener('click', () => {
  selected = null;
  creating = true;
  syncPanels();
  const center = map.getCenter();
  $('#f-lat').value = round6(center.lat);
  $('#f-lon').value = round6(center.lng);
  $('#f-status').value = 'confirmed';
  renderMarkers();
  setStatus('Click the map to place the building, then fill in the form.');
});

// ---- DELETE -----------------------------------------------------------
$('#btn-delete').addEventListener('click', async () => {
  if (!selected) return;
  if (!window.confirm(`Delete "${selected.name}" from the staging data?`)) return;
  try {
    setStatus('Deleting…');
    await store.remove(selected.id);
    records = records.filter((r) => r.id !== selected.id);
    selected = null;
    syncPanels();
    renderMarkers();
    setStatus('Record deleted.', 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

// ---- Use my location --------------------------------------------------
$('#btn-locate').addEventListener('click', () => {
  if (!navigator.geolocation) {
    setStatus('Your browser does not support location.', 'error');
    return;
  }
  setStatus('Finding your position…');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      $('#f-lat').value = round6(pos.coords.latitude);
      $('#f-lon').value = round6(pos.coords.longitude);
      map.setView([pos.coords.latitude, pos.coords.longitude], 18);
      setStatus('Position filled in. Check it, then save.', 'success');
    },
    () => setStatus('Could not get your position (permission denied?).', 'error')
  );
});

// ---- Filters ----------------------------------------------------------
searchInput.addEventListener('input', renderMarkers);
filterSelect.addEventListener('change', renderMarkers);

// ---- Start ------------------------------------------------------------
syncPanels();
refresh()
  .then(() => setStatus('Ready. Pan to an area and press "Load this area".'))
  .catch((error) => setStatus(error.message, 'error'));
