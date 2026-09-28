import axios from 'axios';

// The unversioned GET /health check lives outside /api/v1 and returns a
// plain { status, db, timestamp } body, not the { success, data } envelope
// every other endpoint uses - so it can't go through apiClient.
const HEALTH_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, '/health');

export function getHealth() {
  return axios.get(HEALTH_URL).then((response) => response.data);
}
