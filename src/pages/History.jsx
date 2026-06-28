import { useState } from "react";
import { ethers } from "ethers";
import { BOT_CHAIN_CONFIG, CONTRACTS, BatchSplitterABI, RaffleABI } from "../contracts";

const EVENTS = {
  splitter: [
    { name: "BatchSent", desc: "Batch distribution sent" },
    { name: "IndividualSent", desc: "Individual transfer sent" },
  ],
  raffle: [
    { name: "RaffleCreated", desc: "New raffle created" },
    { name: "TicketPurchased", desc: "Ticket bought" },
    { name: "WinnerDrawn", desc: "Winner drawn" },
    { name: "PrizeClaimed", desc: "Prize claimed" },
    { name: "RaffleCancelled", desc: "Raffle cancelled" },
  ],
};

export default function History() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [filter, setFilter] = useState("all");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function connect() {
    if (!window.ethereum) { setError("❌ Install MetaMask"); return; }
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BOT_CHAIN_CONFIG.chainId }] });
    } catch (e) {
      if (e.code === 4902) await window.ethereum.request({ method: "wallet_addEthereumChain", params: [BOT_CHAIN_CONFIG] });
    }
    setProvider(new ethers.BrowserProvider(window.ethereum));
    setAccount(accounts[0]);
  }

  async function fetchHistory() {
    if (!provider) { setError("Connect wallet first"); return; }
    setLoading(true); setError(""); setLogs([]);

    const prov = await provider;
    const signer = await prov.getSigner();
    const splitter = new ethers.Contract(CONTRACTS.batchSplitter, BatchSplitterABI, signer);
    const raffle = new ethers.Contract(CONTRACTS.raffle, RaffleABI, signer);
    const userAddr = await signer.getAddress();
    const results = [];

    if (filter === "all" || filter === "splitter") {
      for (const { name } of EVENTS.splitter) {
        try {
          const events = await splitter.queryFilter(splitter.filters[name], 0, "latest");
          for (const ev of events) {
            if (ev.args?.sender?.toLowerCase() === userAddr.toLowerCase()) {
              results.push({ tool: "BatchSplitter", event: name, block: ev.blockNumber, tx: ev.transactionHash, args: [...ev.args] });
            }
          }
        } catch {}
      }
    }

    if (filter === "all" || filter === "raffle") {
      for (const { name } of EVENTS.raffle) {
        try {
          const events = await raffle.queryFilter(raffle.filters[name], 0, "latest");
          const evName = name;
          const eventFilter = raffle.filters[name];
          const evts = await raffle.queryFilter(eventFilter, 0, "latest");
          for (const ev of evts) {
            if (ev.args?.creator?.toLowerCase() === userAddr.toLowerCase() ||
                ev.args?.buyer?.toLowerCase() === userAddr.toLowerCase() ||
                ev.args?.winner?.toLowerCase() === userAddr.toLowerCase()) {
              results.push({
                tool: "Raffle",
                event: evName,
                block: ev.blockNumber,
                tx: ev.transactionHash,
                args: [...ev.args],
                raffleId: ev.args?.raffleId?.toString(),
              });
            }
          }
        } catch {}
      }
    }

    results.sort((a, b) => b.block - a.block);
    setLogs(results.slice(0, 50));
    setLoading(false);
    if (!results.length) setError("No events found for your address");
  }

  return (
    <div className="history-page">
      <h2 className="section-title">On-Chain History</h2>
      <p className="section-desc">Browse your past transactions on the Splitter and Raffle contracts.</p>

      {!account ? (
        <button className="btn-primary" onClick={connect}>Connect Wallet</button>
      ) : (
        <>
          <div className="history-controls">
            <div className="history-filter">
              {["all", "splitter", "raffle"].map(f => (
                <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <button className="btn-primary" onClick={fetchHistory} disabled={loading}>
              {loading ? "Loading..." : "Fetch History"}
            </button>
          </div>

          <p className="connected-info">Wallet: {account.slice(0, 6)}...{account.slice(-4)}</p>

          {error && <p className="status">{error}</p>}

          {logs.length > 0 && (
            <div className="history-list">
              {logs.map((log, i) => (
                <div key={i} className="history-card">
                  <div className="history-meta">
                    <span className={`history-tool ${log.tool === "BatchSplitter" ? "tag-splitter" : "tag-raffle"}`}>{log.tool}</span>
                    <span className="history-event">{log.event}</span>
                    <span className="history-block">Block #{log.block}</span>
                  </div>
                  <div className="history-args">
                    {log.args.map((arg, j) => (
                      <span key={j} className="history-arg">{arg?.toString?.()?.slice(0, 42) || String(arg)}</span>
                    ))}
                  </div>
                  <a href={`https://scan.bohr.life/tx/${log.tx}`} target="_blank" rel="noreferrer" className="contract-link">View Tx →</a>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
