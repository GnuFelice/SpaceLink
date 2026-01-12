import React, { useEffect, useState, useRef } from 'react';

function SatelliteMap() {
    const [satellites, setSatellites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch initially
        fetchSatellites();

        // Update every 3 seconds
        const interval = setInterval(fetchSatellites, 3000);
        return () => clearInterval(interval);
    }, []);

    const fetchSatellites = async () => {
        try {
            if (window.electronAPI) {
                const sats = await window.electronAPI.getSatellites();
                setSatellites(sats);
                setLoading(false);
            }
        } catch (err) {
            console.error("Failed to fetch satellites:", err);
            setLoading(false);
        }
    };

    // Helper to convert Az/El to X/Y relative to center (50, 50)
    // Azimuth: 0 = North (Top), 90 = East (Right)
    // Elevation: 90 = Center, 0 = Edge
    const polarToCartesian = (azimuth, elevation) => {
        const radius = (90 - elevation) / 90 * 45; // Max radius 45% (leave padding)
        const angleRad = (azimuth - 90) * (Math.PI / 180); // Subtract 90 to rotate 0 to Top (standard math 0 is Right)

        return {
            x: 50 + radius * Math.cos(angleRad),
            y: 50 + radius * Math.sin(angleRad)
        };
    };

    return (
        <div className="widget" style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-glass)',
            borderRadius: '16px',
            padding: '24px',
            backdropFilter: 'var(--glass-blur)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: '350px' // Ensure height match
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{
                    margin: 0,
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    Satelliti Visibili ({satellites.length})
                </h3>
                <div style={{
                    color: '#00f3ff',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <span className="live-dot" style={{
                        width: '6px', height: '6px', background: '#00f3ff', borderRadius: '50%',
                        boxShadow: '0 0 8px #00f3ff'
                    }}></span>
                    LIVE
                </div>
            </div>

            <div style={{ position: 'relative', flex: 1, width: '100%' }}>
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>

                    {/* Background Grid */}
                    {/* Outer Horizon (0 deg el) */}
                    <circle cx="50" cy="50" r="45" fill="rgba(10, 14, 23, 0.5)" stroke="var(--border-glass)" strokeWidth="0.5" strokeDasharray="4 2" />
                    {/* 30 deg el */}
                    <circle cx="50" cy="50" r="30" fill="none" stroke="var(--border-glass)" strokeWidth="0.2" />
                    {/* 60 deg el */}
                    <circle cx="50" cy="50" r="15" fill="none" stroke="var(--border-glass)" strokeWidth="0.2" />

                    {/* Crosshairs */}
                    <line x1="50" y1="5" x2="50" y2="95" stroke="var(--border-glass)" strokeWidth="0.2" />
                    <line x1="5" y1="50" x2="95" y2="50" stroke="var(--border-glass)" strokeWidth="0.2" />

                    {/* Labels */}
                    <text x="50" y="3" fill="#00f3ff" fontSize="3" fontWeight="bold" textAnchor="middle">N</text>
                    <text x="98" y="51" fill="var(--text-secondary)" fontSize="2.5" textAnchor="middle">E</text>
                    <text x="50" y="99" fill="var(--text-secondary)" fontSize="2.5" textAnchor="middle">S</text>
                    <text x="2" y="51" fill="var(--text-secondary)" fontSize="2.5" textAnchor="middle">W</text>

                    {/* Satellites */}
                    {satellites.map((sat, i) => {
                        const pos = polarToCartesian(sat.azimuth, sat.elevation);
                        const isHighSignal = sat.elevation > 60;
                        return (
                            <g key={sat.name + i}>
                                <circle
                                    cx={pos.x}
                                    cy={pos.y}
                                    r={isHighSignal ? 1.5 : 1}
                                    fill={isHighSignal ? "#ffffff" : "#00f3ff"}
                                    opacity={isHighSignal ? 1 : 0.7}
                                    stroke="rgba(0, 243, 255, 0.4)"
                                    strokeWidth="1"
                                >
                                    <animate
                                        attributeName="r"
                                        values={isHighSignal ? "1.5;2;1.5" : "1;1.5;1"}
                                        dur="2s"
                                        repeatCount="indefinite"
                                    />
                                </circle>
                            </g>
                        );
                    })}

                </svg>

                {loading && (
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        color: 'var(--text-secondary)', fontSize: '0.8rem'
                    }}>
                        Calcolo Orbite...
                    </div>
                )}
            </div>

            <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                Lat: 44.7789 • Lon: 10.0525
            </div>
        </div>
    );
}

export default SatelliteMap;
