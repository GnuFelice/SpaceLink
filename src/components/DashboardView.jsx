import React, { useState } from 'react';
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
            {/* LEFT COLUMN: Sidebar (Static) */}
            <aside className="dashboard-sidebar">
                {/* Primary Status Card */}
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

                {/* Diagnostics Widget (kept for quick sensor check) */}
                <DiagnosticsWidget status={status} />
            </aside>

            {/* RIGHT COLUMN: Main Content */}
            <section className="dashboard-main" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gridTemplateRows: '1fr 180px', gap: '20px', height: '100%', minHeight: 0, overflow: 'visible' }}>
                {/* SkyMap */}
                <div style={{ width: '100%', height: '100%', minHeight: '0', gridColumn: '1 / 2', gridRow: '1 / 2' }}>
                    <SkyMap
                        obstructionData={status?.obstruction_stats}
                        uptime={status?.device_state?.uptime_s}
                    />
                </div>

                {/* Speedtest & Event Log */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', gridColumn: '2 / 3', gridRow: '1 / 2', height: '100%', minHeight: '0' }}>
                    <div style={{ flex: '0 0 auto' }}>
                        <SpeedtestWidget />
                    </div>
                    <div style={{ flex: '0 0 auto' }}>
                        <EventLogWidget excludeTypes={['LOGIN']} compact={true} limit={2} />
                    </div>
                </div>

                {/* History Charts */}
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
