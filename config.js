export const GEOAPIFY_KEY = 'b13c864d8f204265b230ecda4ca1c666';

//on your own computer use the local server, on the live site use the hosted one
let apiUrl = 'https://kwagroundproductions.onrender.com';
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  apiUrl = 'http://localhost:3000';
}
export const JSON_SERVER_URL = apiUrl;
