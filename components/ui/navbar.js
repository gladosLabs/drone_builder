import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabase";

export default function Navbar({ onSave, onLoad, onExportJSON, onExportCSV, savedBuilds, setBuildName, buildName, onDeleteBuild }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("info"); // "success", "error", "info", "warning"
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef();
  const buttonRef = useRef();
  const router = useRouter();





  // On mount, check for user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
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

  // Toast auto-hide with different durations
  useEffect(() => {
    if (toast) {
      const duration = toastType === 'error' ? 5000 : 3000; // Longer for errors
      const t = setTimeout(() => {
        setToast("");
        setToastType("info");
      }, duration);
      return () => clearTimeout(t);
    }
  }, [toast, toastType]);

  // Helper function to show toast
  const showToast = (message, type = "info") => {
    setToast(message);
    setToastType(type);
  };

  // Delete build
  function handleDeleteBuild(buildId) {
    if (typeof onDeleteBuild === "function") {
      onDeleteBuild(buildId);
    }
    showToast("Build deleted", "success");
  }

  // Load build
  function handleLoadBuild(build) {
    if (typeof onLoad === "function") {
      onLoad(build.id);
    }
    setShowLoadModal(false);
  }

  // Save handler with login check
  function handleSave() {
    console.log('Navbar handleSave called with:', { buildName, user: !!user });
    
    if (!buildName) {
      showToast("Enter a build name", "warning");
      console.log('Build name is missing in navbar');
      return;
    }
    if (!user) {
      setShowLogin(true);
      console.log('User not logged in, showing login modal');
      return;
    }
    
    if (typeof onSave === "function") {
      onSave();
    }
    setMenuOpen(false);
  }

  function handleExportJSON() {
    if (typeof onExportJSON === "function") {
      onExportJSON();
    }
    setMenuOpen(false);
  }

  function handleExportCSV() {
    if (typeof onExportCSV === "function") {
      onExportCSV();
    }
    setMenuOpen(false);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      
      if (error) throw error;
      
      setShowLogin(false);
      setLoginEmail("");
      setLoginPassword("");
      showToast("Logged in successfully", "success");
      
      // Retry save after login
      if (buildName) {
        setTimeout(() => {
          if (typeof onSave === "function") {
            onSave();
          }
        }, 500);
      }
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      showToast("Logged out", "success");
    } catch (error) {
      showToast("Error logging out", "error");
    }
  }

  return (
    <nav className="w-full bg-white/90 backdrop-blur-md shadow-coolors border-b border-[#d6edff] sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Branding */}
        <Link href="/" className="flex items-center space-x-2 font-bold text-xl text-[#8b95c9] tracking-tight">
          <span className="inline-block w-8 h-8 bg-[#8b95c9] rounded-lg flex items-center justify-center shadow-coolors">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <span>DroneBuilder</span>
        </Link>
        
        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-6 text-base font-medium">
          <Link href="/" className="hover:text-[#8b95c9] transition-colors">Home</Link>
          <Link href="/dashboard" className="hover:text-[#8b95c9] transition-colors">Dashboard</Link>
          <Link href="/ai-assistant" className="hover:text-[#8b95c9] transition-colors flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>AI Assistant</span>
          </Link>
          <Link href="/community" className="hover:text-[#8b95c9] transition-colors">Community</Link>
          <Link href="/lifecycle" className="hover:text-[#8b95c9] transition-colors">Lifecycle</Link>
          <Link href="/ue-playground" className="hover:text-[#8b95c9] transition-colors flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>UE Playground</span>
          </Link>
          <Link href="/docs" className="hover:text-[#8b95c9] transition-colors">Docs</Link>
          <Link href="/help" className="hover:text-[#8b95c9] transition-colors">Help</Link>
          {/* <Link href="/pricing" className="hover:text-[#8b95c9] transition-colors">
            Pricing
          </Link> */}
        </div>
        
        {/* Right side - Auth & Save/Export */}
        <div className="flex items-center space-x-4">
          {/* Save/Export Dropdown: Only show on playground */}
          {router.pathname === "/playground" && (
            <div className="flex items-center space-x-2 relative">
              <button
                ref={buttonRef}
                className="px-3 py-2 rounded-lg btn-coolors-primary text-white font-bold shadow-coolors hover:shadow-coolors-hover transition-all duration-200 relative flex items-center gap-1"
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
                <div className="w-72 bg-white border border-[#d6edff] rounded-lg shadow-coolors mt-40">
                  <div className="px-4 py-2 border-b border-[#e8f4ff] font-semibold flex items-center gap-2 text-[#8b95c9]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5v14" /></svg>
                    Save/Load Build
                  </div>
                  <div className="px-4 py-2 flex items-center gap-2">
                    <input
                      className="px-2 py-1 border border-[#d6edff] rounded text-sm flex-1 focus:ring-2 focus:ring-[#8b95c9] focus:border-transparent"
                      placeholder="Build name"
                      value={buildName}
                      onChange={e => setBuildName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                      aria-label="Build name"
                    />
                    <button
                      className={`px-3 py-1 rounded text-sm font-bold ${!buildName ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'btn-coolors-primary text-white hover:shadow-coolors transition-all duration-200'}`}
                      onClick={handleSave}
                      disabled={!buildName}
                    >
                      <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Save
                    </button>
                  </div>
                  <button className="w-full text-left px-4 py-2 hover:bg-[#e8f4ff] text-sm flex items-center gap-2 transition-colors" onClick={() => { setShowLoadModal(true); setMenuOpen(false); }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16h16V4H4zm4 4h8v8H8V8z" /></svg>
                    Load Build
                  </button>
                  <div className="px-4 py-2 border-b border-[#e8f4ff] font-semibold flex items-center gap-2 text-[#84dcc6]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Export
                  </div>
                  <button className="w-full text-left px-4 py-2 hover:bg-[#f0f9ff] text-sm flex items-center gap-2 transition-colors" onClick={handleExportJSON}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                    Export as JSON
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-[#f0f9ff] text-sm flex items-center gap-2 transition-colors" onClick={handleExportCSV}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                    Export as CSV
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Authentication */}
          <div className="flex items-center space-x-2">
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-[#8b95c9] flex items-center justify-center text-white font-bold text-sm shadow-coolors">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-[#8b95c9] transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 rounded-lg bg-[#e8f4ff] text-[#8b95c9] font-medium hover:bg-[#d6edff] transition-all duration-200">
                  Login
                </Link>
                <Link href="/login" className="px-4 py-2 rounded-lg btn-coolors-primary text-white font-medium hover:shadow-coolors transition-all duration-200">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Load Modal */}
        {showLoadModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-xs w-full relative mt-40">
              <div className="font-bold mb-2">Saved Builds</div>
              {(!savedBuilds || savedBuilds.length === 0) && <div className="text-gray-400">No builds saved.</div>}
              {savedBuilds && savedBuilds.map((build) => (
                <div key={build.id} className="flex items-center justify-between mb-2">
                  <span className="truncate max-w-[120px]">{build.name}</span>
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:underline text-xs" onClick={() => handleLoadBuild(build)}>Load</button>
                    <button className="text-red-500 hover:underline text-xs" onClick={() => handleDeleteBuild(build.id)}>Delete</button>
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
              <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white font-bold" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
              <button type="button" className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-bold" onClick={() => setShowLogin(false)}>Cancel</button>
            </form>
          </div>
        )}



        {/* Toast/confirmation */}
        {toast && (
          <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-[9999] animate-fade-in text-white font-medium ${
            toastType === 'success' ? 'toast-success' :
            toastType === 'error' ? 'toast-error' :
            toastType === 'warning' ? 'toast-warning' :
            'toast-info'
          }`}>
            <div className="flex items-center space-x-2">
              {toastType === 'success' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {toastType === 'error' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {toastType === 'warning' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
              {toastType === 'info' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span>{toast}</span>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 