//this code goes to validate input.
//coordinates dont tend to act like normal input

export const STATUSES = ['unchecked', 'confirmed', 'moved', 'not_found'];

export const STATUS_LABELS = {
  unchecked: 'Unchecked',
  confirmed: 'Confirmed on the ground',
  moved: 'Moved (position corrected)',
  not_found: 'Not found on the ground',
};

function toNumber(value) {
  if (value === '' || value === null || value === undefined) return NaN;
//needs to be '' cause 0 is a latlong
  return Number(value);
}

//text from the form, trimmed. missing becomes ''
function toText(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}
//.trim() removes spaces at both end

export function validateRecord(input) {
  const errors = [];

  const name = toText(input.name);
  const address = toText(input.address);
  const note = toText(input.note);
  const status = input.status;
  const lat = toNumber(input.lat);
  const lon = toNumber(input.lon);

  if (name.length < 2) errors.push('Name must be at least 2 characters.');
  if (name.length > 100) errors.push('Name must be 100 characters or fewer.');
  if (address.length > 200) errors.push('Address must be 200 characters or fewer.');
  if (note.length > 200) errors.push('Note must be 200 characters or fewer.');
  if (!STATUSES.includes(status)) errors.push('Choose a valid status.');

  //NaN (blank or not a number) isn't below -90 or above 90, so it needs its own check
  if (Number.isNaN(lat) || lat < -90 || lat > 90) {
    errors.push('Latitude must be a number between -90 and 90.');
  }
  if (Number.isNaN(lon) || lon < -180 || lon > 180) {
    errors.push('Longitude must be a number between -180 and 180.');
  }

  const isValid = errors.length === 0;

  const cleanValues = {
    name: name,
    address: address,
    lat: lat,
    lon: lon,
    status: status,
    note: note,
  };

  return {
    valid: isValid,
    errors: errors,
    value: cleanValues,
  };
}
