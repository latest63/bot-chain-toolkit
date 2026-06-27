import { useState } from "react";
import { ethers } from "ethers";

export default function Splitter({ provider, account, getContract, setStatus }) {
  const [mode, setMode] = useState("equal"); // "equal" or "custom"
  const [recipients, setRecipients] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [customRows, setCustomRows] = useState([{ address: "", amount: "" }]);
  const [loading, setLoading] = useState(false);

  function addRow() {
    setCustomRows([...customRows, { address: "", amount: "" }]);
  }

  function removeRow(idx) {
    setCustomRows(customRows.filter((_, i) => i !== idx));
  }

  function updateRow(idx, field, value) {
    const updated = [...customRows];
    updated[idx][field] = value;
    setCustomRows(updated);
  }

  async function handleSplitEqually(e) {
    e.preventDefault();
    if (!provider || !account) {
      setStatus("❌ Connect wallet first");
      return;
    }

    const addrs = recipients
      .split(/[\n,]+/)
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    if (addrs.length === 0) {
      setStatus("❌ Enter at least one recipient");
      return;
    }

    // Validate addresses
    for (const addr of addrs) {
      if (!ethers.isAddress(addr)) {
        setStatus(`❌ Invalid address: ${addr}`);
        return;
      }
    }

    setLoading(true);
    setStatus("⏳ Sending transaction...");

    try {
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      const tx = await contract.splitEqually(addrs, {
        value: ethers.parseEther(totalAmount),
      });

      setStatus(`⏳ TX sent: ${tx.hash}`);
      const receipt = await tx.wait();

      setStatus(
        `✅ Sent ${totalAmount} BOT to ${addrs.length} recipients! TX: ${receipt.hash.slice(0, 10)}...`
      );
      setRecipients("");
      setTotalAmount("");
    } catch (err) {
      setStatus(`❌ Failed: ${err.reason || err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSplitCustom(e) {
    e.preventDefault();
    if (!provider || !account) {
      setStatus("❌ Connect wallet first");
      return;
    }

    const validRows = customRows.filter(
      (r) => r.address.trim() && r.amount.trim()
    );

    if (validRows.length === 0) {
      setStatus("❌ Add at least one recipient");
      return;
    }

    for (const row of validRows) {
      if (!ethers.isAddress(row.address.trim())) {
        setStatus(`❌ Invalid address: ${row.address.trim()}`);
        return;
      }
    }

    const addrs = validRows.map((r) => r.address.trim());
    const amounts = validRows.map((r) => ethers.parseEther(r.amount));
    const total = amounts.reduce((sum, a) => sum + a, 0n);

    setLoading(true);
    setStatus("⏳ Sending transaction...");

    try {
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      const tx = await contract.splitCustom(addrs, amounts, {
        value: total,
      });

      setStatus(`⏳ TX sent: ${tx.hash}`);
      const receipt = await tx.wait();

      setStatus(
        `✅ Sent to ${addrs.length} recipients with custom amounts! TX: ${receipt.hash.slice(0, 10)}...`
      );
      setCustomRows([{ address: "", amount: "" }]);
    } catch (err) {
      setStatus(`❌ Failed: ${err.reason || err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="splitter">
      <div className="mode-toggle">
        <button
          className={mode === "equal" ? "active" : ""}
          onClick={() => setMode("equal")}
        >
          Equal Split
        </button>
        <button
          className={mode === "custom" ? "active" : ""}
          onClick={() => setMode("custom")}
        >
          Custom Amounts
        </button>
      </div>

      {mode === "equal" ? (
        <form onSubmit={handleSplitEqually}>
          <label>
            Recipients (one address per line or comma-separated)
            <textarea
              rows={5}
              placeholder={`0xABC...\n0xDEF...\n0x123...`}
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
            />
          </label>

          <label>
            Total Amount (BOT)
            <input
              type="text"
              placeholder="1.0"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
            />
          </label>

          <p className="hint">
            {recipients.split(/[\n,]+/).filter((a) => a.trim()).length > 0
              ? `Each recipient gets ~${(
                  parseFloat(totalAmount || 0) /
                  recipients.split(/[\n,]+/).filter((a) => a.trim()).length
                ).toFixed(6)} BOT`
              : "Enter recipients to see per-person amount"}
          </p>

          <button className="btn submit" type="submit" disabled={loading}>
            {loading ? "⏳ Sending..." : "💸 Split Equally"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSplitCustom}>
          {customRows.map((row, idx) => (
            <div key={idx} className="custom-row">
              <input
                type="text"
                placeholder="Recipient address"
                value={row.address}
                onChange={(e) => updateRow(idx, "address", e.target.value)}
              />
              <input
                type="text"
                placeholder="Amount (BOT)"
                value={row.amount}
                onChange={(e) => updateRow(idx, "amount", e.target.value)}
              />
              {customRows.length > 1 && (
                <button
                  type="button"
                  className="btn remove"
                  onClick={() => removeRow(idx)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <button type="button" className="btn add" onClick={addRow}>
            + Add Recipient
          </button>

          <button className="btn submit" type="submit" disabled={loading}>
            {loading ? "⏳ Sending..." : "💸 Send Custom Amounts"}
          </button>
        </form>
      )}
    </div>
  );
}
