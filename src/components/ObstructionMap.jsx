import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const RADIAN = Math.PI / 180;

function ObstructionMap({ data, uptime }) {
    // Default to 12 zero-wedges if data is missing
    const wedges = data?.wedge_fraction_obstructed || Array(12).fill(0.0);
    const totalObstructed = data?.fraction_obstructed ? (data.fraction_fraction_obstructed * 100).toFixed(1) : '0.0';

    // Validity logic
    const validSeconds = data?.valid_s || uptime;
    const isValid = validSeconds > 0;

    // Create 12 equal slices
    // Starlink wedges are usually North aligned. 
    // PieChart starts at 3 o'clock (0 deg) counter-clockwise by default.
    // We want index 0 to be North. 
    // North is 90 deg in Recharts (top).
    // Slices are drawn counter-clockwise? Or clockwise?
    // Recharts `startAngle` 90 (top) and `endAngle` -270 makes a full circle clockwise.

    const chartData = wedges.map((val, index) => {
        // Determine color based on obstruction.
        // > 0 = Obstructed (Red). 0 = Clear (Faint Blue/Transparent).
        // Normalize opacity: even small obstruction should be visible.
        let color = '#00f3ff';
        let opacity = 0.2; // Increased from 0.1 to 0.2 for better visibility against dark bg

        if (val > 0) {
            color = '#ff3366';
            opacity = 0.6 + (val * 4); // Scale opacity with obstruction, min 0.6
            if (opacity > 1) opacity = 1;
        }

        return {
            name: `Settore ${index}`,
            value: 1, // Equal size slice
            obstruction: val,
            color,
            opacity
        };
    });

    return (
        <div className="widget" style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-glass)',
            borderRadius: '16px',
            padding: '24px',
            backdropFilter: 'var(--glass-blur)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{
                    margin: 0,
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    Mappa Ostruzioni
                </h3>
                <div style={{
                    background: Number(totalObstructed) > 0 ? 'rgba(255, 51, 102, 0.1)' : 'rgba(0, 243, 255, 0.1)',
                    border: `1px solid ${Number(totalObstructed) > 0 ? '#ff3366' : '#00f3ff'}`,
                    color: Number(totalObstructed) > 0 ? '#ff3366' : '#00f3ff',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease'
                }}>
                    {Number(totalObstructed) > 0 ? `${totalObstructed}% OSTRUITO` : 'CIELO LIBERO'}
                </div>
            </div>

            <div style={{ height: '300px', width: '100%', marginTop: '20px', position: 'relative' }}>

                {/* Decorative Compass/Sonar Rings Background */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'
                }}>
                    {/* Outer Ring */}
                    <div style={{ width: '80%', height: '80%', border: '1px dashed rgba(0, 243, 255, 0.3)', borderRadius: '50%', position: 'absolute' }}></div>
                    {/* Inner Ring */}
                    <div style={{ width: '40%', height: '40%', border: '1px solid rgba(0, 243, 255, 0.2)', borderRadius: '50%', position: 'absolute' }}></div>
                    {/* Crosshair */}
                    <div style={{ width: '100%', height: '1px', background: 'rgba(0, 243, 255, 0.1)', position: 'absolute' }}></div>
                    <div style={{ width: '1px', height: '100%', background: 'rgba(0, 243, 255, 0.1)', position: 'absolute' }}></div>
                    {/* North Label */}
                    <div style={{ position: 'absolute', top: '5%', color: '#00f3ff', fontWeight: 'bold', fontSize: '0.9rem', textShadow: '0 0 10px #00f3ff' }}>N</div>
                    <div style={{ position: 'absolute', bottom: '5%', color: 'rgba(0, 243, 255, 0.5)', fontSize: '0.7rem' }}>S</div>
                    <div style={{ position: 'absolute', right: '5%', color: 'rgba(0, 243, 255, 0.5)', fontSize: '0.7rem' }}>E</div>
                    <div style={{ position: 'absolute', left: '5%', color: 'rgba(0, 243, 255, 0.5)', fontSize: '0.7rem' }}>W</div>

                    {/* Active Scanner Line */}
                    <div className="radar-scanner"></div>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={0}
                            outerRadius="80%"
                            startAngle={105}   /* Aligning wedges so North (index 0) is top center. 360/12=30. Top is 90. 90 + 15 = 105 to center the wedge? Index 0 covers 30 deg. */
                            endAngle={-255}    /* 360 later */
                            stroke="#0a0e17"   // Dark stroke to separate slices cleanly
                            strokeWidth={2}
                            dataKey="value"
                            isAnimationActive={false}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={entry.opacity} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {isValid && (
                    <span style={{ marginRight: '15px' }}>
                        ⏱ Scansione attiva da: {Math.round(validSeconds / 60)} min
                    </span>
                )}
            </div>
        </div>
    );
}

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const isObstructed = data.obstruction > 0;
        return (
            <div style={{
                backgroundColor: 'rgba(10, 14, 23, 0.95)',
                border: '1px solid var(--border-glass)',
                borderRadius: '8px',
                padding: '12px',
                color: '#ffffff', // Force white text
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#00f3ff' }}>{data.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                    <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: isObstructed ? '#ff3366' : '#00f3ff'
                    }} />
                    <span>
                        {isObstructed
                            ? `Ostruzione: ${(data.obstruction * 100).toFixed(1)}%`
                            : 'Cielo Libero'}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

export default ObstructionMap;
