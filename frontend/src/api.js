const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050';

export async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch(`${BASE}${path}`, { ...options, signal: controller.signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error('api_error');
      err.status = res.status;
      err.fields = data?.error?.fields || [];
      throw err;
    }
    return data;
  } catch (e) {
    if (e.status) throw e;
    const err = new Error('network');
    err.status = navigator.onLine ? 0 : -1; // -1 = offline, 0 = server unreachable/timeout
    throw err;
  } finally {
    clearTimeout(timer);
  }
}