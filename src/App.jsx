import React, { useEffect, useState } from 'react';
import StatusCard from './components/StatusCard';
import SplashScreen from './components/SplashScreen';
import SettingsModal from './components/SettingsModal';
import DashboardView from './components/DashboardView';
import EventRegistryView from './components/EventRegistryView';

function App() {
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'registry' | 'network'
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
      <header className="app-header" style={{ padding: '0 150px 0 20px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--md-outline)', background: 'var(--md-surface-variant)', boxShadow: 'var(--md-elevation-2)', WebkitAppRegion: 'drag' }}>
        <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="logo-icon" style={{ fontSize: '1.4rem' }}>🛰️</div>
            <h1 style={{ margin: 0, fontSize: '1.2rem', background: 'linear-gradient(90deg, #fff, #8b9bb4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700 }}>
              SpaceLink <span className="version" style={{ fontSize: '0.7rem', opacity: 0.5, WebkitTextFillColor: 'initial', color: '#8b9bb4' }}>{appVersion}</span>
            </h1>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '10px', marginLeft: '30px', background: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '8px', WebkitAppRegion: 'no-drag' }}>
            <button
              onClick={() => setActiveView('dashboard')}
              style={{
                background: activeView === 'dashboard' ? 'var(--md-primary)' : 'transparent',
                color: activeView === 'dashboard' ? 'var(--md-on-primary)' : 'var(--md-on-surface-variant)',
                border: 'none',
                padding: '5px 15px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
            >
              Dashboard
            </button>

            <button
              onClick={() => setActiveView('registry')}
              style={{
                background: activeView === 'registry' ? 'var(--md-primary)' : 'transparent',
                color: activeView === 'registry' ? 'var(--md-on-primary)' : 'var(--md-on-surface-variant)',
                border: 'none',
                padding: '5px 15px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
            >
              Registro Eventi
            </button>
          </div>
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', WebkitAppRegion: 'no-drag' }}>
          <button
            className="control-btn"
            title="Stow (Riponi)"
            onClick={async () => {
              if (confirm("Attenzione: Il piatto Starlink verrà riposto. Continuare?")) {
                await window.electronAPI.stow();
                alert("Comando Stow inviato.");
              }
            }}
            disabled={!hasMotors || status?.state === 'STOWED'}
            style={{ opacity: !hasMotors || status?.state === 'STOWED' ? 0.5 : 1, cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.2rem' }}
          >
            🛑
          </button>

          <button
            className="control-btn"
            title="Unstow (Attiva)"
            onClick={async () => {
              await window.electronAPI.unstow();
              alert("Comando Unstow inviato.");
            }}
            disabled={!hasMotors || status?.state !== 'STOWED'}
            style={{ opacity: !hasMotors || status?.state !== 'STOWED' ? 0.5 : 1, cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.2rem', display: status?.state === 'STOWED' ? 'block' : 'none' }}
          >
            🚀
          </button>

          <button
            className="control-btn"
            title="Riavvia"
            onClick={async () => {
              if (confirm("Sei sicuro di voler riavviare Starlink?")) {
                await window.electronAPI.reboot();
                alert("Riavvio in corso...");
              }
            }}
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
          >
            🔄
          </button>
          <button
            className="control-btn"
            title="Impostazioni"
            onClick={() => setShowSettings(true)}
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--md-primary)' }}
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="main-content" style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activeView === 'dashboard' && (
          <DashboardView
            status={status}
            history={history}
            hasMotors={hasMotors}
            needsAlignment={needsAlignment}
            formatSpeed={formatSpeed}
          />
        )}

        {activeView === 'registry' && (
          <EventRegistryView limit={100} />
        )}

        {showSettings && (
          <SettingsModal onClose={() => setShowSettings(false)} />
        )}
      </div>
    </div>
  );
}

export default App;
