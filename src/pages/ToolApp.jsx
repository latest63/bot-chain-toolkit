import { useState } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { BOT_CHAIN_CONFIG, CONTRACTS, BatchSplitterABI, RaffleABI } from "../contracts";
import Splitter from "../components/Splitter";
import Raffle from "../components/Raffle";
import "../App.css";

export default function ToolApp() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [activeTab, setActiveTab] = useState("splitter");
  const [status, setStatus] = useState("");

  async function connectWallet() {
    if (!window.ethereum) {
      setStatus("❌ Please install MetaMask or a Web3 wallet");
      return;
    }
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: BOT_CHAIN_CONFIG.chainId }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [BOT_CHAIN_CONFIG],
          });
        }
      }
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);
      setAccount(accounts[0]);
      setStatus(`✅ Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
    } catch (err) {
      setStatus(`❌ Connection failed: ${err.message}`);
    }
  }

  function getSplitterContract(signer) {
    return new ethers.Contract(CONTRACTS.batchSplitter, BatchSplitterABI, signer);
  }

  function getRaffleContract(signer) {
    return new ethers.Contract(CONTRACTS.raffle, RaffleABI, signer);
  }

  return (
    <div className="app">
      <div className="app-topbar">
        <Link to="/" className="topbar-brand">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{verticalAlign: 'middle', marginRight: 4}}>
            <circle cx="12" cy="12" r="10" stroke="#00D4AA" strokeWidth="2" fill="none"/>
            <circle cx="12" cy="12" r="4" fill="#00D4AA"/>
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#00D4AA" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          BOT Chain Toolkit
        </Link>
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
        <p className="footer-built"><span className="badge-logo-wrapper"><img src="/botchain-logo.png" alt="" className="badge-logo" /></span> <a href="https://scan.bohr.life" target="_blank" rel="noreferrer">Explorer</a> · <a href="https://faucet.botchain.ai/basic" target="_blank" rel="noreferrer">Faucet</a> · Built on <a href="https://www.botchain.ai" target="_blank" rel="noreferrer">BOT Chain</a></p>
      </footer>
    </div>
  );
}
