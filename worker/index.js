const API = "https://synapse-api-ug91.onrender.com";

export default {
  fetch(request) {
    const url = new URL(request.url);
    return fetch(new Request(API + url.pathname + url.search, request));
  },
};