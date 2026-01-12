const LibreSpeedClient = require('./libreSpeedClient.cjs');

class SpeedtestService {
    constructor() {
        this.running = false;
        this.client = new LibreSpeedClient();
    }

    async run(onProgress) {
        if (this.running) throw new Error("Test already running");
        this.running = true;

        try {
            // 1. Select Server
            const server = await this.client.selectServer();

            // 2. Ping
            const ping = await this.client.ping(server);
            // Report intermediate result? We don't have a specific event for ping only in UI yet, 
            // but we can just store it.

            const clientIP = await this.client.getIP(server);

            // 3. Download
            // Emit start download
            if (onProgress) onProgress({ type: 'download', speed: 0 });

            const downloadSpeed = await this.client.download(server, (speed) => {
                if (onProgress) onProgress({ type: 'download', speed: speed });
            });

            // 4. Upload
            if (onProgress) onProgress({ type: 'upload', speed: 0 });

            const uploadSpeed = await this.client.upload(server, (speed) => {
                if (onProgress) onProgress({ type: 'upload', speed: speed });
            });

            this.running = false;

            return {
                ping: ping,
                download: downloadSpeed,
                upload: uploadSpeed,
                ip: clientIP,
                server: `${server.name} (LibreSpeed)` // Simplified server info
            };

        } catch (err) {
            this.running = false;
            this.client.stop();
            throw err;
        }
    }
}

module.exports = SpeedtestService;
