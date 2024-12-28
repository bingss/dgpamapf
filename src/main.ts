import { createApp } from "vue";

import App from "./App.vue";
// import router from "./router";
import OpenLayersMap from "vue3-openlayers";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const app = createApp(App)

// app.use(router)
app.use(OpenLayersMap /*, options */);
app.mount('#app')