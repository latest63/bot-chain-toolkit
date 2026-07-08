import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ethers } from "ethers";
import { CONTRACTS, BatchSplitterABI, RaffleABI } from "../contracts";
import Splitter from "../components/Splitter";
import Raffle from "../components/Raffle";
import "../App.css";

export default function ToolApp() {
  const { wallet, connectWallet } = useOutletContext();
  const { account, provider } = wallet;
  const [activeTab, setActiveTab] = useState("splitter");
  const [status, setStatus] = useState("");

  function getSplitterContract(signer) {
    return new ethers.Contract(CONTRACTS.batchSplitter, BatchSplitterABI, signer);
  }

  function getRaffleContract(signer) {
    return new ethers.Contract(CONTRACTS.raffle, RaffleABI, signer);
  }

  return (
    <div className="app">
      {!account ? (
        <div className="app-welcome">
          <p className="section-title">Connect Your Wallet</p>
          <p className="section-desc">Connect your wallet to start using the Batch Splitter and Raffle tools.</p>
          <button className="btn-primary btn-lg" onClick={connectWallet}>
            Connect Wallet
          </button>
        </div>
      ) : (
        <>
          {status && <p className="status">{status}</p>}

          <div className="connected-bar">
            <span className="dot"></span>
            {account.slice(0, 6)}...{account.slice(-4)}
          </div>

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
            <p className="footer-built">
              <span className="badge-logo-wrapper"><img src="/botchain-logo.png" alt="" className="badge-logo" /></span>
              <a href="https://scan.botchain.ai" target="_blank" rel="noreferrer">Explorer</a> · <a href="https://faucet.botchain.ai/basic" target="_blank" rel="noreferrer">Faucet</a> · Built on <a href="https://www.botchain.ai" target="_blank" rel="noreferrer">BOT Chain</a>
            </p>
          </footer>
        </>
      )}
    </div>
  );
}
