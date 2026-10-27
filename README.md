# Kwa Ground

*Spatial auditing: when the map sends you to a building that isn't there, fix it.*

Kwa Ground lets someone on the ground (a courier, an Uber passenger, a pedestrian) load facility buildings for any area from a public places API, see them on a Leaflet map, and correct them: move a pin, change its status, add a missing building, or remove a bad record.


- **Live App:** [Kwa-Ground](https://andyaketch.github.io/Kwa-Ground/)

## Objectives

1. Pull real place data for any area from a public API.
2. Let a user correct it with full CRUD.
3. Keep the original position next to the corrected one.

## MVP

1. Pick an area on the map and load commercial facilities as pins.
2. Edit a building (drag the pin, change status, edit the form) with changes saved to a hosted JSON Server.
3. Filter pins by audit status and search by name.

## Technologies

HTML
CSS
vanilla JavaScript
Leaflet 1.9 with OpenStreetMap tiles
Geoapify Places API

## Setup

```bash
npm install
cp config.example.js config.js      # then put your Geoapify key in config.js
npm run api                          # JSON Server on http://localhost:3000
npm run serve                        # app on http://localhost:8080 (second terminal)
npm test                             # unit tests with coverage
```

## Modules

| File | Job |
|---|---|
| `main.js` | wires everything to the page |
| `basemap.js` | Leaflet map and tiles |
| `geo.js` | bounds to area of interest, area-size check |
| `api.js` | Geoapify Places requests |
| `store.js` | JSON Server requests (GET, POST, PUT, PATCH, DELETE) |
| `validate.js` | form validation |
| `ui.js` | DOM helpers |

## API endpoints used

**Geoapify** (public): `GET https://api.geoapify.com/v2/places?categories=building.commercial&filter=rect:west,south,east,north&limit=100&apiKey=...`

**JSON Server** (ours):

| Action | Method | Endpoint |
|---|---|---|
| Load saved buildings | GET | `/places` |
| Import a new area / add a building | POST | `/places` |
| Save the full edit form | PUT | `/places/:id` |
| Drag a pin / change position | PATCH | `/places/:id` |
| Remove a record | DELETE | `/places/:id` |


## Known limitation

If you delete a record and load the same area again, the API returns it again. To mark a building as not existing, set its status to "Not found" instead of deleting it.

## Licence

MIT. See `LICENSE`. Map data © OpenStreetMap contributors. Places powered by [Geoapify](https://www.geoapify.com/).
