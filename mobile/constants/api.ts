// ── API base URL ──────────────────────────────────────────────
// For Android emulator → http://10.0.2.2:3000
// For iOS simulator    → http://localhost:3000
// For physical device  → http://<your-local-IP>:3000
//
// Set DEV_IP to your machine's local network IP when testing
// on a physical device (run `ipconfig` to find it).
const DEV_IP = 'localhost';

export const API_URL = __DEV__
  ? `http://${DEV_IP}:3000`
  : 'https://your-production-domain.com';
