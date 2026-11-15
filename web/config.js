// Frontend config — API (Cloudflare Worker) base URL
window.APP_CONFIG = {
  API_BASE: (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:8787'
    : 'https://app-api.krvcf.com',
  SITE_URL: 'https://app.krvcf.com'
};
