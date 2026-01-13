import React from 'react';

const StatusCard = ({ title, value, sub, icon, status, secondaryValue, secondarySub, secondaryLabel }) => {
    // Determine status color if provided, else default
    const getStatusColor = () => {
        if (status === 'good') return 'var(--md-success)';
        if (status === 'warning') return 'var(--md-warning)';
        if (status === 'error') return 'var(--md-error)';
        return 'var(--md-secondary)';
    };

    const statusColor = getStatusColor();

    return (
        <div className="widget" style={{
            background: 'var(--md-surface-variant)',
            border: '1px solid var(--md-outline)',
            borderRadius: 'var(--md-radius)',
            padding: '16px',
            boxShadow: 'var(--md-elevation-1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '100px',
            transition: 'box-shadow 0.2s ease'
        }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--md-elevation-2)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--md-elevation-1)'}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <h2 style={{
                    marginTop: 0,
                    color: 'var(--md-on-surface-variant)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: 500
                }}>{title}</h2>
                {icon && (
                    <span className="material-icons" style={{
                        color: statusColor,
                        fontSize: '1.2rem'
                    }}>
                        {icon}
                    </span>
                )}
            </div>

            <div style={{ marginTop: '5px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '8px',
                    flexWrap: 'wrap'
                }}>
                    {/* Primary value */}
                    <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: statusColor
                    }}>
                        {value} <span style={{ fontSize: '0.8rem', color: 'var(--md-on-surface-variant)', fontWeight: 'normal' }}>{sub}</span>
                    </div>

                    {/* Secondary metric - side by side */}
                    {secondaryValue && (
                        <>
                            <span style={{ color: 'var(--md-on-surface-variant)', fontSize: '1rem', opacity: 0.5 }}>•</span>
                            <div style={{
                                fontSize: '0.95rem',
                                color: 'var(--md-warning)',
                                fontWeight: '600'
                            }}>
                                <span style={{
                                    fontSize: '0.65rem',
                                    color: 'var(--md-on-surface-variant)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    marginRight: '4px'
                                }}>{secondaryLabel}</span>
                                {secondaryValue}<span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '2px' }}>{secondarySub}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatusCard;
