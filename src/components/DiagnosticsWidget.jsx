import React from 'react';

const DiagnosticsWidget = ({ status }) => {
    // Helper to determine system health
    const getHealthStatus = () => {
        if (!status) return 'offline';
        const alerts = status.alerts || {};
        const hasIssues = Object.values(alerts).some(val => val === true);
        return hasIssues ? 'warning' : 'nominal';
    };

    const health = getHealthStatus();
    const hasMotors = status?.capabilities?.has_motors !== false; // Default true

    // Map health to colors/icons
    const styles = {
        offline: { color: 'var(--text-secondary)', icon: 'signal_wifi_off', text: 'OFFLINE' },
        nominal: { color: '#50ff80', icon: 'check_circle', text: 'SISTEMA OK' },
        warning: { color: '#ffb700', icon: 'warning', text: 'ATTENZIONE' }
    }[health];

    return (
        <div style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-glass)',
            borderRadius: '16px',
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            backdropFilter: 'blur(10px)',
            boxShadow: 'var(--neon-glow)'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '1px' }}>DIAGNOSTICA</span>
                <span style={{
                    fontSize: '0.7rem',
                    color: styles.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontWeight: 'bold',
                    background: `rgba(${health === 'nominal' ? '80,255,128' : '255,183,0'}, 0.1)`,
                    padding: '2px 6px',
                    borderRadius: '4px'
                }}>
                    <span className="material-icons" style={{ fontSize: '12px' }}>{styles.icon}</span>
                    {styles.text}
                </span>
            </div>

            {/* Device Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
                <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>HARDWARE</div>
                    <div style={{ fontFamily: 'monospace', color: '#fff' }}>
                        {status?.device_info?.hardware_version || '--'}
                    </div>
                </div>
                <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>UPTIME</div>
                    <div style={{ fontFamily: 'monospace', color: '#fff' }}>
                        {status?.device_state?.uptime_s ? `${Math.floor(status.device_state.uptime_s / 3600)}h` : '--'}
                    </div>
                </div>
            </div>

            {/* Full Sensor List with Traffic Lights */}
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                    { key: 'motors_stuck', label: 'Motori', requiresMotors: true },
                    { key: 'thermal_throttle', label: 'Temperatura' },
                    { key: 'thermal_shutdown', label: 'Protezione Termica' },
                    { key: 'mast_not_near_vertical', label: 'Verticalità Palo' },
                    { key: 'unexpected_location', label: 'Posizione GPS' },
                    { key: 'slow_ethernet_speeds', label: 'Cavo Ethernet' }
                ]
                    .filter(sensor => !sensor.requiresMotors || hasMotors)
                    .map(sensor => {
                        const isAlert = status?.alerts?.[sensor.key];
                        // Traffic light logic: Green if OK (false/undefined), Red if Alert (true)
                        const color = isAlert ? '#ff4d4d' : '#50ff80';

                        return (
                            <div key={sensor.key} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '0.75rem',
                                padding: '4px 0',
                                borderBottom: '1px solid rgba(255,255,255,0.03)'
                            }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{sensor.label}</span>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{
                                        color: color,
                                        fontWeight: 'bold',
                                        opacity: 0.9
                                    }}>
                                        {isAlert ? 'ERRORE' : 'OK'}
                                    </span>
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: color,
                                        boxShadow: `0 0 8px ${color}`
                                    }}></div>
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
};

export default DiagnosticsWidget;
