import React, { useEffect, useState } from 'react';

const EventRegistryView = () => {
    const [events, setEvents] = useState([]);
    const [totalEvents, setTotalEvents] = useState(0);
    const [loading, setLoading] = useState(false);

    // Filters State
    const [filters, setFilters] = useState({
        type: '', // 'INFO', 'WARNING', 'ERROR', 'LOGIN' or '' for all
        search: ''
    });

    // Pagination State
    const [page, setPage] = useState(1);
    const pageSize = 50;

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const offset = (page - 1) * pageSize;

            // Fetch Data
            const data = await window.electronAPI.getEvents(pageSize, offset, filters);
            setEvents(data);

            // Fetch Count
            const count = await window.electronAPI.getEventCount(filters);
            setTotalEvents(count);
        } catch (error) {
            console.error("Failed to fetch registry events:", error);
        } finally {
            setLoading(false);
        }
    };

    // Load on change
    useEffect(() => {
        fetchEvents();
    }, [page, filters]); // Re-fetch when page or filters change

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1); // Reset to first page
    };

    const totalPages = Math.ceil(totalEvents / pageSize);

    const getIcon = (type) => {
        switch (type) {
            case 'ERROR': return '❌';
            case 'WARNING': return '⚠️';
            case 'history_alarm': return '🕰️';
            case 'LOGIN': return '🔑';
            default: return 'ℹ️';
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'ERROR': return '#ff4d4d';
            case 'WARNING': return '#ffb700';
            case 'history_alarm': return '#b388eb';
            case 'LOGIN': return '#00f3ff';
            default: return 'var(--text-secondary)';
        }
    };

    return (
        <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            {/* Header & Filters */}
            <div style={{
                display: 'flex',
                gap: '20px',
                marginBottom: '20px',
                background: 'var(--md-surface-variant)',
                padding: '20px',
                borderRadius: 'var(--md-radius)',
                border: '1px solid var(--md-outline)',
                boxShadow: 'var(--md-elevation-1)',
                alignItems: 'center',
                flexWrap: 'wrap'
            }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>Registro Eventi</h2>

                <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                    <select
                        value={filters.type}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                        style={{
                            background: 'var(--md-surface-elevated)',
                            border: '1px solid var(--md-outline)',
                            color: 'var(--md-on-surface)',
                            padding: '10px',
                            borderRadius: 'var(--md-radius-small)',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="" style={{ color: 'black' }}>Tutti i Tipi</option>
                        <option value="INFO" style={{ color: 'black' }}>Info</option>
                        <option value="WARNING" style={{ color: 'black' }}>Warning</option>
                        <option value="ERROR" style={{ color: 'black' }}>Error</option>
                        <option value="LOGIN" style={{ color: 'black' }}>Login</option>
                    </select>

                    <input
                        type="text"
                        placeholder="Cerca negli eventi..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        style={{
                            background: 'var(--md-surface-elevated)',
                            border: '1px solid var(--md-outline)',
                            color: 'var(--md-on-surface)',
                            padding: '10px',
                            borderRadius: 'var(--md-radius-small)',
                            flex: 1,
                            minWidth: '200px'
                        }}
                    />
                </div>

                <div style={{ color: 'var(--md-on-surface-variant)', fontSize: '0.9rem' }}>
                    Totale: <strong>{totalEvents}</strong> eventi
                </div>
            </div>

            {/* Table Container */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                background: 'var(--md-surface-variant)',
                borderRadius: 'var(--md-radius)',
                border: '1px solid var(--md-outline)',
                boxShadow: 'var(--md-elevation-1)',
                position: 'relative'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#141a26', zIndex: 10 }}>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '15px', borderBottom: '1px solid var(--border-glass)' }}>Ora</th>
                            <th style={{ textAlign: 'left', padding: '15px', borderBottom: '1px solid var(--border-glass)' }}>Tipo</th>
                            <th style={{ textAlign: 'left', padding: '15px', borderBottom: '1px solid var(--border-glass)' }}>Messaggio</th>
                            <th style={{ textAlign: 'left', padding: '15px', borderBottom: '1px solid var(--border-glass)' }}>Dettagli</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.length === 0 && !loading && (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                    Nessun evento trovato.
                                </td>
                            </tr>
                        )}
                        {events.map((evt) => (
                            <tr key={evt.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '12px 15px', fontFamily: 'monospace', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                    {new Date(evt.timestamp).toLocaleString()}
                                </td>
                                <td style={{ padding: '12px 15px', fontWeight: 'bold', color: getColor(evt.type) }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {getIcon(evt.type)} {evt.type}
                                    </span>
                                </td>
                                <td style={{ padding: '12px 15px' }}>{evt.message}</td>
                                <td style={{ padding: '12px 15px', fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {evt.details && Object.keys(evt.details).length > 0 ? JSON.stringify(evt.details) : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {loading && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 20
                    }}>
                        <div style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>Caricamento...</div>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px', alignItems: 'center' }}>
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    style={{
                        padding: '10px 20px',
                        background: 'var(--bg-panel)',
                        border: '1px solid var(--border-glass)',
                        color: page === 1 ? 'var(--text-secondary)' : '#fff',
                        borderRadius: '8px',
                        cursor: page === 1 ? 'default' : 'pointer',
                        opacity: page === 1 ? 0.5 : 1
                    }}
                >
                    &larr; Precedente
                </button>

                <span style={{ color: 'var(--text-secondary)' }}>
                    Pagina <strong style={{ color: '#fff' }}>{page}</strong> di {totalPages || 1}
                </span>

                <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || loading}
                    style={{
                        padding: '10px 20px',
                        background: 'var(--bg-panel)',
                        border: '1px solid var(--border-glass)',
                        color: page >= totalPages ? 'var(--text-secondary)' : '#fff',
                        borderRadius: '8px',
                        cursor: page >= totalPages ? 'default' : 'pointer',
                        opacity: page >= totalPages ? 0.5 : 1
                    }}
                >
                    Successivo &rarr;
                </button>
            </div>
        </div>
    );
};

export default EventRegistryView;
