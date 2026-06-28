import { useState } from "react";
import { ethers } from "ethers";

export default function Raffle({ provider, account, getContract, setStatus }) {
  const [view, setView] = useState("create"); // "create" or "buy"
  const [loading, setLoading] = useState(false);

  // Create raffle form
  const [raffleName, setRaffleName] = useState("");
  const [raffleTitle, setRaffleTitle] = useState("");
  const [communityName, setCommunityName] = useState("");
  const [raffleColor, setRaffleColor] = useState("#00D4AA");
  const [ticketPrice, setTicketPrice] = useState("");
  const [maxTickets, setMaxTickets] = useState("");
  const [duration, setDuration] = useState("");

  // Buy ticket
  const [raffleId, setRaffleId] = useState("");
  const [fetchedRaffle, setFetchedRaffle] = useState(null);
  const [fetching, setFetching] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    if (!provider || !account) {
      setStatus("❌ Connect wallet first");
      return;
    }
    if (!raffleName.trim()) {
      setStatus("❌ Enter a raffle name");
      return;
    }

    setLoading(true);
    setStatus("⏳ Creating raffle...");

    try {
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      // Strip # from color for on-chain storage
      const colorHex = raffleColor.replace("#", "");

      const tx = await contract.createRaffle(
        raffleName.trim(),
        raffleTitle.trim(),
        communityName.trim(),
        colorHex,
        ethers.parseEther(ticketPrice),
        parseInt(maxTickets) || 0,
        parseInt(duration)
      );

      setStatus(`⏳ TX sent: ${tx.hash}`);
      const receipt = await tx.wait();

      // Get raffle ID from event
      const raffleCreatedLog = receipt.logs.find((l) => {
        try { return contract.interface.parseLog(l)?.name === "RaffleCreated"; } catch { return false; }
      });
      const newId = raffleCreatedLog
        ? Number(contract.interface.parseLog(raffleCreatedLog).args.raffleId)
        : "?";

      setStatus(`✅ Raffle #${newId} created! TX: ${receipt.hash.slice(0, 10)}...`);
      setRaffleName("");
      setRaffleTitle("");
      setCommunityName("");
      setRaffleColor("#00D4AA");
      setTicketPrice("");
      setMaxTickets("");
      setDuration("");
    } catch (err) {
      setStatus(`❌ Failed: ${err.reason || err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleFetchRaffle() {
    if (!raffleId) return;
    if (!provider) {
      setStatus("❌ Connect wallet first");
      return;
    }

    setFetching(true);
    setFetchedRaffle(null);
    setStatus("⏳ Fetching raffle...");

    try {
      const contract = getContract(provider);
      const info = await contract.getRaffle(parseInt(raffleId));
      const isOpen = await contract.isOpen(parseInt(raffleId));

      setFetchedRaffle({
        id: parseInt(raffleId),
        creator: info.creator,
        name: info.name,
        title: info.title,
        community: info.community,
        color: info.color,
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
      setStatus("");
    } catch (err) {
      setStatus(`❌ Raffle #${raffleId} not found or invalid`);
      setFetchedRaffle(null);
    } finally {
      setFetching(false);
    }
  }

  async function handleBuyTicket(e) {
    e.preventDefault();
    if (!provider || !account) {
      setStatus("❌ Connect wallet first");
      return;
    }
    if (!fetchedRaffle) {
      setStatus("❌ Fetch a raffle first");
      return;
    }

    setLoading(true);
    setStatus("⏳ Buying ticket...");

    try {
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      const tx = await contract.buyTicket(fetchedRaffle.id, {
        value: fetchedRaffle.ticketPrice,
      });

      setStatus(`⏳ TX sent: ${tx.hash}`);
      await tx.wait();

      setStatus(`✅ Ticket purchased for Raffle #${fetchedRaffle.id}!`);
      handleFetchRaffle();
    } catch (err) {
      setStatus(`❌ Failed: ${err.reason || err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDraw() {
    if (!fetchedRaffle) return;
    setLoading(true);
    setStatus("⏳ Drawing winner...");

    try {
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      const tx = await contract.drawWinner(fetchedRaffle.id);
      await tx.wait();

      const info = await contract.getRaffle(fetchedRaffle.id);
      setStatus(`🏆 Winner: ${info.winner.slice(0, 6)}...${info.winner.slice(-4)} — Prize: ${ethers.formatEther(info.prizeAmount)} BOT`);
      handleFetchRaffle();
    } catch (err) {
      setStatus(`❌ Failed: ${err.reason || err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleClaim() {
    if (!fetchedRaffle) return;
    setLoading(true);
    setStatus("⏳ Claiming prize...");

    try {
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      const tx = await contract.claimPrize(fetchedRaffle.id);
      await tx.wait();

      setStatus(`✅ Prize claimed!`);
      handleFetchRaffle();
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

  const color = fetchedRaffle?.color ? `#${fetchedRaffle.color}` : "#00D4AA";

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
      </div>

      {view === "create" && (
        <form onSubmit={handleCreate} className="create-raffle-form">
          <div className="form-row">
            <label>
              Raffle Name *
              <input
                type="text"
                placeholder="e.g. Community Airdrop"
                value={raffleName}
                onChange={(e) => setRaffleName(e.target.value)}
                required
              />
            </label>
            <label>
              Title
              <input
                type="text"
                placeholder="e.g. Weekly Giveaway #5"
                value={raffleTitle}
                onChange={(e) => setRaffleTitle(e.target.value)}
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Community Name
              <input
                type="text"
                placeholder="e.g. BOT Builders"
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
              />
            </label>
            <label>
              Banner Color
              <div className="color-picker-row">
                <input
                  type="color"
                  value={raffleColor}
                  onChange={(e) => setRaffleColor(e.target.value)}
                  className="color-input"
                />
                <span className="color-hex">{raffleColor}</span>
              </div>
            </label>
          </div>

          <label>
            Ticket Price (BOT)
            <input
              type="text"
              placeholder="0.1"
              value={ticketPrice}
              onChange={(e) => setTicketPrice(e.target.value)}
            />
          </label>

          <div className="form-row">
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
          </div>

          <button className="btn submit" type="submit" disabled={loading}>
            {loading ? "⏳ Creating..." : "🎰 Create Raffle"}
          </button>
        </form>
      )}

      {view === "buy" && (
        <div className="buy-section">
          <div className="fetch-row">
            <input
              type="number"
              placeholder="Enter Raffle ID"
              value={raffleId}
              onChange={(e) => { setRaffleId(e.target.value); setFetchedRaffle(null); }}
              className="fetch-input"
            />
            <button
              className="btn fetch"
              onClick={handleFetchRaffle}
              disabled={fetching || !raffleId}
            >
              {fetching ? "⏳" : "🔍 Fetch"}
            </button>
          </div>

          {fetchedRaffle && (
            <div
              className="raffle-banner"
              style={{
                "--banner-color": color,
                "--banner-glow": color + "33",
              }}
            >
              <div className="banner-header">
                <div className="banner-title-area">
                  <span className="banner-id">#{fetchedRaffle.id}</span>
                  {fetchedRaffle.name && (
                    <h3 className="banner-name">{fetchedRaffle.name}</h3>
                  )}
                  {fetchedRaffle.title && (
                    <p className="banner-subtitle">{fetchedRaffle.title}</p>
                  )}
                  {fetchedRaffle.community && (
                    <span className="banner-community">{fetchedRaffle.community}</span>
                  )}
                </div>
                <span className={`badge ${fetchedRaffle.isOpen ? "open" : fetchedRaffle.drawn ? "done" : "closed"}`}>
                  {fetchedRaffle.isOpen ? "🟢 Open" : fetchedRaffle.drawn ? "🏆 Drawn" : fetchedRaffle.cancelled ? "❌ Cancelled" : "⏰ Closed"}
                </span>
              </div>

              <div className="banner-stats">
                <div className="stat">
                  <span className="stat-label">Ticket Price</span>
                  <span className="stat-value">{ethers.formatEther(fetchedRaffle.ticketPrice)} BOT</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Tickets Sold</span>
                  <span className="stat-value">{fetchedRaffle.ticketCount}{fetchedRaffle.maxTickets > 0 ? ` / ${fetchedRaffle.maxTickets}` : ""}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Prize Pool</span>
                  <span className="stat-value">{ethers.formatEther(fetchedRaffle.totalCollected)} BOT</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Status</span>
                  <span className="stat-value">
                    {fetchedRaffle.isOpen
                      ? `⏰ ${formatTimeleft(fetchedRaffle.entryDeadline)}`
                      : fetchedRaffle.drawn
                      ? "Drawn"
                      : "Closed"}
                  </span>
                </div>
              </div>

              {fetchedRaffle.drawn && fetchedRaffle.winner !== ethers.ZeroAddress && (
                <div className="banner-winner">
                  🏆 Winner: {fetchedRaffle.winner.slice(0, 6)}...{fetchedRaffle.winner.slice(-4)}
                </div>
              )}

              <div className="banner-actions">
                {fetchedRaffle.isOpen && (
                  <button className="btn submit" onClick={handleBuyTicket} disabled={loading}>
                    {loading ? "⏳ Buying..." : "🎟️ Buy Ticket"}
                  </button>
                )}

                {!fetchedRaffle.drawn && !fetchedRaffle.cancelled && !fetchedRaffle.isOpen &&
                  fetchedRaffle.creator.toLowerCase() === account?.toLowerCase() && (
                    <button className="btn submit" onClick={handleDraw} disabled={loading}>
                      🎲 Draw Winner
                    </button>
                  )}

                {fetchedRaffle.drawn &&
                  fetchedRaffle.winner.toLowerCase() === account?.toLowerCase() &&
                  fetchedRaffle.prizeAmount > 0n && (
                    <button className="btn submit prize" onClick={handleClaim} disabled={loading}>
                      💰 Claim Prize
                    </button>
                  )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
