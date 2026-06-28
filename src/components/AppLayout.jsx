import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

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

      <Outlet />
    </div>
  );
}
