import '../styles/globals.css'
import Navbar from '../components/ui/navbar'
import { useState, useRef } from 'react'

export default function App({ Component, pageProps }) {
  // Shared state for build actions
  const [buildName, setBuildName] = useState("");
  const [savedBuilds, setSavedBuilds] = useState([]);
  const dashboardRef = useRef();

  // Handlers to be passed to Navbar
  const handleSave = () => dashboardRef.current?.saveBuild?.();
  const handleLoad = (buildId) => dashboardRef.current?.loadBuild?.(buildId);
  const handleExportJSON = () => dashboardRef.current?.exportJSON?.();
  const handleExportCSV = () => dashboardRef.current?.exportCSV?.();
  const handleDeleteBuild = (buildId) => dashboardRef.current?.deleteUserBuild?.(buildId);

  return (
    <>
      <style jsx global>{`
        @keyframes slideInFromTop {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fade-in {
          animation: slideInFromTop 0.3s ease-out;
        }
        
        .toast-success {
          background: linear-gradient(135deg, #10b981, #059669);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        .toast-error {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }
        
        .toast-warning {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }
        
        .toast-info {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
      `}</style>
      <Navbar
        onSave={handleSave}
        onLoad={handleLoad}
        onExportJSON={handleExportJSON}
        onExportCSV={handleExportCSV}
        onDeleteBuild={handleDeleteBuild}
        savedBuilds={savedBuilds}
        setBuildName={setBuildName}
        buildName={buildName}
      />
      <Component
        {...pageProps}
        ref={dashboardRef}
        setBuildName={setBuildName}
        buildName={buildName}
        setSavedBuilds={setSavedBuilds}
      />
    </>
  )
} 