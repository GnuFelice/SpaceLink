import React, { useEffect, useState } from 'react';
import StatusCard from './components/StatusCard'; // Still needed for splash/loading logic if reused, or remove if logic moved
import SplashScreen from './components/SplashScreen';
import SettingsModal from './components/SettingsModal';
import DashboardView from './components/DashboardView';
import EventRegistryView from './components/EventRegistryView';

function App() {
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'registry'
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [splashFinished, setSplashFinished] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [appVersion, setAppVersion] = useState("v1.0.0"); // Default

  // Initial Data Fetch
  useEffect(() => {
    const init = async () => {
      try {
        // Get Version
        const ver = await window.electronAPI.getAppVersion();
        if (ver.success) setAppVersion(`v${ver.version}`);
      } catch (e) {
        console.error("Failed to get version", e);
      }
    };
    init();
  }, []);

  // Status Polling (1s)
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const result = await window.electronAPI.getStarlinkStatus();
        if (result.success) {
          setStatus(result.data.dish_get_status);
        }
      } catch (err) {
        console.error("Failed to fetch status:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync splash screen finish
  const showSplash = loading || !splashFinished;

  // History Polling (2s)
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await window.electronAPI.getStarlinkHistory();
        if (Array.isArray(data)) {
          const formattedHistory = data.map(record => ({
            ...record,
            downlink_mbps: (record.downlink / 1000000),
            uplink_mbps: (record.uplink / 1000000)
          }));
          setHistory(formattedHistory);
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 2000);
    return () => clearInterval(interval);
  }, []);

  const formatSpeed = (bps) => (bps / 1000000).toFixed(1);

  // Capabilities helpers
  const hasMotors = status?.capabilities?.has_motors !== false; // Default to true if undefined (Gen 2 assumption)
  const needsAlignment = status?.capabilities?.requires_manual_alignment === true;

  if (showSplash) {
    return <SplashScreen onComplete={() => setSplashFinished(true)} />;
  }

  return (
    <div className="app-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Compact Header with Controls and Navigation */}
      <header className="app-header" style={{ padding: '0 20px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--md-outline)', background: 'var(--md-surface-variant)', boxShadow: 'var(--md-elevation-2)' }}>
        <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="logo-icon" style={{ fontSize: '1.4rem' }}>🛰️</div>
            <h1 style={{ margin: 0, fontSize: '1.2rem', background: 'linear-gradient(90deg, #fff, #8b9bb4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700 }}>
              SpaceLink <span className="version" style={{ fontSize: '0.7rem', opacity: 0.5, WebkitTextFillColor: 'initial', color: '#8b9bb4' }}>{appVersion}</span>
            </h1>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '10px', marginLeft: '30px', background: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '8px' }}>
            <button
              onClick={() => setActiveView('dashboard')}
              style={{
                background: activeView === 'dashboard' ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: 'none',
                color: activeView === 'dashboard' ? '#fff' : 'var(--text-secondary)',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: activeView === 'dashboard' ? 'bold' : 'normal',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveView('registry')}
              style={{
                background: activeView === 'registry' ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: 'none',
                color: activeView === 'registry' ? '#fff' : 'var(--text-secondary)',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: activeView === 'registry' ? 'bold' : 'normal',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              📜 Registro Eventi
            </button>
          </div>
        </div>

        {/* Header Controls */}
        <div style={{ display: 'flex', gap: '10px', marginRight: '140px', WebkitAppRegion: 'no-drag' }}>
          <button
            onClick={async () => {
              if (confirm('Riavviare Starlink?')) {
                setLoading(true);
                await window.electronAPI.reboot();
                setLoading(false);
              }
            }}
            className="btn-icon"
            title="Riavvia"
            style={{ background: 'transparent', border: '1px solid rgba(255, 51, 102, 0.5)', color: '#ff3366', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            🔄
          </button>

          {hasMotors && (
            <>
              <button
                onClick={async () => {
                  if (confirm('Riporre (Stow) il dish?')) {
                    setLoading(true);
                    await window.electronAPI.stow();
                    setLoading(false);
                  }
                }}
                className="btn-icon"
                title="Stow (Riponi)"
                style={{ background: 'transparent', border: '1px solid rgba(255, 183, 0, 0.5)', color: '#ffb700', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ⬇️
              </button>
              <button
                onClick={async () => {
                  if (confirm('Aprire (Unstow) il dish?')) {
                    setLoading(true);
                    await window.electronAPI.unstow();
                    setLoading(false);
                  }
                }}
                className="btn-icon"
                title="Unstow (Apri)"
                style={{ background: 'transparent', border: '1px solid rgba(0, 243, 255, 0.5)', color: '#00f3ff', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ⬆️
              </button>
            </>
          )}

          <button
            onClick={() => setShowSettings(true)}
            className="btn-icon"
            title="Impostazioni"
            style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.3)', color: '#fff', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            ⚙️
          </button>
          <div className="window-controls"></div>
        </div>
      </header>

      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {loading && !status && !splashFinished ? (
          // This state is visually covered by SplashScreen, effectively.
          // Leaving minimal placeholder just in case splash finishes before data.
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--accent-cyan)' }}>
            Connessione al Dish in corso...
          </div>
        ) : (
          <>
            {activeView === 'dashboard' && (
              <div className="dashboard-content" style={{ height: '100%', padding: '20px', boxSizing: 'border-box' }}>
                <DashboardView
                  status={status}
                  history={history}
                  formatSpeed={formatSpeed}
                  needsAlignment={needsAlignment}
                />
              </div>
            )}
            {activeView === 'registry' && (
              <EventRegistryView />
            )}
          </>
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

export default App;
