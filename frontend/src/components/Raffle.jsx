import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function Raffle({ provider, account, getContract, setStatus }) {
  const [view, setView] = useState("create"); // "create", "buy", "manage"
  const [raffles, setRaffles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Create raffle form
  const [ticketPrice, setTicketPrice] = useState("");
  const [maxTickets, setMaxTickets] = useState("");
  const [duration, setDuration] = useState("");

  // Buy ticket form
  const [raffleId, setRaffleId] = useState("");

  // Load raffles on mount
  useEffect(() => {
    if (provider && account) loadRaffles();
  }, [provider, account]);

  async function loadRaffles() {
    if (!provider) return;

    try {
      const contract = getContract(provider);
      const counter = await contract.raffleCounter();
      const count = Number(counter);

      const items = [];
      for (let i = 1; i <= count; i++) {
        try {
          const info = await contract.getRaffle(i);
          const isOpen = await contract.isOpen(i);
          items.push({
            id: i,
            creator: info.creator,
            ticketPrice: info.ticketPrice,
            maxTickets: Number(info.maxTickets),
            totalCollected: info.totalCollected,
            ticketCount: Number(info.ticketCount),
            entryDeadline: Number(info.entryDeadline),
            winner: info.winner,
            prizeAmount: info.prizeAmount,
            drawn: info.drawn,
            cancelled: info.cancelled,
            isOpen,
          });
        } catch (e) {
          // Skip invalid raffles
        }
      }
      setRaffles(items.reverse());
    } catch (err) {
      console.error("Failed to load raffles:", err);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!provider || !account) {
      setStatus("❌ Connect wallet first");
      return;
    }

    setLoading(true);
    setStatus("⏳ Creating raffle...");

    try {
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      const tx = await contract.createRaffle(
        ethers.parseEther(ticketPrice),
        parseInt(maxTickets) || 0,
        parseInt(duration)
      );

      setStatus(`⏳ TX sent: ${tx.hash}`);
      const receipt = await tx.wait();

      setStatus(`✅ Raffle created! TX: ${receipt.hash.slice(0, 10)}...`);
      setTicketPrice("");
      setMaxTickets("");
      setDuration("");
      loadRaffles();
    } catch (err) {
      setStatus(`❌ Failed: ${err.reason || err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleBuyTicket(e) {
    e.preventDefault();
    if (!provider || !account) {
      setStatus("❌ Connect wallet first");
      return;
    }

    setLoading(true);
    setStatus("⏳ Buying ticket...");

    try {
      const signer = await provider.getSigner();
      const contract = getContract(signer);
      const raffle = await contract.getRaffle(parseInt(raffleId));

      const tx = await contract.buyTicket(parseInt(raffleId), {
        value: raffle.ticketPrice,
      });

      setStatus(`⏳ TX sent: ${tx.hash}`);
      await tx.wait();

      setStatus(`✅ Ticket purchased for Raffle #${raffleId}!`);
      setRaffleId("");
      loadRaffles();
    } catch (err) {
      setStatus(`❌ Failed: ${err.reason || err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDraw(id) {
    setLoading(true);
    setStatus("⏳ Drawing winner...");

    try {
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      const tx = await contract.drawWinner(id);
      await tx.wait();

      const info = await contract.getRaffle(id);
      setStatus(`🏆 Winner: ${info.winner.slice(0, 6)}...${info.winner.slice(-4)} — Prize: ${ethers.formatEther(info.prizeAmount)} BOT`);
      loadRaffles();
    } catch (err) {
      setStatus(`❌ Failed: ${err.reason || err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleClaim(id) {
    setLoading(true);
    setStatus("⏳ Claiming prize...");

    try {
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      const tx = await contract.claimPrize(id);
      await tx.wait();

      setStatus(`✅ Prize claimed!`);
      loadRaffles();
    } catch (err) {
      setStatus(`❌ Failed: ${err.reason || err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function formatTimeleft(deadline) {
    const now = Math.floor(Date.now() / 1000);
    const diff = deadline - now;
    if (diff <= 0) return "Ended";
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
  }

  return (
    <div className="raffle">
      <div className="mode-toggle">
        <button
          className={view === "create" ? "active" : ""}
          onClick={() => setView("create")}
        >
          🎰 Create
        </button>
        <button
          className={view === "buy" ? "active" : ""}
          onClick={() => setView("buy")}
        >
          🎟️ Buy Ticket
        </button>
        <button
          className={view === "manage" ? "active" : ""}
          onClick={() => setView("manage")}
        >
          📋 Browse
        </button>
      </div>

      {view === "create" && (
        <form onSubmit={handleCreate}>
          <label>
            Ticket Price (BOT)
            <input
              type="text"
              placeholder="0.1"
              value={ticketPrice}
              onChange={(e) => setTicketPrice(e.target.value)}
            />
          </label>

          <label>
            Max Tickets (0 = unlimited)
            <input
              type="number"
              placeholder="100"
              value={maxTickets}
              onChange={(e) => setMaxTickets(e.target.value)}
            />
          </label>

          <label>
            Duration (seconds)
            <input
              type="number"
              placeholder="3600"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </label>

          <button className="btn submit" type="submit" disabled={loading}>
            {loading ? "⏳ Creating..." : "🎰 Create Raffle"}
          </button>
        </form>
      )}

      {view === "buy" && (
        <form onSubmit={handleBuyTicket}>
          <label>
            Raffle ID
            <input
              type="number"
              placeholder="1"
              value={raffleId}
              onChange={(e) => setRaffleId(e.target.value)}
            />
          </label>

          {raffleId && raffles.find((r) => r.id === parseInt(raffleId)) && (
            <div className="raffle-preview">
              {(() => {
                const r = raffles.find((r) => r.id === parseInt(raffleId));
                return (
                  <>
                    <p>💰 Ticket Price: {ethers.formatEther(r.ticketPrice)} BOT</p>
                    <p>🎟️ Tickets Sold: {r.ticketCount}{r.maxTickets > 0 ? ` / ${r.maxTickets}` : ""}</p>
                    <p>🏦 Prize Pool: {ethers.formatEther(r.totalCollected)} BOT</p>
                    <p>⏰ {r.isOpen ? `Closes in ${formatTimeleft(r.entryDeadline)}` : r.drawn ? "Drawn" : "Closed"}</p>
                  </>
                );
              })()}
            </div>
          )}

          <button className="btn submit" type="submit" disabled={loading}>
            {loading ? "⏳ Buying..." : "🎟️ Buy Ticket"}
          </button>
        </form>
      )}

      {view === "manage" && (
        <div className="raffle-list">
          {raffles.length === 0 ? (
            <p className="empty">No raffles yet. Create one!</p>
          ) : (
            raffles.map((r) => (
              <div
                key={r.id}
                className={`raffle-card ${r.cancelled ? "cancelled" : ""} ${r.drawn ? "drawn" : ""}`}
              >
                <div className="card-header">
                  <span className="raffle-id">#{r.id}</span>
                  <span className={`badge ${r.isOpen ? "open" : r.drawn ? "done" : "closed"}`}>
                    {r.isOpen ? "🟢 Open" : r.drawn ? "🏆 Drawn" : r.cancelled ? "❌ Cancelled" : "⏰ Closed"}
                  </span>
                </div>

                <div className="card-body">
                  <p>💰 {ethers.formatEther(r.ticketPrice)} BOT / ticket</p>
                  <p>🎟️ {r.ticketCount} tickets{r.maxTickets > 0 ? ` / ${r.maxTickets}` : ""}</p>
                  <p>🏦 Pool: {ethers.formatEther(r.totalCollected)} BOT</p>

                  {r.isOpen && <p>⏰ Closes in {formatTimeleft(r.entryDeadline)}</p>}

                  {r.drawn && r.winner !== ethers.ZeroAddress && (
                    <p className="winner">
                      🏆 Winner: {r.winner.slice(0, 6)}...{r.winner.slice(-4)}
                    </p>
                  )}
                </div>

                <div className="card-actions">
                  {r.isOpen && (
                    <button
                      className="btn small"
                      onClick={() => { setRaffleId(String(r.id)); setView("buy"); }}
                    >
                      🎟️ Buy Ticket
                    </button>
                  )}

                  {!r.drawn && !r.cancelled && !r.isOpen &&
                    r.creator.toLowerCase() === account?.toLowerCase() && (
                      <button
                        className="btn small"
                        onClick={() => handleDraw(r.id)}
                        disabled={loading}
                      >
                        🎲 Draw Winner
                      </button>
                    )}

                  {r.drawn &&
                    r.winner.toLowerCase() === account?.toLowerCase() &&
                    r.prizeAmount > 0n && (
                      <button
                        className="btn small prize"
                        onClick={() => handleClaim(r.id)}
                        disabled={loading}
                      >
                        💰 Claim Prize
                      </button>
                    )}
                </div>
              </div>
            ))
          )}
          <button className="btn refresh" onClick={loadRaffles}>
            🔄 Refresh
          </button>
        </div>
      )}
    </div>
  );
}
