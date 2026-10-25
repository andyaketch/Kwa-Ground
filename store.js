// store.js: talks to the backend (JSON Server). This is where the five HTTP methods are demonstrated: GET, POST, PUT, PATCH, DELETE.

 export function createStore(baseUrl, fetchFn) {
//builds the storage
//fetchFN is the function used to make requests
  if (fetchFn === undefined) {
    fetchFn = function (url, options) {
      return fetch(url, options);
    };
  }

  async function request(path, method = 'GET', body) {
    const options = {
      method: method,
      headers: undefined,
      body: undefined,
    };
    if (body) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body); 
    }
 
    // Can the machine reach the server at all?
    let response;
    try {
      response = await fetchFn(`${baseUrl}${path}`, options);
    } catch (error) {
      throw new Error('Could not reach the data');
    }

    if (!response.ok) {
      throw new Error(`Server error ${response.status} on ${method} ${path}`);
    }
 
    if (response.status === 204) {
      return null;
    }
    return response.json();
  }

  function list() {                       // GET
    return request('/places');
  }
 
  function create(record) {               // POST
    return request('/places', 'POST', record);
  }
 
  function replace(id, record) {          // PUT
    return request(`/places/${id}`, 'PUT', record);
  }
 
  function patch(id, changes) {           // PATCH
    return request(`/places/${id}`, 'PATCH', changes);
  }
 
  function remove(id) {                   // DELETE
    return request(`/places/${id}`, 'DELETE');
  }
 
  return {
    list: list,
    create: create,
    replace: replace,
    patch: patch,
    remove: remove,
  };
}
 