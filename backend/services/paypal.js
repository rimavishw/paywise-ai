const BASE = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
let cached = { token: null, expiresAt: 0 };

async function getToken() {
  if (cached.token && Date.now() < cached.expiresAt - 60_000) return cached.token;
  const basic = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error('paypal_auth_failed');
  const data = await res.json();
  cached = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cached.token;
}

// Looks up a payout batch by ID. Returns null if PayPal says it does not exist.
async function lookupPayout(batchId) {
  const token = await getToken();
  const res = await fetch(`${BASE}/v1/payments/payouts/${encodeURIComponent(batchId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('paypal_lookup_failed');
  const data = await res.json();
  const item = data.items && data.items[0];
  const raw = item ? item.transaction_status : data.batch_header.batch_status;

  const map = { SUCCESS: 'COMPLETED', UNCLAIMED: 'UNCLAIMED', ONHOLD: 'ONHOLD', BLOCKED: 'ONHOLD', PENDING: 'PENDING', PROCESSING: 'PENDING' };
  const status = map[raw] || 'OTHER';
  const reasonCode = ['COMPLETED', 'UNCLAIMED', 'ONHOLD'].includes(status) ? status : 'OTHER';
  return { status, reasonCode };
}

module.exports = { getToken, lookupPayout, BASE };