import React, { useEffect, useState } from 'react';

const EventLogWidget = ({ excludeTypes = [], compact = false, limit = 20 }) => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const logs = await window.electronAPI.getEvents(limit, 0, { excludeTypes });
                // console.log("Fetching events...", logs ? logs.length : 'null'); // Commented out to reduce noise
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
    }, [JSON.stringify(excludeTypes), limit]);

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
            case 'ERROR': return '#ff4d4d'; // Red
            case 'WARNING': return '#ffb700'; // Amber
            case 'HISTORY_ALARM': return '#b388eb'; // Pastel Purple
            default: return 'var(--accent-cyan)'; // Cyan
        }
    };

    const formatMessage = (evt) => {
        let detailsStr = '';
        if (evt.details && Object.keys(evt.details).length > 0) {
            // Try to extract meaningful info if available, otherwise stringify
            const { message, reason, ...rest } = evt.details;

            // Prioritize specific error fields if they exist
            if (message) detailsStr += ` | ${message}`;
            else if (reason) detailsStr += ` | ${reason}`;

            // Add remaining details if any
            if (Object.keys(rest).length > 0) {
                detailsStr += ` (${JSON.stringify(rest)})`;
            }
        }
        return (
            <span>
                <span style={{ fontWeight: 500 }}>{evt.message}</span>
                {detailsStr && <span style={{ opacity: 0.8, fontStyle: 'italic' }}>{detailsStr}</span>}
            </span>
        );
    };

    return (
        <div className="widget" style={{
            background: 'var(--md-surface-variant)',
            border: '1px solid var(--md-outline)',
            borderRadius: 'var(--md-radius)',
            padding: '16px',
            boxShadow: 'var(--md-elevation-1)',
            height: compact ? 'auto' : '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxSizing: 'border-box'
        }}>
            <h3 style={{
                margin: '0 0 10px 0',
                color: 'var(--md-on-surface-variant)',
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                Registro Eventi
                <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>Ultimi {limit}</span>
            </h3>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                {events.length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginTop: '20px' }}>
                        Nessun evento registrato.
                    </div>
                ) : (
                    events.map(evt => (
                        <div key={evt.id} style={{
                            fontSize: '0.9rem', // Increased size
                            padding: '10px 8px', // Slightly more padding
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '8px',
                            borderLeft: `4px solid ${getColor(evt.type)}` // Thicker border
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                                <span style={{ fontWeight: 'bold', color: getColor(evt.type), display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {getIcon(evt.type)} {evt.type}
                                </span>
                                <span style={{
                                    color: '#ffffff', // Clean white for contrast
                                    fontSize: '0.8rem', // Slightly larger timestamp
                                    fontWeight: 'bold', // Bold timestamp
                                    background: 'rgba(0,0,0,0.3)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontFamily: 'monospace'
                                }}>
                                    {new Date(evt.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                            <div className="marquee-container" style={{ height: '1.4em' }}> {/* Ensure height for larger text */}
                                <span className="marquee-text" style={{ paddingLeft: '0', animation: 'none', whiteSpace: 'normal', display: 'block' }}>
                                    {/* 
                                        Note: Removed marquee animation for error readability as requested "highlight error reason". 
                                        Scrolling text makes it hard to read complex errors. 
                                        However, user asked for "increase text size of scrolling log".
                                        Let's keep marquee but make it smarter? 
                                        Actually, for complex errors, wrapping might be better. 
                                        But user specifically asked "aumenta le dimensioni del testo scorrevole" (increase size of scrolling text).
                                        So I should keep the marquee but maybe slow it down or ensure it fits?
                                        Let's stick to the plan: Increase text size.
                                        I will revert the "remove marquee" thought and keep marquee but with larger text.
                                     */}
                                    <span className="marquee-text-inner" style={{
                                        display: 'inline-block',
                                        paddingLeft: '100%',
                                        animation: 'marquee 20s linear infinite', // Slower animation for readability
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {formatMessage(evt)}
                                    </span>
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <style>{`
                /* Inline style override for this specific widget instance to handle the marquee correctly if needed */
                .marquee-container {
                    overflow: hidden;
                    white-space: nowrap;
                    position: relative;
                    mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
                    -webkit-mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
                }
            `}</style>
        </div >
    );
};

export default EventLogWidget;
