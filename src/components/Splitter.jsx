import { useState, useRef } from "react";
import { ethers } from "ethers";
import * as XLSX from "xlsx";

export default function Splitter({ provider, account, getContract, setStatus }) {
  const [mode, setMode] = useState("equal"); // "equal" or "custom"
  const [recipients, setRecipients] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [customRows, setCustomRows] = useState([{ address: "", amount: "" }]);
  const [loading, setLoading] = useState(false);

  // Spreadsheet state
  const [sheetData, setSheetData] = useState(null); // parsed rows array
  const [headers, setHeaders] = useState([]); // column names
  const [selectedColumn, setSelectedColumn] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef(null);

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });

        if (!json.length) {
          setStatus("❌ Spreadsheet is empty");
          return;
        }

        const cols = Object.keys(json[0]);
        setHeaders(cols);
        setSheetData(json);
        setSelectedColumn("");
        setStatus(`✅ Found ${json.length} rows with columns: ${cols.join(", ")}`);
      } catch (err) {
        setStatus(`❌ Failed to parse spreadsheet: ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function handleFetchAddresses() {
    if (!sheetData || !selectedColumn) return;

    setFetching(true);
    const total = sheetData.length;
    setFetchProgress({ current: 0, total });

    // Simulate progressive loading with a micro-delay per address for UX
    const addrs = [];
    let idx = 0;

    function processNext() {
      if (idx >= total) {
        // Done — populate textarea
        setRecipients(addrs.join("\n"));
        setFetching(false);
        setFetchProgress({ current: total, total });
        setStatus(`✅ Fetched ${addrs.length} addresses from column "${selectedColumn}"`);
        return;
      }

      const raw = sheetData[idx][selectedColumn];
      const addr = String(raw).trim();
      if (addr && ethers.isAddress(addr)) {
        addrs.push(addr);
      }

      idx++;
      setFetchProgress({ current: idx, total });

      // Use requestAnimationFrame-style batching: process in chunks of 50
      if (idx % 50 === 0 || idx === total) {
        setTimeout(processNext, 8);
      } else {
        processNext();
      }
    }

    processNext();
  }

  function clearSheet() {
    setSheetData(null);
    setHeaders([]);
    setSelectedColumn("");
    setFetchProgress({ current: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

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
          {/* ── Spreadsheet Upload ── */}
          <div className="spreadsheet-upload-area">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="spreadsheet-input"
              id="sheet-upload"
            />
            <label htmlFor="sheet-upload" className="spreadsheet-label">
              <span className="upload-icon">📄</span>
              <span className="upload-text">
                {headers.length > 0
                  ? `Loaded: ${headers.length} columns · ${sheetData?.length ?? 0} rows`
                  : "Upload Spreadsheet (.xlsx, .csv)"}
              </span>
              <span className="upload-btn-tag">Choose File</span>
            </label>
          </div>

          {/* ── Column Picker + Fetch ── */}
          {headers.length > 0 && !fetching && fetchProgress.current === 0 && (
            <div className="sheet-column-bar">
              <div className="column-picker-row">
                <select
                  value={selectedColumn}
                  onChange={(e) => setSelectedColumn(e.target.value)}
                  className="column-select"
                >
                  <option value="">— Select wallet column —</option>
                  {headers.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn fetch"
                  disabled={!selectedColumn}
                  onClick={handleFetchAddresses}
                >
                  📥 Fetch
                </button>
                <button
                  type="button"
                  className="btn sheets-clear"
                  onClick={clearSheet}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* ── Progress Bar ── */}
          {fetching && (
            <div className="fetch-progress-area">
              <div className="fetch-progress-bar-track">
                <div
                  className="fetch-progress-bar-fill"
                  style={{
                    width: `${
                      fetchProgress.total > 0
                        ? (fetchProgress.current / fetchProgress.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className="fetch-progress-text">
                Parsing addresses… {fetchProgress.current} / {fetchProgress.total}
              </span>
            </div>
          )}

          {/* ── Done state after fetch ── */}
          {headers.length > 0 && !fetching && fetchProgress.current > 0 && (
            <div className="sheet-done-bar">
              <span className="sheet-done-text">
                ✅ Loaded {fetchProgress.current} addresses
              </span>
              <div className="sheet-done-actions">
                <button
                  type="button"
                  className="btn fetch"
                  onClick={handleFetchAddresses}
                >
                  🔄 Re-fetch
                </button>
                <button
                  type="button"
                  className="btn sheets-clear"
                  onClick={clearSheet}
                >
                  ✕ Clear
                </button>
              </div>
            </div>
          )}

          <label>
            Recipients (one address per line or comma-separated)
            <textarea
              rows={Math.min(Math.max(recipients.split("\n").length, 3), 15)}
              placeholder={`0xABC...\n0xDEF...\n0x123...`}
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              className="splitter-textarea"
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
