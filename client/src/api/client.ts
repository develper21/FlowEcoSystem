import axios from 'axios';

// API base URL resolution order:
// 1. VITE_API_URL (set in Netlify UI, e.g. https://ecoflow-backend.onrender.com/api)
// 2. '/api' — same-origin: works with the Vite dev proxy locally AND with the
//    Netlify /api/* proxy rewrite in netlify.toml (no CORS needed in production).
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create API instance with default config
export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});