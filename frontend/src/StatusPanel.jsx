import { useState, useRef, useEffect } from 'react';
import { request } from './api.js';
import { FIELD_ERRORS, errorMessage } from './copy.js';

const EXAMPLES = [
  ['DEMO-UNCLAIMED', 'Unclaimed payment'],
  ['DEMO-ECHECK', 'Pending eCheck'],
  ['DEMO-COMPLETED', 'Completed payment'],
];

export default function StatusPanel() {
  const [id, setId] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [banner, setBanner] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    if (data || banner) cardRef.current?.focus();
  }, [data, banner]);

  async function lookup(value) {
    const paymentId = value.trim();
    setFieldError('');
    setBanner('');

    if (!paymentId) return setFieldError(FIELD_ERRORS.paymentId.required);
    if (!/^[A-Za-z0-9-]{8,36}$/.test(paymentId))
      return setFieldError(FIELD_ERRORS.paymentId.invalid_id);

    setLoading(true);
    setSlow(false);
    const timer = setTimeout(() => setSlow(true), 5000);
    try {
      const result = await request(
        `/api/payments/${encodeURIComponent(paymentId)}/explain`
      );
      setData(result);
    } catch (e) {
      if (e.status === 400) setFieldError(FIELD_ERRORS.paymentId.invalid_id);
      else setBanner(errorMessage(e.status, 'status'));
    } finally {
      clearTimeout(timer);
      setLoading(false);
      setSlow(false);
    }
  }

  const badge = data
    ? data.status === 'COMPLETED'
      ? 'green'
      : data.status === 'OTHER'
      ? 'grey'
      : 'amber'
    : '';

  return (
    <section id="status" className="panel wide" aria-labelledby="statusTitle">
      <h2 id="statusTitle">Already sent? See why it's waiting.</h2>
      <p className="muted">
        Enter the payment ID from your PayPal receipt. We'll tell you the reason and what each
        side should do.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup(id);
        }}
        noValidate
        aria-busy={loading}
      >
        <label htmlFor="pid">Payment ID</label>
        <input
          id="pid"
          value={id}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck="false"
          onChange={(e) => setId(e.target.value)}
          aria-invalid={!!fieldError}
        />
        <p className="muted">
          You'll find it in the PayPal email or on the transaction details page.
        </p>
        {fieldError && <p className="field-error">{fieldError}</p>}

        <button type="submit" className="primary" disabled={loading}>
          {loading ? 'Asking PayPal…' : 'Explain this payment'}
        </button>
        {slow && (
          <p className="muted">
            Still working. Our server may be waking up; this can take up to a minute.
          </p>
        )}
      </form>

      <p className="muted">No payment to hand? Try an example.</p>
      <div className="examples">
        {EXAMPLES.map(([demoId, label]) => (
          <button
            key={demoId}
            type="button"
            onClick={() => {
              setId(demoId);
              lookup(demoId);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div aria-live="polite" className={loading ? 'dim' : ''}>
        {banner && (
          <div className="card error" role="alert" tabIndex={-1} ref={cardRef}>
            <p>{banner}</p>
            <button onClick={() => lookup(id)}>Try again</button>
          </div>
        )}

        {data && !banner && (
          <div className="card">
            <div className="badge-row">
              <span className={`badge ${badge}`} tabIndex={-1} ref={cardRef}>
                {data.statusLabel}
              </span>
              {data.recorded && <span className="tag">Recorded sandbox response</span>}
            </div>

            <p>{data.explanation}</p>
            {data.source === 'fallback' && <p className="muted">Standard explanation shown.</p>}

            <div className="steps">
              <div className="step recipient">
                <h4>Recipient should</h4>
                <ul>
                  {data.recipientSteps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="step">
                <h4>Sender should</h4>
                <ul>
                  {data.senderSteps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={() => {
                setData(null);
                setId('');
              }}
            >
              Check another payment
            </button>
          </div>
        )}
      </div>
    </section>
  );
}