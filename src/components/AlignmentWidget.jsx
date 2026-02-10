import React from 'react';

const AlignmentWidget = ({ alignmentStats, hasMotors }) => {
    // If we have stats, use them. If not, we might still render placeholders if alignment is required.
    // But better to just default to 0 or show "Waiting..."
    const hasData = !!alignmentStats;

    const {
        boresight_azimuth_deg = 0,
        boresight_elevation_deg = 0,
        desired_boresight_azimuth_deg = 0,
        desired_boresight_elevation_deg = 0
    } = alignmentStats || {};

    // For Gen 2 (Motorized), 'desired' fields might be internal state (Enum) or irrelevant.
    // We only calculate diffs if NOT motorized, or if we trust the desired values.
    // Since user reported Gen 2 shows false warning, we assume desired fields are not target angles for users.

    const azDiff = boresight_azimuth_deg - desired_boresight_azimuth_deg;
    const elDiff = boresight_elevation_deg - desired_boresight_elevation_deg;

    // Tolerance: 2 degrees?
    // If motorized, we assume it's aligned unless there's a specific alert.
    const isAligned = hasMotors || (Math.abs(azDiff) < 2 && Math.abs(elDiff) < 2);

    const getColor = (diff) => {
        if (hasMotors) return 'var(--text-primary)'; // Neutral for motors
        if (Math.abs(diff) < 2) return 'var(--accent-cyan)'; // Good
        if (Math.abs(diff) < 5) return 'var(--accent-orange)'; // Warning
        return 'var(--accent-red)'; // Bad
    };

    return (
        <div className="glass-panel" style={{ padding: '15px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#fff' }}>Allineamento Dish</h3>
                {hasData ? (
                    hasMotors ? (
                        <span style={{ color: 'var(--accent-blue)', fontSize: '0.8rem' }}>⚙️ AUTOMATICO</span>
                    ) : (
                        isAligned ? (
                            <span style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem' }}>✅ OTTIMALE</span>
                        ) : (
                            <span style={{ color: 'var(--accent-orange)', fontSize: '0.8rem' }}>⚠️ DA ALLINEARE</span>
                        )
                    )
                ) : (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>📡 IN ATTESA DATI...</span>
                )}
            </div>

            {hasData ? (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {/* Azimuth */}
                        <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.7rem', color: '#888' }}>Azimuth</div>
                            <div style={{ fontSize: '1.2rem', color: getColor(azDiff) }}>
                                {boresight_azimuth_deg.toFixed(1)}°
                            </div>
                            {!hasMotors && (
                                <div style={{ fontSize: '0.65rem', color: '#666' }}>
                                    Target: {desired_boresight_azimuth_deg.toFixed(1)}°
                                </div>
                            )}
                        </div>

                        {/* Elevation */}
                        <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.7rem', color: '#888' }}>Elevazione</div>
                            <div style={{ fontSize: '1.2rem', color: getColor(elDiff) }}>
                                {boresight_elevation_deg.toFixed(1)}°
                            </div>
                            {!hasMotors && (
                                <div style={{ fontSize: '0.65rem', color: '#666' }}>
                                    Target: {desired_boresight_elevation_deg.toFixed(1)}°
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Show visual guide only for Manual Alignment */}
                    {!hasMotors && (
                        <>
                            <div style={{ position: 'relative', width: '200px', height: '200px', margin: '20px auto', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }}>
                                {/* Crosshair */}
                                <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
                                <div style={{ position: 'absolute', top: '0', bottom: '0', left: '50%', width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>

                                {/* Target Circle */}
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--accent-cyan)' }}></div>

                                {/* The "Pointer" */}
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    width: '12px',
                                    height: '12px',
                                    backgroundColor: isAligned ? 'var(--accent-cyan)' : 'var(--accent-orange)',
                                    borderRadius: '50%',
                                    boxShadow: `0 0 10px ${isAligned ? 'var(--accent-cyan)' : 'var(--accent-orange)'}`,
                                    transform: `translate(
                                        calc(-50% + ${Math.max(-90, Math.min(90, azDiff * 5))}px), 
                                        calc(-50% + ${Math.max(-90, Math.min(90, -elDiff * 5))}px)
                                    )`,
                                    transition: 'transform 0.5s ease-out, background-color 0.3s'
                                }}></div>
                            </div>

                            {!isAligned && (
                                <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(255, 183, 0, 0.1)', borderRadius: '4px', fontSize: '0.75rem', color: '#ddd', textAlign: 'center' }}>
                                    Ruota: <b>{azDiff > 0 ? 'Sinistra ⬅️' : 'Destra ➡️'}</b> <br />
                                    Inclina: <b>{elDiff > 0 ? 'Giù ⬇️' : 'Su ⬆️'}</b>
                                </div>
                            )}
                        </>
                    )}
                </>
            ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '0.8rem' }}>
                    <p>Dati allineamento non disponibili.</p>
                </div>
            )}
        </div>
    );
};

export default AlignmentWidget;
