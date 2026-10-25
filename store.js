// store.js: talks to OUR backend (JSON Server). This is where the five
// HTTP methods live: GET, POST, PUT, PATCH, DELETE.

export function createStore(baseUrl, fetchFn = (...args) => fetch(...args)) {
  async function request(path, method = 'GET', body) {
    let response;
    try {
      response = await fetchFn(`${baseUrl}${path}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new Error('Could not reach the data server. Is it running?');
    }
    if (!response.ok) {
      throw new Error(`Server error ${response.status} on ${method} ${path}`);
    }
    return response.status === 204 ? null : response.json();
  }

  return {
    list: () => request('/places'),                         // GET
    create: (record) => request('/places', 'POST', record), // POST
    replace: (id, record) => request(`/places/${id}`, 'PUT', record), // PUT
    patch: (id, changes) => request(`/places/${id}`, 'PATCH', changes), // PATCH
    remove: (id) => request(`/places/${id}`, 'DELETE'),     // DELETE
  };
}
