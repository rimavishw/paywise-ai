import { useState, useRef, useEffect } from 'react';
import { request } from './api.js';
import { FIELD_ERRORS, VERDICT, reasonText, SKIPPED, errorMessage } from './copy.js';

const COUNTRIES = [
  ['', 'Not sure / skip'],
  ['IN', 'India'],
  ['US', 'United States'],
  ['MX', 'Mexico'],
  ['GB', 'United Kingdom'],
  ['DE', 'Germany'],
  ['CA', 'Canada'],
  ['AU', 'Australia'],
];

export default function CheckPanel() {
  const [form, setForm] = useState({
    recipientEmail: '',
    amount: '',
    currency: 'USD',
    fundingMethod: 'balance',
    balance: '',
    senderCountry: '',
    recipientCountry: '',
  });
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [banner, setBanner] = useState('');
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const resultRef = useRef(null);

  useEffect(() => {
    if (result || banner) resultRef.current?.focus();
  }, [result, banner]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function run(values) {
    setLoading(true);
    setBanner('');
    setErrors({});
    setSlow(false);
    const timer = setTimeout(() => setSlow(true), 5000);

    // Remove empty fields so the backend treats them as "not given"
    const payload = { ...values };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '') delete payload[k];
    });

    try {
      const data = await request('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setResult(data);
    } catch (e) {
      if (e.status === 400) {
        const map = {};
        e.fields.forEach((f) => {
          map[f.field] = FIELD_ERRORS[f.field]?.[f.code] || 'Check this field.';
        });
        setErrors(map);
      } else {
        setBanner(errorMessage(e.status, 'check'));
      }
    } finally {
      clearTimeout(timer);
      setLoading(false);
      setSlow(false);
    }
  }

  function submit(e) {
    e.preventDefault();
    run(form);
  }

  function useSuggestion(email) {
    const next = { ...form, recipientEmail: email };
    setForm(next);
    run(next);
  }

  const v = result && VERDICT[result.verdict];

  return (
    <section id="check" className="panel" aria-labelledby="checkTitle">
      <h2 id="checkTitle">Before you send</h2>

      <form onSubmit={submit} noValidate aria-busy={loading}>
        <label htmlFor="email">Recipient's email</label>
        <input
          id="email"
          type="email"
          autoComplete="off"
          value={form.recipientEmail}
          onChange={set('recipientEmail')}
          aria-invalid={!!errors.recipientEmail}
        />
        {errors.recipientEmail && <p className="field-error">{errors.recipientEmail}</p>}

        <div className="row">
          <div>
            <label htmlFor="amount">Amount</label>
            <input
              id="amount"
              inputMode="decimal"
              value={form.amount}
              onChange={set('amount')}
              aria-invalid={!!errors.amount}
            />
            {errors.amount && <p className="field-error">{errors.amount}</p>}
          </div>
          <div>
            <label htmlFor="currency">Currency</label>
            <select id="currency" value={form.currency} onChange={set('currency')}>
              {['USD', 'EUR', 'GBP', 'INR', 'MXN', 'CAD', 'AUD'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <fieldset>
          <legend>Paying with</legend>
          {[
            ['balance', 'PayPal balance'],
            ['card', 'Card'],
            ['bank', 'Bank account'],
          ].map(([val, label]) => (
            <label key={val} className="radio">
              <input
                type="radio"
                name="funding"
                checked={form.fundingMethod === val}
                onChange={() => setForm({ ...form, fundingMethod: val })}
              />{' '}
              {label}
            </label>
          ))}
        </fieldset>

        {form.fundingMethod === 'bank' && (
          <p className="notice" role="status">
            Paying from a bank account is sent as an eCheck. It usually takes 3–5 business days
            to clear, and the recipient can't use the money until then.
          </p>
        )}

        {form.fundingMethod === 'balance' && (
          <>
            <label htmlFor="balance">Your PayPal balance (you enter this)</label>
            <input
              id="balance"
              inputMode="decimal"
              value={form.balance}
              onChange={set('balance')}
            />
            {errors.balance && <p className="field-error">{errors.balance}</p>}
          </>
        )}

        <div className="row">
          <div>
            <label htmlFor="sc">Your country</label>
            <select id="sc" value={form.senderCountry} onChange={set('senderCountry')}>
              {COUNTRIES.map(([c, n]) => (
                <option key={c} value={c}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rc">Recipient's country</label>
            <select id="rc" value={form.recipientCountry} onChange={set('recipientCountry')}>
              {COUNTRIES.map(([c, n]) => (
                <option key={c} value={c}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="primary" disabled={loading}>
          {loading ? 'Checking…' : 'Check this payment'}
        </button>
        {slow && (
          <p className="muted">
            Still working. Our server may be waking up; this can take up to a minute.
          </p>
        )}
        <p className="muted">No account needed. We don't store your email or payment details.</p>
      </form>

      <div aria-live="polite" className={loading ? 'dim' : ''}>
        {banner && (
          <div className="card error" role="alert" tabIndex={-1} ref={resultRef}>
            <p>{banner}</p>
            <button onClick={() => run(form)}>Try again</button>
          </div>
        )}

        {result && !banner && (
          <div className={`card verdict ${result.verdict}`}>
            <h3 tabIndex={-1} ref={resultRef}>{v.title}</h3>
            {result.reasons.length === 0 && <p>{v.text}</p>}
            <ul>
              {result.reasons.map((r) => (
                <li key={r.code}>
                  {reasonText(r)}
                  {r.suggestion && (
                    <div>
                      <button className="link" onClick={() => useSuggestion(r.suggestion)}>
                        Use {r.suggestion}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {result.skipped.map((s) => (
              <p key={s} className="muted">{SKIPPED[s]}</p>
            ))}
            <a href="#status">Already sent? See why it's waiting.</a>
          </div>
        )}
      </div>
    </section>
  );
}