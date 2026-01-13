const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

// Services
const StarlinkService = require('./services/starlinkClient.cjs');
const SpeedtestService = require('./services/speedtest.cjs');
const tleService = require('./services/tleService.cjs');
const TelemetryDB = require('./db/database.cjs');

// Initialize Database
// Initialize Database
const db = new TelemetryDB();
// Clean up redundant connection logs (Keep only latest)
db.pruneRedundantEvents('INFO', 'Connessione stabilita con Starlink%');

// Initialize Services
// Use Mock if not on Starlink network (controlled by ENV or default)
const starlinkService = new StarlinkService(false);
const speedtestService = new SpeedtestService();

// --- Settings Persistence ---
const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json');
const DEFAULT_SETTINGS = {
    latitude: 41.9028, // Rome (Default)
    longitude: 12.4964
};

let appSettings = { ...DEFAULT_SETTINGS };

// --- State Tracking for Events ---
let lastConnected = false;
let lastAlerts = {};

// Helper to log event
function logSystemEvent(type, message, details = {}) {
    console.log(`[EVENT ${type}] ${message}`);
    db.insertEvent(type, message, details);
}

function loadSettings() {
    try {
        if (fs.existsSync(SETTINGS_PATH)) {
            const data = fs.readFileSync(SETTINGS_PATH, 'utf-8');
            appSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
        } else {
            saveSettings(); // Create default
        }
    } catch (e) {
        console.error("Failed to load settings:", e);
    }
}

function saveSettings() {
    try {
        fs.writeFileSync(SETTINGS_PATH, JSON.stringify(appSettings, null, 2));
    } catch (e) {
        console.error("Failed to save settings:", e);
    }
}

// Load on start
app.whenReady().then(() => {
    loadSettings();
    updateLocationFromDish(); // Attempt to auto-detect location
});

// Auto-detect location from Dish
async function updateLocationFromDish() {
    try {
        console.log("Attempting to fetch location from Dish...");
        const response = await starlinkService.getLocation();
        if (response && response.get_location && response.get_location.lla) {
            const { lat, lon } = response.get_location.lla;
            if (lat && lon) {
                console.log(`Location detected: ${lat}, ${lon}. Updating settings.`);
                appSettings = { ...appSettings, latitude: lat, longitude: lon };
                saveSettings(); // Persist
            }
        }
    } catch (e) {
        console.warn("Could not auto-detect location (this is normal if GPS is disabled or debug mode is off):", e.message);
    }
}


// --- Outage Sync Logic ---
async function syncOutageHistory() {
    try {
        const history = await starlinkService.getHistory();
        if (history && history.outages) {
            // Ensure array
            const outages = Array.isArray(history.outages) ? history.outages : [];

            let newCount = 0;
            for (const outage of outages) {
                // Starlink uses GPS Time (start from 1980) in nanoseconds
                // Unix Epoch is 1970
                // Offset is roughly 315964800 seconds (10 years + leap seconds)
                // Precise offset: GPS Epoch is Jan 6, 1980 00:00:00 UTC
                // UNIX Epoch is Jan 1, 1970 00:00:00 UTC
                // Difference is 315964800 seconds exactly (plus leap seconds since 1980)
                // Currently GPS is ahead of UTC by ~18 seconds (leap seconds)
                // But for general display, just adding the 10 years offset is close enough.
                // 315964800000 milliseconds.

                const gpsTimeNs = BigInt(outage.start_timestamp_ns);
                const gpsTimeMs = Number(gpsTimeNs / 1000000n);

                // Convert GPS Time to Unix Time (approximate)
                // GPS Epoch (1980) -> Unix Epoch (1970) delta is 315964800000ms
                const unixTimeMs = gpsTimeMs + 315964800000;

                const cause = outage.cause;

                // Avoid duplicate logging
                if (!db.checkExistingEvent(unixTimeMs, 'HISTORY_ALARM')) {
                    const durationSec = Number(BigInt(outage.duration_ns) / 1000000000n);

                    // Translate Cause Code to Strings if they are Enums
                    // "BOOTING" comes as string from grpc-js if enum is resolved?
                    // If proto loader options enums=String, it should be a string.

                    logSystemEvent('HISTORY_ALARM', `Interruzione passata: ${cause} (${durationSec}s)`, {
                        cause: cause,
                        duration_s: durationSec,
                        timestamp: unixTimeMs
                    });
                    newCount++;
                }
            }
            if (newCount > 0) {
                console.log(`Synced ${newCount} historical outages.`);
            }
        }
    } catch (e) {
        console.warn("Outage Sync Failed:", e.message);
    }
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        // Deep Space theme foundation
        backgroundColor: '#0a0e17',
        titleBarStyle: 'hidden', // Custom title bar
        titleBarOverlay: {
            color: '#0a0e17',
            symbolColor: '#00f3ff',
            height: 32
        }
    });

    // IPC Handlers
    ipcMain.handle('starlink:status', async () => {
        try {
            const data = await starlinkService.getStatus();

            // --- Event Logic ---
            if (!lastConnected) {
                lastConnected = true;
                logSystemEvent('INFO', 'Connessione stabilita con Starlink', { hardware_version: data?.dish_get_status?.device_info?.hardware_version });
                // Prune duplicates immediately to ensure only THIS one remains visible
                db.pruneRedundantEvents('INFO', 'Connessione stabilita con Starlink%');
            }

            if (data && data.dish_get_status) {
                // Save stats
                db.insertStats(data.dish_get_status);

                // Check Alerts
                const currentAlerts = data.dish_get_status.alerts || {};

                // key-value pairs where value is boolean true/false
                for (const [key, value] of Object.entries(currentAlerts)) {
                    const wasActive = lastAlerts[key] === true;
                    const isActive = value === true;

                    if (isActive && !wasActive) {
                        // Alert Raised
                        logSystemEvent('WARNING', `Allerta attivata: ${key}`, { alert: key });
                    } else if (!isActive && wasActive) {
                        // Alert Cleared
                        logSystemEvent('INFO', `Allerta risolta: ${key}`, { alert: key });
                    }
                }
                lastAlerts = { ...currentAlerts };

                // Trigger Background Sync occasionally (e.g. random chance or timer)
                // For now, call it if we have valid data, but throttle via logic globally if needed.
                // Or just call it every time status updates (1s) is too much?
                // Let's just call it every 1 minute using a simple timer outside or...
                // Actually, let's just call it here with a throttle check.
            }

            return { success: true, data };
        } catch (error) {
            // Track Disconnection
            if (lastConnected) {
                lastConnected = false;
                logSystemEvent('ERROR', 'Connessione persa con Starlink', { error: error.message });
            }
            console.error("Starlink API Error:", error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('starlink:history', async () => {
        return db.getHistory(60); // Get last 60 seconds by default
    });

    ipcMain.handle('events:get', async (_, limit) => {
        return db.getEvents(limit || 50);
    });



    // Handle Satellites Data
    ipcMain.handle('starlink:satellites', async () => {
        // Return visible satellites for the user location
        return tleService.getVisibleSatellites(appSettings.latitude, appSettings.longitude);
    });

    // Settings Handlers
    ipcMain.handle('settings:get', async () => {
        return { success: true, data: appSettings };
    });

    ipcMain.handle('settings:set', async (event, newSettings) => {
        try {
            appSettings = { ...appSettings, ...newSettings };
            saveSettings();
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    });

    // Get App Version
    ipcMain.handle('app:version', () => {
        return { success: true, version: app.getVersion() };
    });

    // Handle Speedtest
    ipcMain.handle('speedtest:run', async (event) => {
        try {
            const result = await speedtestService.run((progress) => {
                // Send progress to renderer
                // progress: { type: 'download'|'upload', speed: number }
                // Service passes Mbps directly from LibreSpeedClient.

                // Find sending window (event.sender is WebContents)
                event.sender.send('speedtest:update', {
                    type: progress.type,
                    speed: progress.speed
                });
            });
            return { success: true, data: result };
        } catch (e) {
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle('starlink:reboot', async () => {
        try {
            await starlinkService.reboot();
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle('starlink:stow', async () => {
        try {
            await starlinkService.stow(false);
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle('router:status', async () => {
        // return routerService.getWifiStatus();
        return { success: false, error: "Not Implemented" };
    });

    ipcMain.handle('starlink:unstow', async () => {
        try {
            await starlinkService.stow(true);
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        // mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(async () => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    // Start periodical sync
    syncOutageHistory(); // Run immediately
    setInterval(syncOutageHistory, 60000); // Check every minute
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
