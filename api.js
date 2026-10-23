function api_plug(){
const apiKey = '';
const category = 'catering.restaurant'; // e.g. commercial, catering, tourism, etc.
const bbox = '36.664,-1.444,37.104,-1.160';

const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=rect:${bbox}&limit=20&apiKey=${apiKey}`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    console.log('Features found:', data.features);
    // Each item in data.features will have its own properties.place_id
  })
  .catch(err => console.error('Error:', err));
}

api_plug()
