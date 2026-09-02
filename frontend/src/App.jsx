import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import MissionsGIS from './pages/MissionsGIS';
import HazardReports from './pages/HazardReports';
import Auth from './pages/Auth';
import DriftPrediction from './pages/DriftPrediction';
import { MissionProvider } from './context/MissionContext'; // <-- NEW IMPORT

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Start exit animation after 2 seconds
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2000);

    // Remove splash screen entirely after animation completes
    const endTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3000); // Wait full 1s for transition

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(endTimer);
    };
  }, []);

  if (showSplash) {
    return (
      <div className="flex flex-col h-screen w-screen items-center justify-center bg-slate-900 font-sans relative overflow-hidden">
        {/* Background aesthetic glow */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${isExiting ? 'opacity-0' : 'opacity-100'}`}></div>
        
        <div className="flex flex-col items-center gap-8 z-10 relative">
          
          {/* LOGO with cinematic scale-up transition */}
          <div 
            className={`p-4 bg-white shadow-[0_0_40px_rgba(37,99,235,0.3)] flex items-center justify-center transition-all duration-1000 ease-in-out origin-center
              ${isExiting ? 'rounded-none blur-sm' : 'rounded-3xl animate-pulse'}`}
            style={{ 
              transform: isExiting ? 'scale(50)' : 'scale(1)', 
              opacity: isExiting ? 0 : 1 
            }}
          >
            <img src="/logo.png" alt="SagarDrishti Logo" className="w-40 h-40 object-contain mix-blend-multiply" />
          </div>

          {/* TEXT fades out early */}
          <div className={`text-center flex flex-col items-center transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
            <h1 className="text-4xl font-black text-white tracking-tight mb-3 drop-shadow-md">
              Sagar<span className="text-blue-400">Drishti</span>
            </h1>
            <p className="text-slate-400 font-medium text-sm tracking-widest uppercase mb-8">
              Initializing Autonomous Systems...
            </p>
            
            {/* Loading Bar */}
            <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
              <div className="absolute top-0 left-0 h-full bg-blue-500 w-full animate-[loading_2.0s_ease-in-out_1]"></div>
            </div>
          </div>
        </div>
        
        {/* Inline style for the loading animation */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes loading {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
          }
        `}} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <MissionProvider>
      <BrowserRouter>
        <div className="flex h-screen w-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
          <Navigation />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/drift" element={<DriftPrediction />} />
              <Route path="/missions" element={<MissionsGIS />} />
              <Route path="/reports" element={<HazardReports />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </MissionProvider>
  );
}