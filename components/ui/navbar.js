import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Navbar({ onSave, onLoad, onExportJSON, onExportCSV, savedBuilds, setBuildName, buildName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [toast, setToast] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [user, setUser] = useState(null);
  const menuRef = useRef();
  const buttonRef = useRef();
  const router = useRouter();

  // On mount, check for user
  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target) && !buttonRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    function handleKey(e) {
      if (menuOpen && e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 2000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Delete build
  function handleDeleteBuild(i) {
    const builds = savedBuilds.slice();
    builds.splice(i, 1);
    localStorage.setItem("builds", JSON.stringify(builds));
    if (typeof window !== "undefined" && window.dispatchEvent) {
      window.dispatchEvent(new Event("storage"));
    }
    setToast("Build deleted");
  }

  // Save handler with login check
  function handleSave() {
    if (!buildName) {
      setToast("Enter a build name");
      return;
    }
    if (!user) {
      setShowLogin(true);
      return;
    }
    if (typeof onSave === "function") onSave();
    setToast("Build saved!");
    setMenuOpen(false);
  }
  // Export handlers with toast
  function handleExportJSON() {
    if (typeof onExportJSON === "function") onExportJSON();
    setToast("Exported as JSON");
    setMenuOpen(false);
  }
  function handleExportCSV() {
    if (typeof onExportCSV === "function") onExportCSV();
    setToast("Exported as CSV");
    setMenuOpen(false);
  }

  // Login logic (mock, localStorage)
  function handleLogin(e) {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setToast("Enter email and password");
      return;
    }
    const mockUser = { email: loginEmail };
    localStorage.setItem("user", JSON.stringify(mockUser));
    setUser(mockUser);
    setShowLogin(false);
    setToast("Logged in!");
    setTimeout(() => handleSave(), 500); // Save after login
  }
  function handleLogout() {
    localStorage.removeItem("user");
    setUser(null);
    setToast("Logged out");
  }

  return (
    <nav className="w-full bg-white/80 backdrop-blur-md shadow-md border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Branding */}
        <Link href="/" className="flex items-center space-x-2 font-bold text-xl text-blue-700 tracking-tight">
          <span className="inline-block w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <span>DroneBuilder</span>
        </Link>
        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-6 text-base font-medium">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
          <Link href="/build" className="hover:text-blue-600 transition-colors">Build</Link>
          <Link href="/help" className="hover:text-blue-600 transition-colors">Help</Link>
        </div>
        {/* Save/Export Dropdown: Only show on /dashboard */}
        {router.pathname === "/dashboard" && (
          <div className="flex items-center space-x-2 relative">
            <button
              ref={buttonRef}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white font-bold shadow hover:bg-blue-700 transition relative flex items-center gap-1"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5v14" /></svg>
              Save & Export
              <svg className="w-4 h-4 ml-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div
              ref={menuRef}
              className={`transition-all duration-150 ${menuOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'} absolute right-0 mt-2 z-50`}
              tabIndex={-1}
            >
              <div className="w-72 bg-white border rounded shadow-lg mt-80">
                <div className="px-4 py-2 border-b font-semibold flex items-center gap-2 text-blue-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5v14" /></svg>
                  Save/Load Build
                </div>
                <div className="px-4 py-2 flex items-center gap-2">
                  <input
                    className="px-2 py-1 border rounded text-sm flex-1"
                    placeholder="Build name"
                    value={buildName}
                    onChange={e => setBuildName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                    aria-label="Build name"
                  />
                  <button
                    className={`px-3 py-1 rounded text-sm font-bold ${!buildName ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                    onClick={handleSave}
                    disabled={!buildName}
                  >
                    <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Save
                  </button>
                </div>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm flex items-center gap-2" onClick={() => { setShowLoadModal(true); setMenuOpen(false); }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16h16V4H4zm4 4h8v8H8V8z" /></svg>
                  Load Build
                </button>
                <div className="px-4 py-2 border-b font-semibold flex items-center gap-2 text-yellow-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Export
                </div>
                <button className="w-full text-left px-4 py-2 hover:bg-yellow-50 text-sm flex items-center gap-2" onClick={handleExportJSON}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                  Export as JSON
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-yellow-100 text-sm flex items-center gap-2" onClick={handleExportCSV}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                  Export as CSV
                </button>
              </div>
            </div>
            {/* Load Modal */}
            {showLoadModal && (
              <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
                <div className="bg-white rounded-xl shadow-xl p-6 max-w-xs w-full relative mt-32">
                  <div className="font-bold mb-2">Saved Builds</div>
                  {(!savedBuilds || savedBuilds.length === 0) && <div className="text-gray-400">No builds saved.</div>}
                  {savedBuilds && savedBuilds.map((b, i) => (
                    <div key={i} className="flex items-center justify-between mb-2">
                      <span className="truncate max-w-[120px]">{b.name}</span>
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:underline text-xs" onClick={() => { onLoad(b.parts); setShowLoadModal(false); }}>Load</button>
                        <button className="text-red-500 hover:underline text-xs" onClick={() => handleDeleteBuild(i)}>Delete</button>
                      </div>
                    </div>
                  ))}
                  <button className="mt-4 px-3 py-1 rounded bg-gray-100 text-gray-700 text-xs absolute right-4 bottom-4" onClick={() => setShowLoadModal(false)}>Close</button>
                </div>
              </div>
            )}
            {/* Login Modal */}
            {showLogin && (
              <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
                <form className="bg-white rounded-xl shadow-xl p-8 max-w-xs w-full flex flex-col gap-4 mt-80" onSubmit={handleLogin}>
                  <div className="font-bold text-lg mb-2">Login to Save</div>
                  <input
                    className="px-3 py-2 border rounded text-sm"
                    type="email"
                    placeholder="Email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                  />
                  <input
                    className="px-3 py-2 border rounded text-sm"
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                  />
                  <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white font-bold">Login</button>
                  <button type="button" className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-bold" onClick={() => setShowLogin(false)}>Cancel</button>
                </form>
              </div>
            )}
            {/* User Profile Placeholder */}
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold text-lg ml-2">
              {user ? (
                <span className="text-blue-700 text-xs font-semibold">{user.email}</span>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </div>
            {/* Toast/confirmation */}
            {toast && (
              <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg z-[9999] animate-fade-in">
                {toast}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
} 