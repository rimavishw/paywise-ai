
import { useState } from "react";
import './AppDashboard.css';

const initialTransactions = [
  {
    id: "PW-001",
    recipient: "recipient@example.com",
    amount: 500,
    currency: "USD",
    status: "Pending",
    issue: "Verification warning",
  },
  {
    id: "PW-002",
    recipient: "alex@example.com",
    amount: 100,
    currency: "USD",
    status: "Pending",
    issue: "Payment awaiting acceptance",
  },
];

function App() {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [activePage, setActivePage] = useState("Dashboard");
  const [notice, setNotice] = useState("");

  const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const pending = transactions.filter(tx => tx.status === "Pending").length;

  function createPayment(e) {
    e.preventDefault();

    if (!recipient.trim() || !amount || Number(amount) <= 0) {
      setNotice("Please enter a valid recipient email and amount.");
      return;
    }

    const newTransaction = {
      id: `PW-${String(transactions.length + 1).padStart(3, "0")}`,
      recipient: recipient.trim(),
      amount: Number(amount),
      currency: "USD",
      status: "Pending",
      issue: "Pre-flight check required",
    };

    setTransactions([newTransaction, ...transactions]);
    setRecipient("");
    setAmount("");
    setMessage("");
    setNotice("Demo payment created successfully!");
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">P</div>
          <div>
            <h2>PayWise AI</h2>
            <span>Payment Recovery Workspace</span>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>

        {["Dashboard", "Transactions", "Recipients", "AI Assistant"].map(item => (
          <button
            key={item}
            className={`nav-item ${activePage === item ? "active" : ""}`}
            onClick={() => setActivePage(item)}
          >
            <span>{{
              Dashboard: "⌂",
              Transactions: "↔",
              Recipients: "♙",
              "AI Assistant": "✧",
            }[item]}</span>
            {item}
          </button>
        ))}

        <div className="sidebar-bottom">
          <div className="help-card">
            <span>✦ Need help?</span>
            <p>Understand and recover your payments with PayWise AI.</p>
          </div>
          <div className="profile">
            <div className="avatar">U</div>
            <div>
              <strong>Demo User</strong>
              <small>Sender Account</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace / {activePage}</span>
            <h1>{activePage}</h1>
          </div>
          <div className="top-actions">
            <span className="sandbox">● SANDBOX MODE</span>
            <div className="avatar">U</div>
          </div>
        </header>

        {activePage === "Dashboard" && (
          <>
            <section className="welcome">
              <div>
                <h2>Welcome back!</h2>
                <p>Monitor your payments and resolve payment issues smarter.</p>
              </div>
              <span className="welcome-icon">✦</span>
            </section>

            <section className="stats">
              <div className="stat-card">
                <span>Total Transactions</span>
                <h2>{transactions.length}</h2>
                <small>Recorded in this demo</small>
              </div>
              <div className="stat-card">
                <span>Total Payment Value</span>
                <h2>${total.toLocaleString("en-US")}</h2>
                <small>Across displayed transactions</small>
              </div>
              <div className="stat-card">
                <span>Pending Payments</span>
                <h2>{pending}</h2>
                <small>Awaiting resolution</small>
              </div>
              <div className="stat-card">
                <span>Recovery Rate</span>
                <h2>—</h2>
                <small>Not yet calculated</small>
              </div>
            </section>

            <section className="content-grid">
              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Recent Transactions</h3>
                    <p>Track your payment activity</p>
                  </div>
                  <button className="text-button" onClick={() => setActivePage("Transactions")}>
                    View all →
                  </button>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Transaction</th>
                        <th>Recipient</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 5).map(tx => (
                        <tr key={tx.id}>
                          <td><strong>{tx.id}</strong></td>
                          <td>{tx.recipient}</td>
                          <td>{tx.currency} {tx.amount}</td>
                          <td><span className="status pending">{tx.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="panel payment-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Create Demo Payment</h3>
                    <p>Try a simulated payment</p>
                  </div>
                  <span className="sparkle">✧</span>
                </div>

                <form onSubmit={createPayment}>
                  <label>Recipient email</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={recipient}
                    onChange={e => setRecipient(e.target.value)}
                    required
                  />

                  <label>Amount (USD)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                  />

                  <label>Payment note</label>
                  <input
                    type="text"
                    placeholder="What's this payment for?"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                  />

                  <button className="primary-button" type="submit">
                    + Create Demo Payment
                  </button>
                </form>
                {notice && <p className="notice">{notice}</p>}
              </div>
            </section>

            <section className="panel insight-panel">
              <div className="insight-icon">✦</div>
              <div>
                <h3>AI Payment Insights</h3>
                <p>
                  PayWise AI is designed to identify common payment issues,
                  explain possible causes and guide users towards resolution.
                </p>
                <span className="coming-soon">AI integration pending</span>
              </div>
            </section>
          </>
        )}

        {activePage === "Transactions" && (
          <section className="panel page-panel">
            <h3>All Transactions</h3>
            <p>Your recorded demo payment activity.</p>
            {transactions.map(tx => (
              <div className="transaction-row" key={tx.id}>
                <div>
                  <strong>{tx.id}</strong>
                  <p>{tx.recipient}</p>
                  <small>{tx.issue}</small>
                </div>
                <strong>{tx.currency} {tx.amount}</strong>
                <span className="status pending">{tx.status}</span>
              </div>
            ))}
          </section>
        )}

        {activePage === "Recipients" && (
          <section className="panel page-panel">
            <h3>Recipients</h3>
            <p>Recipients appearing in your demo transactions.</p>
            {[...new Set(transactions.map(tx => tx.recipient))].map(email => (
              <div className="transaction-row" key={email}>
                <div><strong>{email}</strong><p>Payment recipient</p></div>
                <span className="status pending">Demo</span>
              </div>
            ))}
          </section>
        )}

        {activePage === "AI Assistant" && (
          <section className="panel page-panel">
            <div className="insight-icon">✦</div>
            <h3>PayWise AI Assistant</h3>
            <p>
              This workspace will explain pending and unclaimed payments,
              identify possible causes and recommend recovery steps.
            </p>
            <span className="coming-soon">Gemini AI integration pending</span>
          </section>
        )}

        <footer>© 2026 PayWise AI · Payment Recovery Workspace · Demo environment</footer>
      </main>
    </div>
  );
}

export default App;
