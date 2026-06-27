import { useState } from "react";
import { ethers } from "ethers";
import { BOT_CHAIN_CONFIG, CONTRACTS, BatchSplitterABI, RaffleABI } from "./contracts";
import Splitter from "./components/Splitter";
import Raffle from "./components/Raffle";
import "./App.css";

function App() {
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
      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      // Switch to BOT Chain
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: BOT_CHAIN_CONFIG.chainId }],
        });
      } catch (switchError) {
        // Chain not added, add it
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
      <header>
        <h1>🔧 BOT Chain Toolkit</h1>
        <p className="subtitle">Batch Splitter & On-Chain Raffle</p>

        {!account ? (
          <button className="btn connect" onClick={connectWallet}>
            Connect Wallet
          </button>
        ) : (
          <div className="connected">
            <span className="dot"></span>
            {account.slice(0, 6)}...{account.slice(-4)}
          </div>
        )}

        {status && <p className="status">{status}</p>}
      </header>

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
        {!CONTRACTS.batchSplitter && !CONTRACTS.raffle ? (
          <div className="placeholder">
            <h2>⏳ Contracts Not Deployed Yet</h2>
            <p>Deploy the contracts to BOT Chain testnet first, then update the addresses in <code>src/contracts.js</code>.</p>
            <div className="deploy-info">
              <code>forge script script/Deploy.s.sol --rpc-url botchain_testnet --broadcast --verify</code>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </main>

      <footer>
        <p>
          Built on <a href="https://www.botchain.ai" target="_blank">BOT Chain</a> ·{" "}
          <a href="https://scan.bohr.life" target="_blank">Explorer</a> ·{" "}
          <a href="https://faucet.botchain.ai/basic" target="_blank">Faucet</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
