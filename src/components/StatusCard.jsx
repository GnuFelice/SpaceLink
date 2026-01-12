import React from 'react';

const StatusCard = ({ title, value, sub, icon, status }) => {
    // Determine status color if provided, else default
    const getStatusColor = () => {
        if (status === 'good') return '#00ff44';
        if (status === 'warning') return '#ffb700';
        if (status === 'error') return '#ff3366';
        return null;
    };

    const statusColor = getStatusColor();

    return (
        <div className="widget" style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-glass)',
            borderRadius: '12px',
            padding: '16px',
            backdropFilter: 'var(--glass-blur)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '100px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <h2 style={{
                    marginTop: 0,
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>{title}</h2>
                {icon && (
                    <span className="material-icons" style={{
                        color: statusColor || 'var(--text-secondary)',
                        fontSize: '1.2rem'
                    }}>
                        {icon}
                    </span>
                )}
            </div>

            <div style={{ marginTop: '5px' }}>
                <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: statusColor || 'var(--text-primary)',
                    textShadow: statusColor ? `0 0 10px ${statusColor}40` : 'none'
                }}>
                    {value} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{sub}</span>
                </div>
            </div>

            {/* Decorative glow for status */}
            {statusColor && (
                <div style={{
                    position: 'absolute',
                    bottom: '-15px',
                    right: '-15px',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: statusColor,
                    filter: 'blur(30px)',
                    opacity: 0.15
                }} />
            )}
        </div>
    );
};

export default StatusCard;
