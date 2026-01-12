
import React, { useEffect, useState } from 'react';
import StatusCard from './components/StatusCard';
import HistoryChart from './components/HistoryChart';
import SkyMap from './components/SkyMap';
import SpeedtestWidget from './components/SpeedtestWidget';
import SettingsModal from './components/SettingsModal';

function App() {
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState(null); // Changed from [] to null based on instruction
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Status Polling (1s)
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const result = await window.electronAPI.getStarlinkStatus();
        if (result.success) {
          console.log("Starlink Status received:", result.data.dish_get_status); // DEBUG
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

  return (
    <div className="app-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Compact Header with Controls */}
      <header className="app-header" style={{ padding: '0 20px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)' }}>
        <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="logo-icon" style={{ fontSize: '1.2rem' }}>🛰️</div>
          <h1 style={{ margin: 0, fontSize: '1.1rem', background: 'linear-gradient(90deg, #fff, #8b9bb4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            SpaceLink <span className="version" style={{ fontSize: '0.7rem', opacity: 0.5 }}>v1.2.0</span>
          </h1>
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
            style={{ background: 'transparent', border: '1px solid rgba(255, 51, 102, 0.5)', color: '#ff3366', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}
          >
            🔄
          </button>
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
            style={{ background: 'transparent', border: '1px solid rgba(255, 183, 0, 0.5)', color: '#ffb700', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}
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
            style={{ background: 'transparent', border: '1px solid rgba(0, 243, 255, 0.5)', color: '#00f3ff', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}
          >
            ⬆️
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="btn-icon"
            title="Impostazioni"
            style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.3)', color: '#fff', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}
          >
            ⚙️
          </button>
          <div className="window-controls"></div>
        </div>
      </header>

      <main className="dashboard-compact">
        {loading && !status ? (
          <div className="loading-screen" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
            Connessione al Dish in corso...
          </div>
        ) : (
          <>
            {/* LEFT COLUMN: Sidebar (Metrics) */}
            <aside className="dashboard-sidebar">
              {/* Primary Status Card */}
              <StatusCard
                title="Stato"
                value={status ? 'ONLINE' : 'OFFLINE'}
                icon={status ? 'wifi' : 'wifi_off'}
                status={status ? 'good' : 'error'}
              />

              {/* Metrics Stack */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <StatusCard
                  title="Download"
                  value={status ? formatSpeed(status.downlink_throughput_bps) : '---'}
                  sub="Mbps"
                  icon="arrow_downward"
                />
                <StatusCard
                  title="Upload"
                  value={status ? formatSpeed(status.uplink_throughput_bps) : '---'}
                  sub="Mbps"
                  icon="arrow_upward"
                />
                <StatusCard
                  title="Latenza"
                  value={status ? Math.round(status.pop_ping_latency_ms) : '---'}
                  sub="ms"
                  icon="speed"
                />
                <StatusCard
                  title="SNR"
                  value={status ? (status.snr ? status.snr.toFixed(1) : '---') : '---'}
                  sub="dB"
                  icon="signal_cellular_alt"
                />
              </div>

              {/* SpeedtestWidget moved to main dashboard */}

            </aside>

            {/* RIGHT COLUMN: Main Visuals */}
            <section className="dashboard-main">
              {/* Sky Map (Dominant) */}
              <div style={{ width: '100%', height: '100%', minHeight: '0', gridColumn: '1 / 2' }}>
                <SkyMap
                  obstructionData={status?.obstruction_stats}
                  uptime={status?.device_state?.uptime_s}
                />
              </div>

              {/* Speedtest Widget (Top Right) */}
              <div style={{ width: '100%', height: '100%', minHeight: '0', gridColumn: '2 / 3' }}>
                <SpeedtestWidget />
              </div>

              {/* History Charts (Bottom Row) */}
              <div className="mini-charts-row" style={{ gridColumn: '1 / -1' }}>
                <div style={{ flex: 1 }}>
                  <HistoryChart
                    title="Velocità"
                    data={history}
                    dataKey="downlink_mbps"
                    color="#00f3ff"
                    unit=" Mbps"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <HistoryChart
                    title="Latenza"
                    data={history}
                    dataKey="latency"
                    color="#ffb700"
                    unit=" ms"
                  />
                </div>
              </div>
            </section>
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
