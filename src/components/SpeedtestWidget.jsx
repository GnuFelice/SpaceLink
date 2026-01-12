import React, { useState, useEffect } from 'react';

function SpeedtestWidget() {
    const [running, setRunning] = useState(false);
    const [progress, setProgress] = useState(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleUpdate = (event, data) => {
            // data: { type: 'download'|'upload', speed: number }
            setProgress(data);
        };

        // Listen for progress
        // Note: We need to make sure the listener is added/removed correctly
        // But main process sends to webContents. 
        // We need to expose on listener in preload?
        // Wait, preload doesn't have a listener exposed yet.
        // I need to add that to preload first or use a one-off mechanism, but listeners are better.

        if (window.electronAPI.onSpeedtestUpdate) {
            const removeListener = window.electronAPI.onSpeedtestUpdate(handleUpdate);
            return () => removeListener();
        }
    }, []);

    const startTest = async () => {
        setRunning(true);
        setProgress(null);
        setResult(null);
        setError(null);

        try {
            const res = await window.electronAPI.runSpeedtest();
            if (res.success) {
                setResult(res.data);
            } else {
                setError(res.error);
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setRunning(false);
            setProgress(null);
        }
    };

    return (
        <div className="widget" style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-glass)',
            borderRadius: '16px',
            padding: '24px',
            backdropFilter: 'var(--glass-blur)',
            // marginTop: '20px' // Removed for grid layout
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            minWidth: '300px', // Prevent shrinking too much
            maxWidth: '100%',  // Allow fill but respect parent
            overflow: 'hidden' // Prevent internal expansion from pushing bounds
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{
                    margin: 0,
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>Speedtest (LibreSpeed)</h3>

                {!running && (
                    <button
                        onClick={startTest}
                        style={{
                            background: 'rgba(0, 243, 255, 0.1)',
                            border: '1px solid var(--accent-cyan)',
                            color: 'var(--accent-cyan)',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            fontSize: '0.8rem'
                        }}
                    >
                        Avvia Test
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, justifyContent: 'center' }}>
                {/* Download */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>DOWNLOAD</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                        {progress?.type === 'download' ? progress.speed.toFixed(1) : (result?.download ? result.download.toFixed(1) : '---')}
                        <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-secondary)', marginLeft: '4px' }}>Mbps</span>
                    </div>
                </div>

                {/* Upload */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>UPLOAD</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff00ff' }}>
                        {progress?.type === 'upload' ? progress.speed.toFixed(1) : (result?.upload ? result.upload.toFixed(1) : '---')}
                        <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-secondary)', marginLeft: '4px' }}>Mbps</span>
                    </div>
                </div>

                {/* Ping */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PING</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ffb700' }}>
                        {result?.ping ? result.ping.toFixed(0) : '---'}
                        <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-secondary)', marginLeft: '4px' }}>ms</span>
                    </div>
                </div>
            </div>

            {/* Server Info or Progress Bar */}
            <div style={{ marginTop: '20px', minHeight: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                {running && (
                    <div style={{ color: 'var(--accent-cyan)', animation: 'pulse 1.5s infinite' }}>
                        Esecuzione test in corso... {progress?.type === 'download' ? '(Download)' : (progress?.type === 'upload' ? '(Upload)' : '')}
                    </div>
                )}
                {result && !running && (
                    <div>
                        Server: <span style={{ color: 'white', marginRight: '15px' }}>{result.server}</span>
                        IP: <span style={{ color: 'var(--accent-cyan)' }}>{result.ip}</span>
                    </div>
                )}
                {error && (
                    <div style={{ color: '#ff3366' }}>Errore: {error}</div>
                )}
            </div>
        </div>
    );
}

export default SpeedtestWidget;
