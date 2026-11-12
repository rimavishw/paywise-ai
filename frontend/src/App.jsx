
import CheckPanel from './CheckPanel.jsx';
import StatusPanel from './StatusPanel.jsx';
import './App.css';

const features = [
  {
    icon: '✉️',
    title: 'Email validation',
    description: 'Catch possible recipient email typos before sending.',
  },
  {
    icon: '⚡',
    title: 'Payment risk checks',
    description: 'Understand possible delays based on your payment details.',
  },
  {
    icon: '🛡️',
    title: 'Clear recovery guidance',
    description: 'Know what the sender and recipient should do next.',
  },
];

export default function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <a href="/" className="brand">
          <span className="brand-icon">✦</span>
          <span>
            PayWise <span className="brand-highlight">AI</span>
            <small>PAYMENT INTELLIGENCE</small>
          </span>
        </a>

        <nav className="nav-links">
          <a href="#check">Check a payment</a>
          <a href="#status">Why is it stuck?</a>
        </nav>

        <div className="sandbox-pill">
          <span className="live-dot"></span>
          Sandbox active
        </div>
      </header>

      <div className="sandbox-strip">
        <span>ⓘ</span>
        Sandbox mode — no real money is used.
      </div>

      <main className="page-container">
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow">
              <span>✧</span> AI-POWERED PAYMENT INTELLIGENCE
            </div>

            <h1>
              Know before you send.
              <span> Stay in control of your payments.</span>
            </h1>

            <p className="hero-description">
              Check recipient details, identify potential payment delays,
              and understand what to do when a PayPal payment gets stuck.
            </p>

            <div className="hero-actions">
              <a href="#check" className="hero-button">
                Check a payment <span>→</span>
              </a>
              <a href="#status" className="hero-secondary">
                Already sent? →
              </a>
            </div>

            <div className="trust-note">
              <span>✓</span> No login required
              <span className="trust-divider">•</span>
              <span>✓</span> Sandbox demonstration
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-orbit orbit-one"></div>
            <div className="visual-orbit orbit-two"></div>
            <div className="visual-card">
              <div className="visual-card-top">
                <span className="visual-icon">✦</span>
                <span className="visual-label">PAYWISE INTELLIGENCE</span>
                <span className="visual-status">● Active</span>
              </div>

              <div className="visual-shield">♢</div>
              <h3>Payments, made clearer.</h3>
              <p>
                Identify possible risks and understand your next steps
                before or after a payment.
              </p>

              <div className="visual-progress">
                <span></span>
              </div>
              <div className="visual-bottom">
                <span>Payment insights</span>
                <strong>AI assisted</strong>
              </div>
            </div>

            <div className="floating-chip chip-top">
              <span>✓</span> Email check
            </div>
            <div className="floating-chip chip-bottom">
              <span>✦</span> Smart guidance
            </div>
          </div>
        </section>

        <section className="features-section">
          <div className="section-heading">
            <span>WHAT PAYWISE AI DOES</span>
            <h2>More clarity. Fewer payment surprises.</h2>
          </div>

          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="checker-section" id="check">
          <div className="section-heading checker-heading">
            <span>01 / BEFORE YOU SEND</span>
            <h2>Check your payment</h2>
            <p>
              Enter your payment details to identify possible risks before
              making a payment.
            </p>
          </div>

          <div className="checker-layout">
            <div className="checker-intro">
              <div className="intro-icon">✦</div>
              <h3>A smarter way to send.</h3>
              <p>
                PayWise AI checks the details you provide and highlights
                potential issues that could delay your payment.
              </p>

              <div className="intro-point">
                <span>01</span>
                <div>
                  <strong>Enter your details</strong>
                  <small>Recipient email and payment information.</small>
                </div>
              </div>

              <div className="intro-point">
                <span>02</span>
                <div>
                  <strong>Run the risk check</strong>
                  <small>Our backend evaluates possible risk factors.</small>
                </div>
              </div>

              <div className="intro-point">
                <span>03</span>
                <div>
                  <strong>Understand the result</strong>
                  <small>See the detected issues and suggestions.</small>
                </div>
              </div>
            </div>

            <div className="checker-card">
              <CheckPanel />
            </div>
          </div>
        </section>

        <section className="status-section" id="status">
          <div className="section-heading">
            <span>02 / AFTER YOU SEND</span>
            <h2>Why is my payment stuck?</h2>
            <p>
              Enter a payment ID or try a sample transaction to understand
              its status and the next steps.
            </p>
          </div>

          <div className="status-card">
            <StatusPanel />
          </div>
        </section>

        <section className="bottom-cta">
          <div>
            <span>PAYWISE AI</span>
            <h2>Every payment deserves clarity.</h2>
            <p>Make more informed payment decisions with PayWise AI.</p>
          </div>
          <a href="#check">Check a payment ↑</a>
        </section>
      </main>

      <footer className="footer">
        <a href="/" className="footer-brand">PayWise AI</a>
        <p>
          PayWise AI is an independent hackathon project and is not
          affiliated with PayPal.
        </p>
        <a href="/privacy.html">Privacy</a>
      </footer>
    </div>
  );
}
