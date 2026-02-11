import React from 'react';
import StatusCard from './StatusCard';

function NetworkDiagnosticsView({ status, formatSpeed }) {
    // Helper to get Signal Quality
    const getSnrStatus = () => {
        if (!status) return '---';
        if (status.is_snr_persistently_low) return 'Instabile ⚠️';
        return 'Ottima ✅';
    };

    return (
        <div style={{ padding: '20px', overflowY: 'auto', height: '100%' }}>
            <h2 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.2rem' }}>Qualità Rete & Diagnostica</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>

                {/* Row 1: Core Metrics */}
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
                    value={status ? (status.snr !== undefined && status.snr !== null ? status.snr.toFixed(1) : '---') : '---'}
                    sub="dB"
                    icon="signal_cellular_alt"
                />

                {/* Row 2: Advanced Diagnostics */}
                <StatusCard
                    title="Ethernet"
                    value={status?.eth_speed_mbps ? status.eth_speed_mbps : '---'}
                    sub="Mbps"
                    icon="settings_ethernet"
                    secondaryLabel="Cavo"
                />
                <StatusCard
                    title="Ping Drop Rate"
                    value={status?.pop_ping_drop_rate != null ? (status.pop_ping_drop_rate * 100).toFixed(1) : '0.0'}
                    sub="%"
                    icon="network_check"
                    status={status?.pop_ping_drop_rate > 0.05 ? 'error' : 'good'}
                />
                <StatusCard
                    title="Stabilità Segnale"
                    value={getSnrStatus()}
                    sub=""
                    icon="health_and_safety"
                    status={status?.is_snr_persistently_low ? 'warning' : 'good'}
                />

                {/* Software Update */}
                <div className="glass-panel" style={{ padding: '15px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '5px' }}>Software Update</div>
                    <div style={{ fontSize: '1.2rem', color: '#fff' }}>
                        {status?.software_update_stats?.software_update_state > 0 ?
                            `Updating ${(status.software_update_stats.software_update_progress * 100).toFixed(0)}%` :
                            'Aggiornato'}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default NetworkDiagnosticsView;
