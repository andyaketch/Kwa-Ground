// ui.js: small DOM helpers for the form and messages.
// Uses textContent / .value only (never innerHTML), so record text
// from the API or from users can't inject markup.

const $ = (selector) => document.querySelector(selector);

export function setStatus(message, kind = 'info') {
  const el = $('#status');
  el.textContent = message;
  el.dataset.kind = kind; // styled in style.css
}

export function showErrors(errors) {
  const list = $('#form-errors');
  list.replaceChildren(
    ...errors.map((text) => {
      const li = document.createElement('li');
      li.textContent = text;
      return li;
    })
  );
}

export function showExisting(record) {
  $('#ex-name').textContent = record ? record.name : '–';
  $('#ex-address').textContent = record ? record.address || '–' : '–';
  $('#ex-status').textContent = record ? record.status : '–';
  if (!record) {
    $('#ex-original').textContent = 'Select a pin on the map.';
  } else if (record.originalLat == null) {
    $('#ex-original').textContent = 'Added by you (not from the API).';
  } else {
    $('#ex-original').textContent = `${record.originalLat}, ${record.originalLon}`;
  }
}

export function fillForm(record) {
  $('#f-name').value = record?.name ?? '';
  $('#f-address').value = record?.address ?? '';
  $('#f-lat').value = record?.lat ?? '';
  $('#f-lon').value = record?.lon ?? '';
  $('#f-status').value = record?.status ?? 'unchecked';
  $('#f-note').value = record?.note ?? '';
}

export function readForm() {
  return {
    name: $('#f-name').value,
    address: $('#f-address').value,
    lat: $('#f-lat').value,
    lon: $('#f-lon').value,
    status: $('#f-status').value,
    note: $('#f-note').value,
  };
}

export function setMode({ editing, creating }) {
  $('#form-title').textContent = creating
    ? 'New building'
    : editing
      ? 'Updated information'
      : 'Updated information';
  $('#btn-save').textContent = creating ? 'Add building' : 'Save changes';
  $('#btn-save').disabled = !editing && !creating;
  $('#btn-delete').disabled = !editing;
}
