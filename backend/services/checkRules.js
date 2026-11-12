const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MONEY_RE = /^\d+(\.\d{1,2})?$/;

const TYPO_DOMAINS = {
  'gmial.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gamil.com': 'gmail.com',
  'gmail.co': 'gmail.com', 'hotmal.com': 'hotmail.com', 'hotmial.com': 'hotmail.com',
  'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com', 'outlok.com': 'outlook.com',
};
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'MXN', 'CAD', 'AUD'];
const FUNDING = ['balance', 'card', 'bank'];

function validate(body) {
  const fields = [];
  const email = String(body.recipientEmail || '').trim();
  if (!email) fields.push({ field: 'recipientEmail', code: 'required' });
  else if (email.length > 254 || !EMAIL_RE.test(email))
    fields.push({ field: 'recipientEmail', code: 'invalid_email' });

  if (body.amount === undefined || body.amount === null || body.amount === '')
    fields.push({ field: 'amount', code: 'required' });
  else if (!MONEY_RE.test(String(body.amount)) || Number(body.amount) < 0.01 || Number(body.amount) > 60000)
    fields.push({ field: 'amount', code: 'invalid_amount' });

  if (!CURRENCIES.includes(body.currency)) fields.push({ field: 'currency', code: 'invalid_currency' });
  if (!FUNDING.includes(body.fundingMethod)) fields.push({ field: 'fundingMethod', code: 'invalid_funding' });

  if (body.balance !== undefined && body.balance !== null && body.balance !== '' &&
      !MONEY_RE.test(String(body.balance)))
    fields.push({ field: 'balance', code: 'invalid_balance' });
  return fields;
}

function runChecks(body) {
  const reasons = [];
  const skipped = [];
  const [local, domain] = String(body.recipientEmail).trim().toLowerCase().split('@');

  if (TYPO_DOMAINS[domain])
    reasons.push({ code: 'EMAIL_TYPO_DOMAIN', level: 'high', suggestion: `${local}@${TYPO_DOMAINS[domain]}` });

  if (body.fundingMethod === 'bank')
    reasons.push({ code: 'FUNDING_BANK_ECHECK', level: 'medium' });

  if (body.fundingMethod === 'balance') {
    const hasBalance = body.balance !== undefined && body.balance !== null && body.balance !== '';
    if (!hasBalance) skipped.push('BALANCE');
    else if (Number(body.amount) > Number(body.balance))
      reasons.push({ code: 'AMOUNT_OVER_BALANCE', level: 'medium' });
  }

  if (body.senderCountry && body.recipientCountry) {
    if (body.senderCountry !== body.recipientCountry)
      reasons.push({ code: 'CROSS_BORDER', level: 'medium' });
  } else skipped.push('CROSS_BORDER');

  const verdict = reasons.some(r => r.level === 'high') ? 'high' : reasons.length ? 'medium' : 'low';
  return { verdict, reasons, skipped };
}

module.exports = { validate, runChecks };