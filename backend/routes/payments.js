const express = require('express');
const rateLimit = require('express-rate-limit');
const { FIXTURES, lookupEntry } = require('../services/explanations');
const { lookupPayout } = require('../services/paypal');
const { rewrite } = require('../services/gemini');

const router = express.Router();
const limiter = rateLimit({
  windowMs: 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { error: { code: 'rate_limited' } },
});

const ID_RE = /^[A-Za-z0-9-]{8,36}$/;
const cache = new Map(); // key: id + status -> explanation text

router.get('/:id/explain', limiter, async (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!ID_RE.test(id))
    return res.status(400).json({ error: { code: 'validation_error', fields: [{ field: 'paymentId', code: 'invalid_id' }] } });

  let found; let recorded = false;
  try {
    if (FIXTURES[id.toUpperCase()]) {
      found = FIXTURES[id.toUpperCase()];
      recorded = true;
    } else {
      found = await lookupPayout(id);
      if (!found) return res.status(404).json({ error: { code: 'not_found' } });
    }
  } catch {
    return res.status(502).json({ error: { code: 'paypal_unreachable' } });
  }

  const entry = lookupEntry(found.reasonCode);
  const key = `${id}:${found.status}`;
  let explanation = cache.get(key);
  let source = 'ai';

  if (!explanation) {
    const aiText = await rewrite(entry.why, entry.label);
    if (aiText) { explanation = aiText; cache.set(key, aiText); }
  }
  if (!explanation) { explanation = entry.why; source = 'fallback'; }

  res.json({
    paymentId: id,
    status: found.status,
    reasonCode: found.reasonCode,
    statusLabel: entry.label,
    explanation,
    senderSteps: entry.sender,
    recipientSteps: entry.recipient,
    source,
    recorded,
    fetchedAt: new Date().toISOString(),
  });
});

module.exports = router;