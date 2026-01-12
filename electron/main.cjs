const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

const StarlinkService = require('./services/starlinkClient.cjs');

// Initialize Database
const TelemetryDB = require('./db/database.cjs');
const db = new TelemetryDB();

const SpeedtestService = require('./services/speedtest.cjs');
const speedtestService = new SpeedtestService();

// Initialize Service (Use Mock for dev if not on Starlink network, controlled by ENV or default)
const starlinkService = new StarlinkService(false);

const RouterService = require('./services/routerClient.cjs');
const routerService = new RouterService();

const tleService = require('./services/tleService.cjs');

const fs = require('fs');

// --- Settings Persistence ---
const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json');
const DEFAULT_SETTINGS = {
    latitude: 41.9028, // Rome (Default)
    longitude: 12.4964
};

let appSettings = { ...DEFAULT_SETTINGS };

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
});

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

            // Save to DB if valid data
            if (data && data.dish_get_status) {
                db.insertStats(data.dish_get_status);
            }

            return { success: true, data };
        } catch (error) {
            console.error("Starlink API Error:", error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('starlink:history', async () => {
        return db.getHistory(60); // Get last 60 seconds by default
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

    // Handle Speedtest
    ipcMain.handle('speedtest:run', async (event) => {
        try {
            const result = await speedtestService.run((progress) => {
                // Send progress to renderer
                // progress: { type: 'download'|'upload', speed: number }
                // Convert bytes/sec to Mbps if needed, but service does it? 
                // Service assumes speed passed is bytes/sec for download event from library?
                // Let's check service logic: speed * 8. So it's bits/sec.
                // We want Mbps for UI.
                const mbps = progress.speed / 1000000;

                // Find sending window (event.sender is WebContents)
                event.sender.send('speedtest:update', {
                    type: progress.type,
                    speed: mbps
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
        return routerService.getWifiStatus();
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
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
