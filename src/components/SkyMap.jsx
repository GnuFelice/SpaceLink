import React, { useEffect, useState } from 'react';

/**
 * Unified SkyMap Component
 * Visualizes:
 * 1. Obstruction Wedges (Red/Clear)
 * 2. Satellite Positions (Real-time projected)
 * 3. Compass Grid & Sonar Scanner
 */
function SkyMap({ obstructionData, uptime }) {
    const [satellites, setSatellites] = useState([]);
    const [loadingSats, setLoadingSats] = useState(true);

    // Fetch Satellites Logic
    useEffect(() => {
        const fetchSats = async () => {
            try {
                if (window.electronAPI) {
                    const sats = await window.electronAPI.getSatellites();
                    setSatellites(sats);
                    setLoadingSats(false);
                }
            } catch (err) {
                console.error("Failed to fetch satellites:", err);
                setLoadingSats(false);
            }
        };

        fetchSats();
        const interval = setInterval(fetchSats, 3000);
        return () => clearInterval(interval);
    }, []);

    // --- Data Processing ---

    // Obstructions
    // Default to clear sky if no data
    const wedges = obstructionData?.wedge_fraction_obstructed || Array(12).fill(0.0);
    const totalObstructed = obstructionData?.fraction_obstructed
        ? (obstructionData.fraction_obstructed * 100).toFixed(1)
        : '0.0';

    // Validity
    const validSeconds = obstructionData?.valid_s || uptime;
    const isValid = validSeconds > 0;

    // --- Helpers ---

    // Polar to Cartesian for SVG (0,0 is top-left, 50,50 is center)
    // Radius max = 45 (keeps 5 padding)
    const polarToCartesian = (azimuth, elevation, radiusMax = 45) => {
        // Starlink Azimuth: 0=N, 90=E, 180=S, 270=W
        // SVG math: 0 rad = 3 o'clock (East).
        // Rotate -90 deg to make 0 rad = North?
        // Let's standard: 
        // angle = (azimuth - 90 deg) converts Azimuth(0=N) to Math(0=E is -90?)
        // Wait. N(0) -> -90 (Top). E(90) -> 0 (Right). S(180) -> 90 (Bottom). W(270) -> 180 (Left).
        // Correct conversion: (azimuth - 90) * PI/180

        const r = (90 - elevation) / 90 * radiusMax;
        const angleRad = (azimuth - 90) * (Math.PI / 180);

        return {
            x: 50 + r * Math.cos(angleRad),
            y: 50 + r * Math.sin(angleRad)
        };
    };

    // Wedge Path Generator
    // Index 0 = North = Center 90deg? 
    // Previous logic: Recharts start 105, end -255. 
    // Index 0 covered 75deg to 105deg (centered on 90deg Top).
    // In SVG (0=Right, -90=Top):
    // North is -90.
    // Index 0 (North) needs to span -105 to -75. (-90 +/- 15).
    // Let's verify clockwise.
    // Index 1 (NE) -> -75 to -45.
    // Index 2 (E) -> -45 to -15.
    // Index 3 (E-SE) -> -15 to 15 (Crosses 0).
    const createWedgePath = (index, cx, cy, r) => {
        // Sector width = 30 deg
        // Start Angle (Clockwise from North-ish left side)
        // Index 0 center = -90. Start = -105. End = -75.
        // Formula: start = -105 + (index * 30). end = start + 30.

        let startDeg = -105 + (index * 30);
        let endDeg = startDeg + 30;

        const startRad = startDeg * (Math.PI / 180);
        const endRad = endDeg * (Math.PI / 180);

        const x1 = cx + r * Math.cos(startRad);
        const y1 = cy + r * Math.sin(startRad);
        const x2 = cx + r * Math.cos(endRad);
        const y2 = cy + r * Math.sin(endRad);

        return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
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
            position: 'relative',
            overflow: 'hidden',
            height: '100%',
            boxSizing: 'border-box'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2, marginBottom: '10px' }}>
                <div>
                    <h3 style={{
                        margin: 0,
                        color: 'var(--text-secondary)',
                        fontSize: '0.9rem',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                        Sky Map
                    </h3>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Ostruzioni & Satelliti
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    {/* Obstruction Badge */}
                    <div style={{
                        background: Number(totalObstructed) > 0 ? 'rgba(255, 51, 102, 0.1)' : 'rgba(0, 243, 255, 0.1)',
                        border: `1px solid ${Number(totalObstructed) > 0 ? '#ff3366' : '#00f3ff'}`,
                        color: Number(totalObstructed) > 0 ? '#ff3366' : '#00f3ff',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                    }}>
                        {Number(totalObstructed) > 0 ? `${totalObstructed}% OSTRUITO` : 'CIELO LIBERO'}
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div style={{ position: 'relative', flex: 1, minHeight: 0, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>

                {/* CSS Scanner Animation Layer */}
                <div className="radar-scanner" style={{ opacity: 0.6, zIndex: 10 }}></div>

                <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', maxHeight: '100%', maxWidth: '100%' }}>
                    <defs>
                        <radialGradient id="clearSkyGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                            <stop offset="0%" stopColor="#00f3ff" stopOpacity="0.05" />
                            <stop offset="100%" stopColor="#00f3ff" stopOpacity="0.0" />
                        </radialGradient>
                    </defs>

                    {/* LAYER 1: Obstruction Wedges */}
                    <g className="obstruction-layer">
                        {wedges.map((val, i) => {
                            const isObstructed = val > 0;
                            let fill = 'transparent';
                            let opacity = 0.0;

                            if (isObstructed) {
                                fill = '#ff3366';
                                opacity = 0.5 + (val * 4);
                                if (opacity > 0.9) opacity = 0.9;
                            } else {
                                // Subtle highlight for "Known Clear" vs "Unknown"?
                                // Just use transparent for clear to let the cool grid show
                            }

                            return (
                                <path
                                    key={`wedge-${i}`}
                                    d={createWedgePath(i, 50, 50, 45)} // Use max radius for wedges
                                    fill={fill}
                                    fillOpacity={opacity}
                                    stroke="rgba(0,0,0,0.2)" // Slight separator
                                    strokeWidth="0.1"
                                />
                            );
                        })}
                    </g>

                    {/* LAYER 2: Grid & HUD */}
                    <g className="grid-layer">
                        {/* Outer Ring */}
                        <circle cx="50" cy="50" r="45" fill="url(#clearSkyGradient)" stroke="rgba(0, 243, 255, 0.3)" strokeWidth="0.5" strokeDasharray="4 2" />
                        {/* 30 deg el (r=30) */}
                        <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(0, 243, 255, 0.15)" strokeWidth="0.2" />
                        {/* 60 deg el (r=15) */}
                        <circle cx="50" cy="50" r="15" fill="none" stroke="rgba(0, 243, 255, 0.15)" strokeWidth="0.2" />

                        {/* Lines */}
                        <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(0, 243, 255, 0.15)" strokeWidth="0.2" />
                        <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(0, 243, 255, 0.15)" strokeWidth="0.2" />

                        {/* Labels */}
                        <text x="50" y="3" fill="#00f3ff" fontSize="3" fontWeight="bold" textAnchor="middle" style={{ textShadow: '0 0 10px #00f3ff' }}>N</text>
                        <text x="98" y="51" fill="var(--text-secondary)" fontSize="2.5" textAnchor="middle">E</text>
                        <text x="50" y="99" fill="var(--text-secondary)" fontSize="2.5" textAnchor="middle">S</text>
                        <text x="2" y="51" fill="var(--text-secondary)" fontSize="2.5" textAnchor="middle">W</text>
                    </g>

                    {/* LAYER 3: Satellites */}
                    <g className="satellites-layer">
                        {satellites.map((sat, i) => {
                            const pos = polarToCartesian(sat.azimuth, sat.elevation);
                            const isHighSignal = sat.elevation > 60;
                            return (
                                <circle
                                    key={`sat-${i}`}
                                    cx={pos.x}
                                    cy={pos.y}
                                    r={isHighSignal ? 0.7 : 0.4}
                                    fill={isHighSignal ? "#ffffff" : "#00f3ff"}
                                    opacity={isHighSignal ? 0.9 : 0.6}
                                >
                                    {isHighSignal && (
                                        <animate
                                            attributeName="r"
                                            values="0.7;1.0;0.7"
                                            dur="2s"
                                            repeatCount="indefinite"
                                        />
                                    )}
                                </circle>
                            );
                        })}
                    </g>

                </svg>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                <span>
                    {loadingSats ? "Ricerca Satelliti..." : `${satellites.length} Sat visibili`}
                </span>
                <span>
                    {isValid ? `Dati validi da: ${Math.round(validSeconds / 60)}m` : "Attesa dati..."}
                </span>
            </div>
        </div>
    );
}

export default SkyMap;
