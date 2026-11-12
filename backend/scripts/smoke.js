// API smoke test. Usage: node scripts/smoke.js [BASE_URL]
// Optional signed-in flow: set TEST_EMAIL and TEST_PASSWORD (an existing, verified test user).
// Note: /api/check and /api/payments allow 10 requests/minute each. Wait a minute between runs.
const assert = require('node:assert/strict');

const BASE = (process.argv[2] || process.env.BASE_URL || 'http://localhost:5050').replace(/\/$/, '');
const results = [];

async function call(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

async function t(name, fn) {
  try {
    results.push({ name, ok: true, note: (await fn()) || '' });
  } catch (e) {
    results.push({ name, ok: false, note: e.message.split('\n')[0] });
  }
}

const goodCheck = {
  recipientEmail: 'friend@gmail.com', amount: '25.00', currency: 'USD',
  fundingMethod: 'card', senderCountry: 'US', recipientCountry: 'US',
};

(async () => {
  console.log(`Smoke testing ${BASE}\n`);

  for (const path of ['/', '/health', '/api/health']) {
    await t(`GET ${path}`, async () => {
      assert.equal((await call('GET', path)).status, 200);
    });
  }

  await t('GET /api/db-test (Supabase)', async () => {
    const r = await call('GET', '/api/db-test');
    assert.equal(r.status, 200, r.data.message);
  });

  await t('POST /api/check clean payment -> low', async () => {
    const r = await call('POST', '/api/check', goodCheck);
    assert.equal(r.status, 200);
    assert.equal(r.data.verdict, 'low');
  });
  await t('POST /api/check typo domain -> high + suggestion', async () => {
    const r = await call('POST', '/api/check', { ...goodCheck, recipientEmail: 'friend@gmial.com' });
    assert.equal(r.data.verdict, 'high');
    assert.equal(r.data.reasons[0].suggestion, 'friend@gmail.com');
  });
  await t('POST /api/check bank funding -> medium', async () => {
    const r = await call('POST', '/api/check', { ...goodCheck, fundingMethod: 'bank' });
    assert.equal(r.data.verdict, 'medium');
    assert.equal(r.data.reasons[0].code, 'FUNDING_BANK_ECHECK');
  });
  await t('POST /api/check empty body -> 400', async () => {
    const r = await call('POST', '/api/check', {});
    assert.equal(r.status, 400);
    assert.equal(r.data.error.code, 'validation_error');
    assert.ok(r.data.error.fields.length >= 4);
  });

  for (const [id, status] of [['DEMO-UNCLAIMED', 'UNCLAIMED'], ['DEMO-ECHECK', 'PENDING'],
    ['DEMO-MANUAL', 'PENDING'], ['DEMO-COMPLETED', 'COMPLETED']]) {
    await t(`GET /api/payments/${id}/explain`, async () => {
      const r = await call('GET', `/api/payments/${id}/explain`);
      assert.equal(r.status, 200);
      assert.equal(r.data.status, status);
      assert.equal(r.data.recorded, true);
      assert.ok(r.data.explanation && r.data.senderSteps.length && r.data.recipientSteps.length);
      return `source=${r.data.source}`; // ai = Gemini answered, fallback = hand-written text
    });
  }
  await t('GET /api/payments/bad!/explain -> 400', async () => {
    assert.equal((await call('GET', '/api/payments/bad!/explain')).status, 400);
  });
  await t('GET /api/payments/<unknown>/explain -> 404 (live PayPal sandbox lookup)', async () => {
    const r = await call('GET', '/api/payments/ZZZZ9999ZZZZ9/explain');
    assert.equal(r.status, 404, `got ${r.status} ${r.data.error && r.data.error.code} (502 = PayPal credentials/API problem)`);
  });

  for (const path of ['/api/auth/me', '/api/recipients', '/api/transactions', '/api/events/transaction/x']) {
    await t(`GET ${path} without token -> 401`, async () => {
      assert.equal((await call('GET', path)).status, 401);
    });
  }
  await t('POST /api/auth/login empty body -> 400', async () => {
    assert.equal((await call('POST', '/api/auth/login', {})).status, 400);
  });

  if (process.env.TEST_EMAIL && process.env.TEST_PASSWORD) {
    let token; let recipientId; let txId;
    await t('POST /api/auth/login', async () => {
      const r = await call('POST', '/api/auth/login', { email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD });
      assert.equal(r.status, 200, r.data.message);
      token = r.data.session.access_token;
    });
    await t('GET /api/auth/me', async () => {
      const r = await call('GET', '/api/auth/me', null, token);
      assert.equal(r.status, 200, r.data.message);
    });
    await t('POST /api/recipients', async () => {
      const r = await call('POST', '/api/recipients', { name: 'Smoke Test', email: `smoke+${Date.now()}@example.com` }, token);
      assert.equal(r.status, 201, r.data.message);
      recipientId = r.data.recipient.id;
    });
    await t('GET /api/recipients', async () => {
      const r = await call('GET', '/api/recipients', null, token);
      assert.equal(r.status, 200);
      assert.ok(r.data.recipients.some(x => x.id === recipientId));
    });
    await t('DELETE /api/recipients/:id', async () => {
      assert.equal((await call('DELETE', `/api/recipients/${recipientId}`, null, token)).status, 200);
    });
    await t('POST /api/transactions (simulated)', async () => {
      const r = await call('POST', '/api/transactions', { recipient_email: 'smoke@example.com', amount: 1, currency: 'USD' }, token);
      assert.ok([201, 422].includes(r.status), `got ${r.status} ${r.data.message}`); // 422 = blocked by pre-flight
      if (r.status === 201) txId = r.data.transaction.id;
      return `status=${r.status} risk=${r.data.preflight.risk_level}`;
    });
    await t('GET /api/transactions', async () => {
      assert.equal((await call('GET', '/api/transactions', null, token)).status, 200);
    });
    if (txId) {
      await t('GET /api/transactions/:id', async () => {
        assert.equal((await call('GET', `/api/transactions/${txId}`, null, token)).status, 200);
      });
      await t('GET /api/events/transaction/:id', async () => {
        assert.equal((await call('GET', `/api/events/transaction/${txId}`, null, token)).status, 200);
      });
    }
  } else {
    console.log('(signed-in flow skipped: set TEST_EMAIL and TEST_PASSWORD to run it)\n');
  }

  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.note ? `  [${r.note}]` : ''}`);
  const failed = results.filter(r => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})();
