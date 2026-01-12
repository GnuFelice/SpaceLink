import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'rgba(10, 14, 23, 0.9)',
                border: '1px solid var(--accent-cyan)',
                padding: '10px',
                borderRadius: '8px',
                backdropFilter: 'blur(4px)'
            }}>
                <p style={{ margin: 0, color: '#fff', fontSize: '0.8rem' }}>
                    {new Date(label).toLocaleTimeString()}
                </p>
                {payload.map((pld) => (
                    <p key={pld.name} style={{ margin: '4px 0 0', color: pld.color, fontSize: '0.9rem' }}>
                        {pld.name}: <span style={{ fontWeight: 'bold' }}>{pld.value.toFixed(1)}</span> {pld.unit}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const HistoryChart = ({ data, title, dataKey, color, unit, domain, height = 200 }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="widget" style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-glass)',
            borderRadius: '16px',
            padding: '20px',
            backdropFilter: 'var(--glass-blur)',
            backdropFilter: 'var(--glass-blur)',
            // marginTop: '20px', // Removed for grid
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <h3 style={{
                marginTop: 0,
                marginBottom: '20px',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '1px'
            }}>{title}</h3>

            <div style={{ width: '100%', flex: 1, minHeight: 0 }}>
                <ResponsiveContainer>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id={`gradient_${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="timestamp"
                            tick={{ fill: '#666', fontSize: 10 }}
                            tickFormatter={(ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            minTickGap={30}
                        />
                        <YAxis
                            tick={{ fill: '#666', fontSize: 10 }}
                            domain={domain || ['auto', 'auto']}
                            width={35}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            fillOpacity={1}
                            fill={`url(#gradient_${dataKey})`}
                            unit={unit}
                            name={title}
                            activeDot={{ r: 4, strokeWidth: 0, fill: '#fff' }}
                            strokeWidth={2}
                            isAnimationActive={false} // Disable animation for performance on updates
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default HistoryChart;
