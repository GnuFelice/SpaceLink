import React, { useEffect, useState } from 'react';

const EventLogWidget = () => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const logs = await window.electronAPI.getEvents(20);
                console.log("Fetching events...", logs ? logs.length : 'null');
                if (Array.isArray(logs)) {
                    setEvents(logs);
                }
            } catch (error) {
                console.error("Failed to fetch events:", error);
            }
        };

        fetchEvents();
        const interval = setInterval(fetchEvents, 5000); // Refresh every 5s
        return () => clearInterval(interval);
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'ERROR': return '❌';
            case 'WARNING': return '⚠️';
            case 'HISTORY_ALARM': return '🕰️';
            default: return 'ℹ️';
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'ERROR': return '#ff4d4d';
            case 'WARNING': return '#ffb700';
            case 'HISTORY_ALARM': return '#b388eb'; // Pastel Purple
            default: return 'var(--accent-cyan)';
        }
    };

    return (
        <div className="widget" style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-glass)',
            borderRadius: '16px',
            padding: '16px',
            backdropFilter: 'var(--glass-blur)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxSizing: 'border-box'
        }}>
            <h3 style={{
                margin: '0 0 10px 0',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                Registro Eventi
                <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>Ultimi 20</span>
            </h3>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                {events.length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', marginTop: '20px' }}>
                        Nessun evento registrato.
                    </div>
                ) : (
                    events.map(evt => (
                        <div key={evt.id} style={{
                            fontSize: '0.75rem',
                            padding: '8px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '8px',
                            borderLeft: `3px solid ${getColor(evt.type)}`
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 'bold', color: getColor(evt.type), display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    {getIcon(evt.type)} {evt.type}
                                </span>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                                    {new Date(evt.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                            <div className="marquee-container">
                                <span className="marquee-text">
                                    {evt.message} {evt.details && Object.keys(evt.details).length > 0 ? ` - ${JSON.stringify(evt.details)}` : ''}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div >
    );
};

export default EventLogWidget;
