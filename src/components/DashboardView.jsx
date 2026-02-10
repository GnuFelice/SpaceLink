import React from 'react';
import StatusCard from './StatusCard';
import HistoryChart from './HistoryChart';
import SkyMap from './SkyMap';
import SpeedtestWidget from './SpeedtestWidget';
import DiagnosticsWidget from './DiagnosticsWidget';
import AlignmentWidget from './AlignmentWidget';
import EventLogWidget from './EventLogWidget';

function DashboardView({ status, history, formatSpeed, needsAlignment, hasMotors }) {
    return (
        <div className="dashboard-compact">
            {/* LEFT COLUMN: Sidebar (Metrics) */}
            <aside className="dashboard-sidebar">
                {/* Primary Status Card - Shows connection state + power consumption */}
                <StatusCard
                    title="Stato"
                    value={status ? 'ONLINE' : 'OFFLINE'}
                    icon={status ? 'wifi' : 'wifi_off'}
                    status={status ? 'good' : 'error'}
                    secondaryValue={status?.power_in ? status.power_in.toFixed(1) : '---'}
                    secondarySub="W"
                    secondaryLabel="Consumo"
                />

                {(needsAlignment || status?.alignment_stats) && (
                    <AlignmentWidget alignmentStats={status?.alignment_stats} hasMotors={hasMotors} />
                )}

                {/* Diagnostics Widget - Pass capabilities for sensor filtering */}
                <DiagnosticsWidget status={status} />

                {/* Metrics Stack */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <StatusCard
                        title="Download"
                        value={status ? formatSpeed(status.downlink_throughput_bps) : '---'}
                        sub="Mbps"
                        icon="arrow_downward"
                    />
                    <StatusCard
                        title="Upload"
                        value={status ? formatSpeed(status.uplink_throughput_bps) : '---'}
                        sub="Mbps"
                        icon="arrow_upward"
                    />
                    <StatusCard
                        title="Latenza"
                        value={status ? Math.round(status.pop_ping_latency_ms) : '---'}
                        sub="ms"
                        icon="speed"
                    />
                    <StatusCard
                        title="SNR"
                        value={status ? (status.snr !== undefined && status.snr !== null ? status.snr.toFixed(1) : '---') : '---'}
                        sub="dB"
                        icon="signal_cellular_alt"
                    />
                </div>
            </aside>

            {/* RIGHT COLUMN: Main Visuals */}
            <section className="dashboard-main">
                {/* Sky Map (Dominant) */}
                <div style={{ width: '100%', height: '100%', minHeight: '0', gridColumn: '1 / 2', gridRow: '1 / 2' }}>
                    <SkyMap
                        obstructionData={status?.obstruction_stats}
                        uptime={status?.device_state?.uptime_s}
                    />
                </div>

                {/* Speedtest Widget & Event Log (Right Column) */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', gridColumn: '2 / 3', gridRow: '1 / 2', height: '100%', minHeight: '0' }}>
                    <div style={{ flex: '0 0 auto' }}>
                        <SpeedtestWidget />
                    </div>
                    <div style={{ flex: '0 0 auto' }}>
                        {/* Dashboard version: Exclude LOGINS, Limit to 2 */}
                        <EventLogWidget excludeTypes={['LOGIN']} compact={true} limit={2} />
                    </div>
                </div>

                {/* History Charts (Bottom Row) */}
                <div className="mini-charts-row" style={{ gridColumn: '1 / -1', gridRow: '2 / 3' }}>
                    <div style={{ flex: 1 }}>
                        <HistoryChart
                            title="Velocità"
                            data={history}
                            dataKey="downlink_mbps"
                            color="#00f3ff"
                            unit=" Mbps"
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <HistoryChart
                            title="Latenza"
                            data={history}
                            dataKey="latency"
                            color="#ffb700"
                            unit=" ms"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}

export default DashboardView;
