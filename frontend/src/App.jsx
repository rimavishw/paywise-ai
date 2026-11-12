import CheckPanel from './CheckPanel.jsx';
import StatusPanel from './StatusPanel.jsx';
import './App.css';

export default function App() {
  return (
    <>
      <header className="header">
        <a href="/" className="brand">PayWise AI</a>
        <nav>
          <a href="#check">Check a payment</a>
          <a href="#status">Why is it stuck?</a>
        </nav>
      </header>

      <div className="sandbox-banner">Sandbox mode: no real money is used.</div>

      <main>
        <section className="hero">
          <div>
            <h1>Know if your PayPal payment will get stuck, before you send it.</h1>
            <p>
              Check the recipient's email, your funding source and the amount in seconds.
              Already sent? Find out why it's pending and whose move it is.
            </p>
            <a className="secondary" href="#status">Why is my payment stuck?</a>
          </div>
          <CheckPanel />
        </section>

        <StatusPanel />
      </main>

      <footer>
        <a href="/privacy.html">Privacy</a>
        <p>PayWise AI is an independent project and is not affiliated with PayPal.</p>
      </footer>
    </>
  );
}