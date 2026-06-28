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

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // "batch" | "raffleCreated" | "ticketPurchased"
  const [modalData, setModalData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalTx, setModalTx] = useState(null);

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
                args: ev.args,
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
                args: ev.args,
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

  useEffect(() => {
    if (account && provider) fetchHistory();
  }, [account, provider, filter]);

  // --- Batch detail modal ---
  async function openBatchDetail(txHash) {
    setModalType("batch");
    setModalTx(txHash);
    setModalLoading(true);
    setModalData(null);
    setModalOpen(true);
    try {
      const prov = await provider;
      const tx = await prov.getTransaction(txHash);
      if (!tx || !tx.data) { setModalData([]); setModalLoading(false); return; }

      const iface = new ethers.Interface(BatchSplitterABI);
      let decoded;
      try { decoded = iface.parseTransaction({ data: tx.data, value: tx.value }); }
      catch { setModalData([]); setModalLoading(false); return; }

      if (!decoded) { setModalData([]); setModalLoading(false); return; }

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
      setModalData(recipients);
    } catch (e) {
      console.error(e);
      setModalData([]);
    }
    setModalLoading(false);
  }

  // --- RaffleCreated modal ---
  function openRaffleCreatedDetail(log) {
    setModalType("raffleCreated");
    setModalTx(log.tx);
    setModalData(log);
    setModalLoading(false);
    setModalOpen(true);
  }

  // --- TicketPurchased modal ---
  function openTicketDetail(log) {
    setModalType("ticketPurchased");
    setModalTx(log.tx);
    setModalData(log);
    setModalLoading(false);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setModalType(null);
    setModalData(null);
    setModalTx(null);
  }

  function formatAmount(wei) {
    if (!wei) return "";
    return ethers.formatEther(wei);
  }

  function formatTimestamp(deadline) {
    if (!deadline) return "";
    const d = new Date(Number(deadline) * 1000);
    return d.toLocaleString();
  }

  function isClickable(event) {
    return ["BatchSent", "RaffleCreated", "TicketPurchased"].includes(event);
  }

  function handleClick(log) {
    if (log.event === "BatchSent") openBatchDetail(log.tx);
    else if (log.event === "RaffleCreated") openRaffleCreatedDetail(log);
    else if (log.event === "TicketPurchased") openTicketDetail(log);
  }

  const color = modalData?.args?.color ? `#${modalData.args.color}` : "#00D4AA";

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
                <div key={i} className="history-card"
                     onClick={isClickable(log.event) ? () => handleClick(log) : undefined}
                     style={isClickable(log.event) ? {cursor: "pointer"} : undefined}>
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
                    <div className="history-summary">
                      🎰 Raffle #{log.raffleId}
                      {log.args?.name && ` · ${log.args.name}`}
                      {log.args?.title && ` — ${log.args.title}`}
                    </div>
                  )}
                  {log.event === "TicketPurchased" && log.raffleId && (
                    <div className="history-summary">🎟️ Raffle #{log.raffleId}</div>
                  )}
                  {log.event === "WinnerDrawn" && log.raffleId && (
                    <div className="history-summary">🏆 Raffle #{log.raffleId}</div>
                  )}
                  {log.event === "PrizeClaimed" && log.raffleId && (
                    <div className="history-summary">💰 Raffle #{log.raffleId}</div>
                  )}
                  {log.event === "RaffleCancelled" && log.raffleId && (
                    <div className="history-summary">❌ Raffle #{log.raffleId}</div>
                  )}
                  <a href={`https://scan.bohr.life/tx/${log.tx}`} target="_blank" rel="noreferrer" className="contract-link" onClick={e => e.stopPropagation()}>View Tx →</a>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="section-title" style={{margin: 0}}>
                {modalType === "batch" && "Batch Distribution"}
                {modalType === "raffleCreated" && "Raffle Created"}
                {modalType === "ticketPurchased" && "Ticket Purchased"}
              </h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <div className="modal-body">
              {/* Batch modal */}
              {modalType === "batch" && (
                modalLoading ? (
                  <p className="status" style={{textAlign: "center"}}>Decoding transaction...</p>
                ) : modalData && modalData.length > 0 ? (
                  <div className="recipients-list">
                    <div className="recipient-header">
                      <span>Recipient</span>
                      <span>Amount (BOT)</span>
                    </div>
                    {modalData.map((r, j) => (
                      <div key={j} className="recipient-row">
                        <span className="recipient-addr">{r.address}</span>
                        <span className="recipient-amount">{r.amount}</span>
                      </div>
                    ))}
                    <div className="recipient-total">
                      <span>Total</span>
                      <span>{modalData.reduce((s, r) => s + parseFloat(r.amount), 0).toFixed(4)} BOT</span>
                    </div>
                  </div>
                ) : (
                  <p className="status" style={{textAlign: "center"}}>Could not decode transaction data.</p>
                )
              )}

              {/* RaffleCreated modal */}
              {modalType === "raffleCreated" && modalData && (
                <div className="raffle-detail-modal" style={{"--banner-color": color}}>
                  <div className="raffle-detail-banner" style={{borderLeft: `4px solid ${color}`, background: `linear-gradient(135deg, var(--bg-card), ${color}08)`}}>
                    {modalData.args?.name && <h4 className="banner-name" style={{margin: "0 0 4px"}}>{modalData.args.name}</h4>}
                    {modalData.args?.title && <p className="banner-subtitle" style={{margin: "0 0 8px"}}>{modalData.args.title}</p>}
                    {modalData.args?.community && <span className="banner-community" style={{color, background: `${color}15`}}>{modalData.args.community}</span>}
                  </div>

                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Raffle ID</span>
                      <span className="detail-value">#{modalData.raffleId}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Creator</span>
                      <span className="detail-value detail-addr">{modalData.args?.creator?.slice(0, 6)}...{modalData.args?.creator?.slice(-4)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Ticket Price</span>
                      <span className="detail-value">{formatAmount(modalData.args?.ticketPrice)} BOT</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Max Tickets</span>
                      <span className="detail-value">{Number(modalData.args?.maxTickets) === 0 ? "Unlimited" : Number(modalData.args?.maxTickets)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Entry Deadline</span>
                      <span className="detail-value">{formatTimestamp(modalData.args?.entryDeadline)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Banner Color</span>
                      <span className="detail-value">
                        <span style={{display: "inline-block", width: 12, height: 12, borderRadius: 3, background: color, marginRight: 6, verticalAlign: "middle"}}></span>
                        {color}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TicketPurchased modal */}
              {modalType === "ticketPurchased" && modalData && (
                <div className="raffle-detail-modal">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Raffle ID</span>
                      <span className="detail-value">#{modalData.raffleId}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Buyer</span>
                      <span className="detail-value detail-addr">{modalData.args?.buyer?.slice(0, 6)}...{modalData.args?.buyer?.slice(-4)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Full Address</span>
                      <span className="detail-value detail-addr" style={{fontSize: "0.68rem"}}>{modalData.args?.buyer}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Ticket Number</span>
                      <span className="detail-value">#{modalData.args?.ticketNumber?.toString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <a href={`https://scan.bohr.life/tx/${modalTx}`} target="_blank" rel="noreferrer" className="contract-link">View on Explorer →</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
