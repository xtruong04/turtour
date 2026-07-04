var _isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
window.TURTOUR_API_BASE = _isLocal
  ? 'https://localhost:7186/api'
  : 'https://turtour-production.up.railway.app/api';
window.TURTOUR_HUB_URL = _isLocal
  ? 'https://localhost:7186/hubs/app'
  : 'https://turtour-production.up.railway.app/hubs/app';