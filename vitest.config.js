// Coverage is measured on the logic modules. main.js, ui.js and basemap.js
// touch the DOM/Leaflet and are checked by hand (see README).
export default {
  test: {
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['geo.js', 'validate.js', 'api.js', 'store.js'],
      reporter: ['text'],
    },
  },
};
