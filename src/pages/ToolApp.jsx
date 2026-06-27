  return (
    <div className="app">
      <div className="app-topbar">
        <Link to="/" className="back-link">← Home</Link>
        <div className="topbar-brand">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{verticalAlign: 'middle', marginRight: 4}}>
            <circle cx="12" cy="12" r="10" stroke="#00D4AA" strokeWidth="2" fill="none"/>
            <circle cx="12" cy="12" r="4" fill="#00D4AA"/>
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#00D4AA" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          BOT Chain Toolkit
        </div>
        {!account ? (
          <button className="btn-connect" onClick={connectWallet}>
            Connect Wallet
          </button>
        ) : (
          <div className="connected">
            <span className="dot"></span>
            {account.slice(0, 6)}...{account.slice(-4)}
          </div>
        )}
      </div>

      {status && <p className="status">{status}</p>}

      <nav className="tabs">
        <button
          className={activeTab === "splitter" ? "tab active" : "tab"}
          onClick={() => setActiveTab("splitter")}
        >
          💸 Batch Splitter
        </button>
        <button
          className={activeTab === "raffle" ? "tab active" : "tab"}
          onClick={() => setActiveTab("raffle")}
        >
          🎟️ Raffle
        </button>
      </nav>

      <main>
        {activeTab === "splitter" && (
          <Splitter
            provider={provider}
            account={account}
            getContract={getSplitterContract}
            setStatus={setStatus}
          />
        )}
        {activeTab === "raffle" && (
          <Raffle
            provider={provider}
            account={account}
            getContract={getRaffleContract}
            setStatus={setStatus}
          />
        )}
      </main>

      <footer className="app-footer">
        <p><a href="https://scan.bohr.life" target="_blank" rel="noreferrer">Explorer</a> · <a href="https://faucet.botchain.ai/basic" target="_blank" rel="noreferrer">Faucet</a> · Built on <a href="https://www.botchain.ai" target="_blank" rel="noreferrer">BOT Chain</a></p>
      </footer>
    </div>
  );
}