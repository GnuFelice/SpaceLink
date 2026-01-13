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

        // Create events table
        this.db.prepare(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER,
        type TEXT, -- 'INFO', 'WARNING', 'ERROR'
        message TEXT,
        details TEXT -- JSON string
      )
    `).run();
    }

    insertEvent(type, message, details = {}) {
        try {
            const stmt = this.db.prepare(`
        INSERT INTO events (timestamp, type, message, details)
        VALUES (?, ?, ?, ?)
      `);
            stmt.run(details.timestamp || Date.now(), type, message, JSON.stringify(details));
        } catch (err) {
            console.error('DB Event Insert Error:', err);
        }
    }

    checkExistingEvent(timestamp, type) {
        try {
            const stmt = this.db.prepare(`
                SELECT id FROM events WHERE timestamp = ? AND type = ?
            `);
            const result = stmt.get(timestamp, type);
            return !!result;
        } catch (err) {
            return false;
        }
    }

    // Keep only the latest event of a specific type/message, delete older ones
    pruneRedundantEvents(type, messagePattern) {
        try {
            // Find the latest one of this pattern
            const latest = this.db.prepare(`
                SELECT id, timestamp FROM events 
                WHERE type = ? AND message LIKE ? 
                ORDER BY timestamp DESC LIMIT 1
            `).get(type, messagePattern);

            if (latest) {
                // Delete ANY event matching the pattern that has a timestamp older than the latest,
                // OR has the same timestamp but a smaller ID (to handle exact duplicates)
                const info = this.db.prepare(`
                    DELETE FROM events 
                    WHERE type = ? 
                    AND message LIKE ? 
                    AND (timestamp < ? OR (timestamp = ? AND id < ?))
                `).run(type, messagePattern, latest.timestamp, latest.timestamp, latest.id);

                if (info.changes > 0) {
                    console.log(`Pruned ${info.changes} redundant '${messagePattern}' events.`);
                }
            } else {
                console.log(`No events found matching '${messagePattern}' to prune.`);
            }
        } catch (err) {
            console.error('Prune Error:', err);
        }
    }

    getEvents(limit = 50) {
        try {
            const stmt = this.db.prepare(`
        SELECT * FROM events ORDER BY timestamp DESC LIMIT ?
      `);
            return stmt.all(limit).map(evt => ({
                ...evt,
                details: evt.details ? JSON.parse(evt.details) : {}
            }));
        } catch (err) {
            console.error('DB Event Query Error:', err);
            return [];
        }
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
