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
  const handleLoad = (parts) => dashboardRef.current?.loadBuild?.(parts);
  const handleExportJSON = () => dashboardRef.current?.exportJSON?.();
  const handleExportCSV = () => dashboardRef.current?.exportCSV?.();

  return (
    <>
      <Navbar
        onSave={handleSave}
        onLoad={handleLoad}
        onExportJSON={handleExportJSON}
        onExportCSV={handleExportCSV}
        savedBuilds={savedBuilds}
        setBuildName={setBuildName}
        buildName={buildName}
      />
      <Component
        {...pageProps}
        ref={dashboardRef}
        setBuildName={setBuildName}
        buildName={buildName}
        savedBuilds={savedBuilds}
        setSavedBuilds={setSavedBuilds}
      />
    </>
  )
} 