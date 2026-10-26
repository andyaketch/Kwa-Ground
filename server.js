// JSON Server as a small Node app, so it can be hosted (Railway, Render...).
// on your computer: npm run api   ->   http://localhost:3000/places
import fs from 'fs';
import path from 'path';
import jsonServer from 'json-server';

//where the data lives. on a host with a disk (volume), set DB_FILE to a path on it, e.g. /data/db.json
const dbFile = process.env.DB_FILE || 'db.json';

//first start on an empty disk: copy the starter db.json over, so /places exists
if (!fs.existsSync(dbFile)) {
  fs.mkdirSync(path.dirname(dbFile), { recursive: true });
  fs.copyFileSync('db.json', dbFile);
}

const server = jsonServer.create();

//JSON Server treats any field ending in "Id" (our placeId) as a link to another collection,
//and deletes the "orphans" whenever you delete anything. a suffix nobody uses switches that off
const router = jsonServer.router(dbFile, { foreignKeySuffix: '_fk' });
const middlewares = jsonServer.defaults(); // includes CORS

server.use(middlewares);
server.use(router);

const port = process.env.PORT || 3000;
server.listen(port, function () {
  console.log('JSON Server running on port ' + port + ', data file: ' + dbFile);
});
