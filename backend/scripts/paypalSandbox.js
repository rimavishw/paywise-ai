// PayPal SANDBOX end-to-end check: token -> create a 1.00 USD fake-money payout -> look it up.
// Usage: node scripts/paypalSandbox.js <sandbox_receiver_email> [APP_BASE_URL]
// Needs PAYPAL_CLIENT_ID and PAYPAL_SECRET in ../.env, and Payouts enabled on the sandbox app.
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { getToken, lookupPayout, BASE } = require('../services/paypal');

(async () => {
  // Safety: never create a payout anywhere but the sandbox.
  if (new URL(BASE).hostname !== 'api-m.sandbox.paypal.com') throw new Error(`Refusing to run: ${BASE} is not the PayPal sandbox`);
  const receiver = process.argv[2];
  if (!receiver || !receiver.includes('@')) throw new Error('Usage: node scripts/paypalSandbox.js <sandbox_receiver_email> [APP_BASE_URL]');

  const token = await getToken();
  console.log('1. OAuth token: OK');

  const res = await fetch(`${BASE}/v1/payments/payouts`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender_batch_header: { sender_batch_id: `paywise-${Date.now()}`, email_subject: 'PayWise AI sandbox test' },
      items: [{ recipient_type: 'EMAIL', amount: { value: '1.00', currency: 'USD' }, receiver }],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Payout create failed: ${res.status} ${data.name || ''} ${data.message || ''}`);
  const batchId = data.batch_header.payout_batch_id;
  console.log(`2. Payout created: ${batchId}`);

  let found;
  for (let i = 0; i < 10; i++) {
    found = await lookupPayout(batchId);
    if (found && found.status !== 'PENDING') break;
    await new Promise(r => setTimeout(r, 3000));
  }
  console.log(`3. Lookup: ${JSON.stringify(found)}`);

  const app = process.argv[3];
  if (app) {
    const r = await fetch(`${app.replace(/\/$/, '')}/api/payments/${batchId}/explain`);
    console.log(`4. App explain: ${r.status} ${JSON.stringify(await r.json())}`);
  }
})().catch(e => { console.error(`FAILED: ${e.message}`); process.exit(1); });
