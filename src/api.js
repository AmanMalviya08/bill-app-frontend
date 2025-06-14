// import axios from 'axios';

// const API = axios.create({
//   baseURL: 'http://localhost:5000/api/companies' // Adjust if needed
// });

// export default API;



// src/api.js
import axios from 'axios';

const API = axios.create({
  // baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Important if you're using cookies or auth
});

export default API;

