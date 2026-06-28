import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { ethers } from "ethers";
import { CONTRACTS, BatchSplitterABI, RaffleABI } from "../contracts";

const EVENTS = {
  splitter: [
    { name: "BatchSent", desc: "Batch distribution" },
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
  const { wallet } = useOutletContext();
  const { account, provider } = wallet;
  const [filter, setFilter] = useState("all");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailTx, setDetailTx] = useState(null); // tx hash for modal
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function fetchHistory() {
    if (!provider) return;
    setLoading(true); setError("");
    const prov = await provider;
    const signer = await prov.getSigner();
    const splitter = new ethers.Contract(CONTRACTS.batchSplitter, BatchSplitterABI, signer);
    const raffle = new ethers.Contract(CONTRACTS.raffle, RaffleABI, signer);
    const userAddr = await signer.getAddress();
    const results = [];

    if (filter === "all" || filter === "splitter") {
      for (const { name } of EVENTS.splitter) {
        try {
          const eventFilter = splitter.filters[name];
          const events = await splitter.queryFilter(eventFilter, 0, "latest");
          for (const ev of events) {
            if (ev.args?.sender?.toLowerCase() === userAddr.toLowerCase()) {
              results.push({
                tool: "BatchSplitter",
                event: name,
                block: ev.blockNumber,
                tx: ev.transactionHash,
                recipientCount: ev.args.recipientCount?.toString(),
                totalAmount: ev.args.totalAmount?.toString(),
              });
            }
          }
        } catch (e) { console.error(e); }
      }
    }

    if (filter === "all" || filter === "raffle") {
      for (const { name } of EVENTS.raffle) {
        try {
          const eventFilter = raffle.filters[name];
          const events = await raffle.queryFilter(eventFilter, 0, "latest");
          for (const ev of events) {
            if (ev.args?.creator?.toLowerCase() === userAddr.toLowerCase() ||
                ev.args?.buyer?.toLowerCase() === userAddr.toLowerCase() ||
                ev.args?.winner?.toLowerCase() === userAddr.toLowerCase()) {
              results.push({
                tool: "Raffle",
                event: name,
                block: ev.blockNumber,
                tx: ev.transactionHash,
                raffleId: ev.args?.raffleId?.toString(),
              });
            }
          }
        } catch (e) { console.error(e); }
      }
    }

    results.sort((a, b) => b.block - a.block);
    setLogs(results.slice(0, 50));
    setLoading(false);
    if (!results.length) setError("No events found for your address");
  }

  // Auto-fetch on mount & when filter changes
  useEffect(() => {
    if (account && provider) fetchHistory();
  }, [account, provider, filter]);

  async function openBatchDetail(txHash) {
    setDetailTx(txHash);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const prov = await provider;
      const tx = await prov.getTransaction(txHash);
      if (!tx || !tx.data) { setDetailData([]); setDetailLoading(false); return; }

      // Try to decode as splitCustom or splitEqually
      const iface = new ethers.Interface(BatchSplitterABI);
      let decoded;
      try {
        decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
      } catch {
        setDetailData([]); setDetailLoading(false); return;
      }

      if (!decoded) { setDetailData([]); setDetailLoading(false); return; }

      const recipients = [];
      if (decoded.name === "splitEqually") {
        const addrs = decoded.args.recipients;
        if (addrs.length > 0) {
          const amount = tx.value / BigInt(addrs.length);
          for (let i = 0; i < addrs.length; i++) {
            recipients.push({ address: addrs[i], amount: ethers.formatEther(amount) });
          }
        }
      } else if (decoded.name === "splitCustom") {
        const addrs = decoded.args.recipients;
        const amounts = decoded.args.amounts;
        for (let i = 0; i < addrs.length; i++) {
          recipients.push({ address: addrs[i], amount: ethers.formatEther(amounts[i]) });
        }
      }

      setDetailData(recipients);
    } catch (e) {
      console.error(e);
      setDetailData([]);
    }
    setDetailLoading(false);
  }

  function formatAmount(wei) {
    if (!wei) return "";
    return ethers.formatEther(wei);
  }

  return (
    <div className="history-page">
      <h2 className="section-title">On-Chain History</h2>
      <p className="section-desc">Your past transactions on the Splitter and Raffle contracts.</p>

      {!account ? (
        <div className="app-welcome" style={{paddingTop: 0}}>
          <p className="section-title">Connect Your Wallet</p>
          <p className="section-desc">Connect to view your transaction history.</p>
        </div>
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
            {loading && <span className="status" style={{margin: 0, flex: 1}}>Loading...</span>}
          </div>

          {error && !loading && <p className="status">{error}</p>}

          {logs.length > 0 && !loading && (
            <div className="history-list">
              {logs.map((log, i) => (
                <div key={i} className="history-card" onClick={log.event === "BatchSent" ? () => openBatchDetail(log.tx) : undefined}
                     style={log.event === "BatchSent" ? {cursor: "pointer"} : undefined}>
                  <div className="history-meta">
                    <span className={`history-tool ${log.tool === "BatchSplitter" ? "tag-splitter" : "tag-raffle"}`}>{log.tool}</span>
                    <span className="history-event">{log.event}</span>
                    <span className="history-block">Block #{log.block}</span>
                  </div>
                  {log.event === "BatchSent" && (
                    <div className="history-summary">
                      📦 {log.recipientCount} recipients · {formatAmount(log.totalAmount)} BOT total
                    </div>
                  )}
                  {log.event === "RaffleCreated" && log.raffleId && (
                    <div className="history-summary">Raffle #{log.raffleId}</div>
                  )}
                  {log.event === "TicketPurchased" && log.raffleId && (
                    <div className="history-summary">Raffle #{log.raffleId}</div>
                  )}
                  {log.event === "WinnerDrawn" && log.raffleId && (
                    <div className="history-summary">Raffle #{log.raffleId}</div>
                  )}
                  {log.event === "PrizeClaimed" && log.raffleId && (
                    <div className="history-summary">Raffle #{log.raffleId}</div>
                  )}
                  <a href={`https://scan.bohr.life/tx/${log.tx}`} target="_blank" rel="noreferrer" className="contract-link" onClick={e => e.stopPropagation()}>View Tx →</a>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Batch Detail Modal */}
      {detailTx && (
        <div className="modal-overlay" onClick={() => { setDetailTx(null); setDetailData(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="section-title" style={{margin: 0}}>Batch Distribution</h3>
              <button className="modal-close" onClick={() => { setDetailTx(null); setDetailData(null); }}>✕</button>
            </div>
            <div className="modal-body">
              {detailLoading ? (
                <p className="status" style={{textAlign: "center"}}>Decoding transaction...</p>
              ) : detailData && detailData.length > 0 ? (
                <div className="recipients-list">
                  <div className="recipient-header">
                    <span>Recipient</span>
                    <span>Amount (BOT)</span>
                  </div>
                  {detailData.map((r, j) => (
                    <div key={j} className="recipient-row">
                      <span className="recipient-addr">{r.address}</span>
                      <span className="recipient-amount">{r.amount}</span>
                    </div>
                  ))}
                  <div className="recipient-total">
                    <span>Total</span>
                    <span>{detailData.reduce((s, r) => s + parseFloat(r.amount), 0).toFixed(4)} BOT</span>
                  </div>
                </div>
              ) : (
                <p className="status" style={{textAlign: "center"}}>Could not decode transaction data.</p>
              )}
            </div>
            <div className="modal-footer">
              <a href={`https://scan.bohr.life/tx/${detailTx}`} target="_blank" rel="noreferrer" className="contract-link">View on Explorer →</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
