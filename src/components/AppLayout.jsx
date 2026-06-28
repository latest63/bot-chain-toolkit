import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { ethers } from "ethers";
import { BOT_CHAIN_CONFIG } from "../contracts";

// Shared wallet context for Tools & History pages
let globalWalletListeners = [];
let globalAccount = null;
let globalProvider = null;
let globalConnecting = false;

export function getGlobalWallet() {
  return { account: globalAccount, provider: globalProvider };
}

export function useWallet() {
  const [wallet, setWallet] = useState({ account: globalAccount, provider: globalProvider });
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    function listener() {
      setWallet({ account: globalAccount, provider: globalProvider });
    }
    globalWalletListeners.push(listener);
    return () => {
      globalWalletListeners = globalWalletListeners.filter(l => l !== listener);
    };
  }, []);

  async function connectWallet() {
    if (!window.ethereum) return;
    if (globalConnecting) return;
    globalConnecting = true;
    setConnecting(true);
    try {
      // Check if already connected
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      let targetAccounts = accounts;
      if (!accounts.length) {
        targetAccounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      }
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
      globalProvider = web3Provider;
      globalAccount = targetAccounts[0];
      globalWalletListeners.forEach(l => l());
    } catch (err) {
      console.error("Wallet connect failed:", err);
    } finally {
      globalConnecting = false;
      setConnecting(false);
    }
  }

  return { wallet, connectWallet, connecting };
}

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { wallet, connectWallet, connecting } = useWallet();

  // Listen for MetaMask account changes
  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        globalAccount = null;
        globalProvider = null;
      } else {
        globalAccount = accounts[0];
        globalProvider = new ethers.BrowserProvider(window.ethereum);
      }
      globalWalletListeners.forEach(l => l());
    };
    const handleChainChanged = () => {
      globalProvider = new ethers.BrowserProvider(window.ethereum);
      globalWalletListeners.forEach(l => l());
    };
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  // Auto-connect on mount if already authorized
  useEffect(() => {
    if (!globalAccount && !globalConnecting && window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then(accounts => {
        if (accounts.length) connectWallet();
      });
    }
  }, []);

  return (
    <div className="app-layout">
      {/* Topbar */}
      <div className="app-topbar">
        <Link to="/" className="topbar-brand">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{verticalAlign: 'middle', marginRight: 4}}>
            <circle cx="12" cy="12" r="10" stroke="#00D4AA" strokeWidth="2" fill="none"/>
            <circle cx="12" cy="12" r="4" fill="#00D4AA"/>
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#00D4AA" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          BOT Chain Toolkit
        </Link>

        {wallet.account ? (
          <div className="topbar-wallet">
            <span className="dot"></span>
            {wallet.account.slice(0, 6)}...{wallet.account.slice(-4)}
          </div>
        ) : (
          <button className="btn-connect" onClick={connectWallet} disabled={connecting}>
            {connecting ? "..." : "Connect"}
          </button>
        )}

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
          <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
          <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
        </button>

        {menuOpen && (
          <>
            <div className="hamburger-overlay" onClick={() => setMenuOpen(false)} />
            <div className="hamburger-menu">
              <Link to="/tools" className={`hamburger-item ${location.pathname.startsWith("/tools") ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
                🛠️ Tools
              </Link>
              <Link to="/history" className={`hamburger-item ${location.pathname === "/history" ? "active" : ""}`} onClick={() => setMenuOpen(false)}>
                📜 History
              </Link>
            </div>
          </>
        )}
      </div>

      <Outlet context={{ wallet, connectWallet }} />
    </div>
  );
}
