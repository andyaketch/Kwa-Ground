# Kwa Ground


Kwa Ground lets someone on the ground (a courier, an Uber passenger, a pedestrian) load facility buildings for any area from a public places API, see them on a Leaflet map, and correct them: move a pin, change its status, add a missing building, or remove a bad record.


- **Live App:** [Kwa-Ground](https://andyaketch.github.io/Kwa-Ground/)
- **Data server (Render):** [kwagroundproductions.onrender.com](https://kwagroundproductions.onrender.com/places)

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
JSON Server, hosted on Render

## Setup

```bash
npm install
# put your Geoapify key in config.js
npm run api                         
npm run serve                       
npm test                             
```

## Deployment

The app is two parts, hosted in two places:

| Part | Host | How |
|---|---|---|
| Page (HTML, CSS, JS) | GitHub Pages | static files, deployed by the GitHub Actions workflow in `.github/workflows` |
| Data (JSON Server) | Render (free web service) | runs `server.js` |

## API endpoints used

**Geoapify** (public): `GET https://api.geoapify.com/v2/places?categories=building.commercial&filter=rect:west,south,east,north&limit=100&apiKey=...`

**JSON Server** (ours):

| Action | Method | Endpoint |
|---|---|---|
| Load saved buildings | GET | `/places` |
| add a building/facilty | POST | `/places` |
| Save the full edit form | PUT | `/places/:id` |
| Drag a pin / change position | PATCH | `/places/:id` |
| Remove a record | DELETE | `/places/:id` |

## Licence

MIT. See `LICENSE`. Map data © OpenStreetMap contributors. Places powered by [Geoapify](https://www.geoapify.com/).
