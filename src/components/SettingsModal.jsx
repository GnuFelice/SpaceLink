import React, { useEffect, useState } from 'react';

function SettingsModal({ onClose }) {
    const [activeTab, setActiveTab] = useState('general');

    // settings state
    const [settings, setSettings] = useState({ latitude: '', longitude: '' });
    const [saving, setSaving] = useState(false);

    // router state
    const [routerData, setRouterData] = useState(null);
    const [routerLoading, setRouterLoading] = useState(false);
    const [routerError, setRouterError] = useState(null);

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

    // Load Router data when tab is active
    useEffect(() => {
        if (activeTab === 'router' && !routerData) {
            fetchRouter();
        }
    }, [activeTab]);

    const fetchRouter = async () => {
        setRouterLoading(true);
        setRouterError(null);
        try {
            const res = await window.electronAPI.getRouterStatus();
            if (res.success) {
                setRouterData(res.data);
            } else {
                if (res.bypass_detected) {
                    setRouterError("Router in Bypass Mode o non raggiungibile.");
                } else {
                    setRouterError(res.error || "Errore sconosciuto");
                }
            }
        } catch (err) {
            setRouterError(err.message);
        } finally {
            setRouterLoading(false);
        }
    };

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
                        onClick={() => setActiveTab('router')}
                        style={{
                            flex: 1,
                            padding: '15px',
                            background: activeTab === 'router' ? 'transparent' : 'rgba(0,0,0,0.2)',
                            border: 'none',
                            color: activeTab === 'router' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                            fontWeight: 'bold',
                            borderBottom: activeTab === 'router' ? '2px solid var(--accent-cyan)' : 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Router
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

                    {/* ROUTER TAB */}
                    {activeTab === 'router' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {routerLoading && <div style={{ color: 'var(--text-secondary)' }}>Caricamento dati router...</div>}

                            {routerError && (
                                <div style={{
                                    background: 'rgba(255, 51, 102, 0.1)',
                                    border: '1px solid #ff3366',
                                    color: '#ff3366',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem'
                                }}>
                                    <strong>Stato:</strong> {routerError}
                                    <div style={{ marginTop: '5px', fontSize: '0.8rem', opacity: 0.8 }}>
                                        Se hai attivato la modalità bypass, questo è normale.
                                    </div>
                                </div>
                            )}

                            {routerData && (
                                <>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>ID DISPOSITIVO</div>
                                        <div style={{ fontFamily: 'monospace' }}>{routerData.device_info?.id || '---'}</div>
                                    </div>

                                    {routerData.config && (
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>RETE WIFI</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>SSID:</span>
                                                <strong>{routerData.config.network_name || '---'}</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Paese:</span>
                                                <span>{routerData.config.country_code || '---'}</span>
                                            </div>
                                        </div>
                                    )}
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
