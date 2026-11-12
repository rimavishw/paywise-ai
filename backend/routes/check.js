const express = require('express');
const rateLimit = require('express-rate-limit');
const { validate, runChecks } = require('../services/checkRules');

const router = express.Router();
const limiter = rateLimit({
  windowMs: 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { error: { code: 'rate_limited' } },
});

router.post('/', limiter, (req, res) => {
  const body = req.body || {};
  const fields = validate(body);
  if (fields.length) return res.status(400).json({ error: { code: 'validation_error', fields } });
  res.json(runChecks(body)); // never log the email (privacy rule)
});

module.exports = router;