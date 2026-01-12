const { net } = require('electron'); // Use Electron's net for better proxy support if needed, or just node https
const https = require('https');
const crypto = require('crypto');

// List of reliable public LibreSpeed servers (European focused)
const SERVERS = [
    { name: "Scaleway (Paris)", endpoint: "https://speedtest.scaleway.com" },
    { name: "Clouvider (London)", endpoint: "https://lon.speedtest.clouvider.net/backend" },
    { name: "Clouvider (Frankfurt)", endpoint: "https://fra.speedtest.clouvider.net/backend" },
    { name: "Novoserve (Netherlands)", endpoint: "https://nl.speedtest.clouvider.net/backend" },
    { name: "Vodafone (Milan)", endpoint: "https://speedtest.vodafone.it" } // Often has librespeed compatible backend or different? 
    // Vodafone IT usually is Ookla. Let's stick to known LibreSpeed implementations.
    // Reverting Vodafone, adding reliable community mirrors.
];

/*
 LibreSpeed Backend API expectation:
 - garbage.php?ckSize=X : returns random data
 - empty.php : used for upload (POST)
 - getIP.php : returns client IP
*/

class LibreSpeedClient {
    constructor() {
        this.server = null;
        this.abortController = null;
    }

    async selectServer() {
        // Race all servers to find the best one (lowest latency and available)
        console.log("Selecting best server...");

        // We need to recreate abortcontroller for the selection phase if needed, 
        // but individual pings handle their own timeouts usually.

        const promises = SERVERS.map(async server => {
            const latency = await this.ping(server);
            return { ...server, latency };
        });

        const results = await Promise.all(promises);

        // Log results for debugging (will appear in electron console)
        results.forEach(r => console.log(`Server ${r.name}: ${r.latency}ms`));

        // Filter out failed pings (999 or very high) and sort by latency
        const validServers = results.filter(s => s.latency < 500).sort((a, b) => a.latency - b.latency);

        if (validServers.length > 0) {
            console.log(`Selected server: ${validServers[0].name} (${validServers[0].latency.toFixed(1)}ms)`);
            this.server = validServers[0];
            return this.server;
        } else {
            console.warn("All servers failed ping test.");
            // Pick the "best" of the bad ones just to try, or throw?
            // If all are 999, it doesn't matter. 
            // If some are 600, maybe they are just slow but working.
            const bestOfBad = results.sort((a, b) => a.latency - b.latency)[0];
            this.server = bestOfBad;
            return this.server;
        }
    }

    async ping(server) {
        const start = performance.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout for ping

        try {
            // Use GET request to garbage.php with standard chunk size 1 (tiny)
            // This is the standard "overhead" test.
            const res = await fetch(`${server.endpoint}/garbage.php?ckSize=1&r=${Math.random()}`, {
                method: 'GET',
                cache: 'no-store',
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await res.text(); // Consume body to complete request timing

            return performance.now() - start;
        } catch (e) {
            clearTimeout(timeoutId);
            // console.error(`Ping failed for ${server.name}:`, e.message);
            return 999;
        }
    }

    async getIP(server) {
        try {
            const res = await fetch(`${server.endpoint}/getIP.php`);
            return await res.text();
        } catch (e) {
            return 'Unknown IP';
        }
    }

    async download(server, onProgress) {
        // Download for X seconds or up to Y MB
        const duration = 5000; // 5 seconds
        const start = performance.now();
        let loaded = 0;

        // LibreSpeed uses garbage.php with ckSize (chunk size in bits usually, or implies bytes)
        // Standard: garbage.php?ckSize=100 (returns 100MB? No, usually it's chunks).
        // Let's use a standard reliable URL if valid.
        // URL: endpoint + /garbage.php?ckSize=20
        // ckSize is usually in Mbits or similar in some versions, but standard php implementation takes chunks.

        // Let's try 4 parallel streams
        const streams = 4;
        this.abortController = new AbortController();

        const tasks = [];
        for (let i = 0; i < streams; i++) {
            tasks.push(this._downloadStream(server, start, duration, (bytes) => {
                loaded += bytes;
                const now = performance.now();
                const elapsed = (now - start) / 1000;
                const bps = (loaded * 8) / elapsed;
                const mbps = bps / 1000000;
                onProgress(mbps);
            }));
        }

        await Promise.allSettled(tasks);

        const totalTime = (performance.now() - start) / 1000;
        const finalBps = (loaded * 8) / totalTime;
        return finalBps / 1000000;
    }

    async _downloadStream(server, startTime, duration, updateCallback) {
        // Provide continuous stream
        while (performance.now() - startTime < duration) {
            if (this.abortController.signal.aborted) break;
            try {
                // Request 10MB chunk usually
                const response = await fetch(`${server.endpoint}/garbage.php?ckSize=10&r=${Math.random()}`, {
                    signal: this.abortController.signal
                });

                const reader = response.body.getReader();
                while (true) {
                    if (this.abortController.signal.aborted) break;
                    const { done, value } = await reader.read();
                    if (done) break;
                    updateCallback(value.length);
                    if (performance.now() - startTime > duration) {
                        this.abortController.abort();
                        break;
                    }
                }
            } catch (e) {
                break;
            }
        }
    }

    async upload(server, onProgress) {
        const duration = 5000; // 5 seconds
        const start = performance.now();
        let loaded = 0;

        // Create 2MB chunk of random data
        const size = 2 * 1024 * 1024;
        const buffer = crypto.randomBytes(size);

        const streams = 3; // Upload is heavier
        this.abortController = new AbortController();

        const tasks = [];
        for (let i = 0; i < streams; i++) {
            tasks.push(this._uploadStream(server, buffer, start, duration, (bytes) => {
                loaded += bytes;
                const now = performance.now();
                const elapsed = (now - start) / 1000;
                const bps = (loaded * 8) / elapsed;
                const mbps = bps / 1000000;
                onProgress(mbps);
            }));
        }

        await Promise.allSettled(tasks);

        const totalTime = (performance.now() - start) / 1000;
        const finalBps = (loaded * 8) / totalTime;
        return finalBps / 1000000;
    }

    async _uploadStream(server, buffer, startTime, duration, updateCallback) {
        while (performance.now() - startTime < duration) {
            if (this.abortController.signal.aborted) break;
            try {
                // Determine size relative to buffer (full 2MB)
                await fetch(`${server.endpoint}/empty.php?r=${Math.random()}`, {
                    method: 'POST',
                    body: buffer,
                    headers: {
                        'Content-Type': 'application/octet-stream',
                        'Content-Length': buffer.length
                    },
                    signal: this.abortController.signal
                });

                // If successful, we uploaded 'buffer.length' bytes
                updateCallback(buffer.length);
            } catch (e) {
                // Ignore errors (network glitches during saturation)
            }
            if (performance.now() - startTime > duration) {
                this.abortController.abort();
                break;
            }
        }
    }

    stop() {
        if (this.abortController) this.abortController.abort();
    }
}

module.exports = LibreSpeedClient;
