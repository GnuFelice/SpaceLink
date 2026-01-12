import React, { useEffect, useState } from 'react';

function SettingsModal({ onClose }) {
    const [activeTab, setActiveTab] = useState('general');

    // settings state
    const [settings, setSettings] = useState({ latitude: '', longitude: '' });
    const [saving, setSaving] = useState(false);

    // antenna state
    const [antennaData, setAntennaData] = useState(null);
    const [loadingAntenna, setLoadingAntenna] = useState(false);
    const [antennaError, setAntennaError] = useState(null);

    // Initial Load
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const res = await window.electronAPI.getSettings();
                if (res.success) {
                    setSettings(res.data);
                }
            } catch (err) {
                console.error("Failed to load settings", err);
            }
        };
        loadSettings();
    }, []);

    // Load Antenna Data when tab active
    useEffect(() => {
        if (activeTab === 'antenna' && !antennaData) {
            setLoadingAntenna(true);
            setAntennaError(null);

            window.electronAPI.getStarlinkStatus()
                .then(res => {
                    // IPC returns { success: true, data: { ... } }
                    if (res && res.success && res.data && res.data.dish_get_status) {
                        setAntennaData(res.data.dish_get_status);
                    } else {
                        setAntennaError("Nessun dato dall'antenna. (API Error o Payload Mancante)");
                    }
                })
                .catch(err => {
                    console.error(err);
                    setAntennaError("Errore caricamento dati: " + (err.message || String(err)));
                })
                .finally(() => setLoadingAntenna(false));
        }
    }, [activeTab]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const newSettings = {
                latitude: parseFloat(settings.latitude),
                longitude: parseFloat(settings.longitude)
            };
            await window.electronAPI.saveSettings(newSettings);
            alert("Impostazioni salvate! Potrebbe essere necessario riavviare per applicare alcune modifiche.");
            onClose();
        } catch (e) {
            alert("Errore salvataggio: " + e.message);
        } finally {
            setSaving(false);
        }
    };

    const formatUptime = (seconds) => {
        if (!seconds) return 'N/A';
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor(seconds % (3600 * 24) / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        return `${d}g ${h}h ${m}m`;
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--border-glass)',
                borderRadius: '16px',
                padding: '0',
                width: '500px',
                maxWidth: '90%',
                position: 'relative',
                boxShadow: '0 0 30px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Header / Tabs */}
                <div style={{
                    display: 'flex',
                    borderBottom: '1px solid var(--border-glass)',
                    background: 'rgba(0,0,0,0.2)'
                }}>
                    <button
                        onClick={() => setActiveTab('general')}
                        style={{
                            flex: 1,
                            padding: '15px',
                            background: activeTab === 'general' ? 'transparent' : 'rgba(0,0,0,0.2)',
                            border: 'none',
                            color: activeTab === 'general' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                            fontWeight: 'bold',
                            borderBottom: activeTab === 'general' ? '2px solid var(--accent-cyan)' : 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Generale
                    </button>
                    <button
                        onClick={() => setActiveTab('antenna')}
                        style={{
                            flex: 1,
                            padding: '15px',
                            background: activeTab === 'antenna' ? 'transparent' : 'rgba(0,0,0,0.2)',
                            border: 'none',
                            color: activeTab === 'antenna' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                            fontWeight: 'bold',
                            borderBottom: activeTab === 'antenna' ? '2px solid var(--accent-cyan)' : 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Info Antenna
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            width: '50px',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            fontSize: '1.2rem',
                            cursor: 'pointer'
                        }}
                    >
                        ✕
                    </button>
                </div>

                <div style={{ padding: '20px', minHeight: '300px' }}>

                    {/* GENERAL TAB */}
                    {activeTab === 'general' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>Posizione Utente</h3>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                Coordinate necessarie per il calcolo della visibilità satellitare.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '5px' }}>Latitudine</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={settings.latitude}
                                        onChange={(e) => setSettings({ ...settings, latitude: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid var(--border-glass)',
                                            borderRadius: '6px',
                                            color: '#fff'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '5px' }}>Longitudine</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={settings.longitude}
                                        onChange={(e) => setSettings({ ...settings, longitude: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid var(--border-glass)',
                                            borderRadius: '6px',
                                            color: '#fff'
                                        }}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                style={{
                                    marginTop: '20px',
                                    padding: '12px',
                                    background: 'var(--accent-blue)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    opacity: saving ? 0.7 : 1
                                }}
                            >
                                {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
                            </button>
                        </div>
                    )}

                    {/* ANTENNA TAB */}
                    {activeTab === 'antenna' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {loadingAntenna && !antennaData && <div style={{ color: 'var(--text-secondary)' }}>Caricamento dati antenna...</div>}

                            {antennaError && (
                                <div style={{
                                    color: '#ff4d4d',
                                    background: 'rgba(255, 77, 77, 0.1)',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 77, 77, 0.3)',
                                    marginBottom: '10px'
                                }}>
                                    <strong>Errore:</strong> {antennaError}
                                </div>
                            )}

                            {antennaData && (
                                <>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Device Info</div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '5px', fontSize: '0.9rem', marginBottom: '5px' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>ID:</span>
                                            <span style={{ fontFamily: 'monospace' }}>{antennaData.device_info?.id || '---'}</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '5px', fontSize: '0.9rem', marginBottom: '5px' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Hardware:</span>
                                            <span>{antennaData.device_info?.hardware_version || '---'}</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '5px', fontSize: '0.9rem', marginBottom: '5px' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Firmware:</span>
                                            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{antennaData.device_info?.software_version || '---'}</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '5px', fontSize: '0.9rem' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Uptime:</span>
                                            <span>{formatUptime(antennaData.device_state?.uptime_s)}</span>
                                        </div>
                                    </div>

                                    {/* ALERTS SECTION */}
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Diagnostica</div>

                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                            {antennaData.alerts && (
                                                <>
                                                    <div style={{
                                                        padding: '5px 10px', borderRadius: '4px', fontSize: '0.8rem',
                                                        background: antennaData.alerts.motors_stuck ? 'rgba(255,50,50,0.2)' : 'rgba(50,255,100,0.1)',
                                                        color: antennaData.alerts.motors_stuck ? '#ff5050' : '#50ff80',
                                                        border: `1px solid ${antennaData.alerts.motors_stuck ? '#ff5050' : '#50ff80'}`
                                                    }}>
                                                        Motori: {antennaData.alerts.motors_stuck ? 'BLOCCATI' : 'OK'}
                                                    </div>

                                                    <div style={{
                                                        padding: '5px 10px', borderRadius: '4px', fontSize: '0.8rem',
                                                        background: antennaData.alerts.thermal_throttle ? 'rgba(255,165,0,0.2)' : 'rgba(50,255,100,0.1)',
                                                        color: antennaData.alerts.thermal_throttle ? 'orange' : '#50ff80',
                                                        border: `1px solid ${antennaData.alerts.thermal_throttle ? 'orange' : '#50ff80'}`
                                                    }}>
                                                        Temp: {antennaData.alerts.thermal_throttle ? 'ALTA' : 'OK'}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

export default SettingsModal;
