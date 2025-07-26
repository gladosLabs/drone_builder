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
        /* Coolors-inspired color variables */
        :root {
          --primary-color: #8b95c9;
          --primary-light: #a5aed8;
          --primary-dark: #7a84b8;
          --secondary-color: #84dcc6;
          --secondary-light: #9ee4d1;
          --secondary-dark: #6ad4b8;
          --accent-color: #acd7ec;
          --accent-light: #bce0f0;
          --accent-dark: #9ccce8;
          --background-light: #d6edff;
          --background-lighter: #e8f4ff;
          --success-color: #84dcc6;
          --warning-color: #f59e0b;
          --danger-color: #ef4444;
          --text-primary: #1f2937;
          --text-secondary: #6b7280;
          --bg-primary: #f8fafc;
          --bg-secondary: #f1f5f9;
        }

        /* Coolors-inspired backgrounds */
        .bg-coolors-primary {
          background: linear-gradient(135deg, #d6edff 0%, #e8f4ff 100%);
        }
        
        .bg-coolors-secondary {
          background: linear-gradient(135deg, #84dcc6 0%, #9ee4d1 100%);
        }
        
        .bg-coolors-accent {
          background: linear-gradient(135deg, #acd7ec 0%, #bce0f0 100%);
        }

        /* Subtle shadows */
        .shadow-coolors {
          box-shadow: 0 1px 3px 0 rgba(139, 149, 201, 0.1), 0 1px 2px 0 rgba(139, 149, 201, 0.06);
        }
        
        .shadow-coolors-hover {
          box-shadow: 0 4px 6px -1px rgba(139, 149, 201, 0.1), 0 2px 4px -1px rgba(139, 149, 201, 0.06);
        }

        /* Coolors-inspired button gradients */
        .btn-coolors-primary {
          background: linear-gradient(135deg, #8b95c9 0%, #7a84b8 100%) !important;
          border: 1px solid rgba(139, 149, 201, 0.2) !important;
        }
        
        .btn-coolors-primary:hover {
          background: linear-gradient(135deg, #7a84b8 0%, #6a74a8 100%) !important;
          border: 1px solid rgba(122, 132, 184, 0.3) !important;
        }
        
        .btn-coolors-secondary {
          background: linear-gradient(135deg, #84dcc6 0%, #6ad4b8 100%) !important;
          border: 1px solid rgba(132, 220, 198, 0.2) !important;
        }
        
        .btn-coolors-secondary:hover {
          background: linear-gradient(135deg, #6ad4b8 0%, #5ac4a8 100%) !important;
          border: 1px solid rgba(106, 212, 184, 0.3) !important;
        }
        
        .btn-coolors-accent {
          background: linear-gradient(135deg, #acd7ec 0%, #9ccce8 100%) !important;
          border: 1px solid rgba(172, 215, 236, 0.2) !important;
          color: #1f2937 !important;
        }
        
        .btn-coolors-accent:hover {
          background: linear-gradient(135deg, #9ccce8 0%, #8cc2e4 100%) !important;
          border: 1px solid rgba(156, 204, 232, 0.3) !important;
        }
        
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