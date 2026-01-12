const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

class TelemetryDB {
    constructor() {
        // Store DB in the user data folder for persistence across updates
        const dbPath = path.join(app.getPath('userData'), 'spacelink.db');
        this.db = new Database(dbPath);
        this.init();
    }

    init() {
        // Create telemetry table if it doesn't exist
        // timestamp is stored as Unix epoch (milliseconds)
        this.db.prepare(`
      CREATE TABLE IF NOT EXISTS telemetry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER,
        downlink REAL,
        uplink REAL,
        latency REAL,
        snr REAL
      )
    `).run();

        // Create index on timestamp for faster graph queries
        this.db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_timestamp ON telemetry(timestamp)
    `).run();
    }

    insertStats(stats) {
        if (!stats) return;

        try {
            const stmt = this.db.prepare(`
        INSERT INTO telemetry (timestamp, downlink, uplink, latency, snr)
        VALUES (?, ?, ?, ?, ?)
      `);

            stmt.run(
                Date.now(),
                stats.downlink_throughput_bps || 0,
                stats.uplink_throughput_bps || 0,
                stats.pop_ping_latency_ms || 0,
                stats.snr || 0
            );
        } catch (err) {
            console.error('DB Insert Error:', err);
        }
    }

    getHistory(limit = 60) {
        try {
            // Get last N records ordered by time ascending (for charts)
            const stmt = this.db.prepare(`
        SELECT * FROM (
          SELECT timestamp, downlink, uplink, latency, snr 
          FROM telemetry 
          ORDER BY timestamp DESC 
          LIMIT ?
        ) ORDER BY timestamp ASC
      `);
            return stmt.all(limit);
        } catch (err) {
            console.error('DB Query Error:', err);
            return [];
        }
    }

    // Clean up old data to prevent DB from growing too large (keep last 24h ~ 86400 records if 1s poll)
    pruneHistory() {
        try {
            // Keep last 100,000 records approx
            const retentionLimit = 100000;
            this.db.prepare(`
              DELETE FROM telemetry WHERE id NOT IN (
                  SELECT id FROM telemetry ORDER BY id DESC LIMIT ?
              )
          `).run(retentionLimit);
        } catch (err) {
            console.error('DB Prune Error:', err);
        }
    }
}

module.exports = TelemetryDB;
