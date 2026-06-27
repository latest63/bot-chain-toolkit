import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="nav-inner">
          <div className="nav-brand">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#00D4AA" strokeWidth="2" fill="none"/>
              <circle cx="12" cy="12" r="4" fill="#00D4AA"/>
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#00D4AA" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="brand-text">BOT Chain Toolkit</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how">How It Works</a>
            <a href="https://scan.bohr.life" target="_blank" rel="noreferrer">Explorer</a>
          </div>
          <Link to="/app" className="btn-primary">Launch App →</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-3d-kit">
          <div className="hero-3d-shape"></div>
          <div className="hero-3d-shape"></div>
          <div className="hero-3d-shape"></div>
          <div className="hero-3d-shape"></div>
          <div className="hero-3d-shape"></div>
          <div className="hero-3d-shape"></div>
        </div>
        <div className="hero-bg-glow" />
        <div className="hero-content">
          <div className="hero-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#00D4AA" strokeWidth="2" fill="none"/>
              <circle cx="12" cy="12" r="4" fill="#00D4AA"/>
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#00D4AA" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Live on BOT Chain Testnet</div>
          <h1 className="hero-title">
            Payment & Raffle<br />
            <span className="hero-accent">Toolkit for BOT Chain</span>
          </h1>
          <p className="hero-subtitle">
            Batch-send BOT tokens to hundreds of wallets in one transaction,
            or run verifiably fair on-chain raffles — all on BOT Chain's
            sub-second, near-zero fee network.
          </p>
          <div className="hero-actions">
            <Link to="/app" className="btn-primary btn-lg">Get Started →</Link>
            <a href="#features" className="btn-ghost btn-lg">Learn More</a>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-value">2</span>
              <span className="stat-label">Tools</span>
            </div>
            <div className="stat">
              <span className="stat-value">~0.75s</span>
              <span className="stat-label">Block Time</span>
            </div>
            <div className="stat">
              <span className="stat-value">~0</span>
              <span className="stat-label">Gas Fees</span>
            </div>
            <div className="stat">
              <span className="stat-value">Open</span>
              <span className="stat-label">Track</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <div className="section-label">Features</div>
        <h2 className="section-title">Two Tools, One Toolkit</h2>
        <p className="section-desc">Everything you need to move BOT and run on-chain games.</p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">💸</div>
            <h3>Batch Splitter</h3>
            <p>Send native BOT to 100+ recipients in a single transaction. Equal split or custom amounts.</p>
            <ul className="feature-list">
              <li>✓ Equal & custom modes</li>
              <li>✓ Auto-refund remainder</li>
              <li>✓ Perfect for airdrops & payroll</li>
            </ul>
            <Link to="/app" className="feature-cta">Try Splitter →</Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎟️</div>
            <h3>On-Chain Raffle</h3>
            <p>Verifiably fair raffle using blockhash randomness. Create, buy tickets, draw winners.</p>
            <ul className="feature-list">
              <li>✓ No oracle needed</li>
              <li>✓ Weighted odds per entry</li>
              <li>✓ Cancel & refund support</li>
            </ul>
            <Link to="/app" className="feature-cta">Try Raffle →</Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how" id="how">
        <div className="section-label">How It Works</div>
        <h2 className="section-title">Built for BOT Chain</h2>
        <p className="section-desc">Deployed in minutes. No setup overhead.</p>

        <div className="steps">
          <div className="step">
            <span className="step-num">1</span>
            <h4>Connect Wallet</h4>
            <p>MetaMask, WalletConnect, or any EVM wallet. Auto-detects BOT Chain network.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <span className="step-num">2</span>
            <h4>Use the Tools</h4>
            <p>Paste addresses & amounts for the Splitter. Create or buy into raffle tickets instantly.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <span className="step-num">3</span>
            <h4>Confirm on-Chain</h4>
            <p>Every action is a verified transaction on BOT Chain. View on the explorer.</p>
          </div>
        </div>
      </section>

      {/* Contracts */}
      <section className="contracts">
        <div className="section-label">Deployed Contracts</div>
        <h2 className="section-title">Testnet Addresses</h2>
        <div className="contract-cards">
          <div className="contract-card">
            <div className="contract-name">BatchSplitter</div>
            <code className="contract-addr">0xd43C01AA7C040315Cd0Fc9eB6B27130d34180205</code>
            <a href="https://scan.bohr.life/address/0xd43C01AA7C040315Cd0Fc9eB6B27130d34180205" target="_blank" rel="noreferrer" className="contract-link">View on Explorer →</a>
          </div>
          <div className="contract-card">
            <div className="contract-name">Raffle</div>
            <code className="contract-addr">0xbEB798aEE5dA6b2059CafA53a804874F24F6D8f4</code>
            <a href="https://scan.bohr.life/address/0xbEB798aEE5dA6b2059CafA53a804874F24F6D8f4" target="_blank" rel="noreferrer" className="contract-link">View on Explorer →</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>Built for <a href="https://www.botchain.ai" target="_blank" rel="noreferrer">BOT Chain Builder Challenge #1</a></p>
        <p className="footer-links">
          <a href="https://github.com/latest63/bot-chain-toolkit" target="_blank" rel="noreferrer">GitHub</a>
          <span>·</span>
          <a href="https://www.botchain.ai" target="_blank" rel="noreferrer">BOT Chain</a>
          <span>·</span>
          <a href="https://scan.bohr.life" target="_blank" rel="noreferrer">Explorer</a>
        </p>
      </footer>
    </div>
  );
}
