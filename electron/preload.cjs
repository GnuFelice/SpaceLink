const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    ping: () => ipcRenderer.invoke('ping'),
    getStarlinkStatus: () => ipcRenderer.invoke('starlink:status'),
    getStarlinkHistory: () => ipcRenderer.invoke('starlink:history'),
    reboot: () => ipcRenderer.invoke('starlink:reboot'),
    stow: () => ipcRenderer.invoke('starlink:stow'),
    unstow: () => ipcRenderer.invoke('starlink:unstow'),
    getSatellites: () => ipcRenderer.invoke('starlink:satellites'),
    getRouterStatus: () => ipcRenderer.invoke('router:status'),
    getSettings: () => ipcRenderer.invoke('settings:get'),
    saveSettings: (settings) => ipcRenderer.invoke('settings:set', settings),

    // Speedtest
    runSpeedtest: () => ipcRenderer.invoke('speedtest:run'),
    onSpeedtestUpdate: (callback) => {
        const listener = (event, value) => callback(event, value);
        ipcRenderer.on('speedtest:update', listener);
        // Return cleanup function
        return () => ipcRenderer.removeListener('speedtest:update', listener);
    }
});
