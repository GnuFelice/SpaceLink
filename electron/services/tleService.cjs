const axios = require('axios');
const fs = require('fs');
const path = require('path');
const satellite = require('satellite.js');

const TLE_URL = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle';
const CACHE_FILE = path.join(__dirname, '../../starlink_tle_cache.txt');
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

class TleService {
    constructor() {
        this.tles = [];
        this.lastUpdate = 0;
        this.loadCache();
    }

    async loadCache() {
        try {
            if (fs.existsSync(CACHE_FILE)) {
                const stats = fs.statSync(CACHE_FILE);
                if (Date.now() - stats.mtimeMs < CACHE_DURATION_MS) {
                    console.log('Loading TLEs from cache...');
                    const data = fs.readFileSync(CACHE_FILE, 'utf-8');
                    this.parseTLEs(data);
                    return;
                }
            }
        } catch (err) {
            console.error('Error loading TLE cache:', err);
        }
        await this.updateTLEs();
    }

    async updateTLEs() {
        try {
            console.log('Fetching new TLEs from Celestrak...');
            const response = await axios.get(TLE_URL);
            fs.writeFileSync(CACHE_FILE, response.data);
            this.parseTLEs(response.data);
            console.log(`Updated ${this.tles.length} TLEs.`);
        } catch (err) {
            console.error('Failed to update TLEs:', err);
        }
    }

    parseTLEs(rawTle) {
        const lines = rawTle.split(/\r?\n/);
        this.tles = [];
        // TLE format is 3 lines (Name, Line 1, Line 2)
        for (let i = 0; i < lines.length; i += 3) {
            if (lines[i] && lines[i + 1] && lines[i + 2]) {
                this.tles.push({
                    name: lines[i].trim(),
                    line1: lines[i + 1].trim(),
                    line2: lines[i + 2].trim()
                });
            }
        }
    }

    /**
     * Returns satellites visible from a given location.
     * @param {number} observerLat 
     * @param {number} observerLon 
     * @param {number} observerAlt (km)
     * @param {number} minElevation (degrees)
     */
    getVisibleSatellites(observerLat, observerLon, observerAlt = 0.05, minElevation = 25) {
        const visibleSats = [];

        // Define observer
        // satellite.js expects degrees for geodetic, but radians only for certain funcs?
        // Actually satellite.geodeticToEcf requires radians? No, let's use built-in helpers.

        const gmst = satellite.gstime(new Date());

        this.tles.forEach(tle => {
            const satrec = satellite.twoline2satrec(tle.line1, tle.line2);

            // Propagate
            const positionAndVelocity = satellite.propagate(satrec, new Date());
            const positionEci = positionAndVelocity.position;

            if (!positionEci || !positionEci.x) return; // Error in propagation

            const observerGd = {
                latitude: satellite.degreesToRadians(observerLat),
                longitude: satellite.degreesToRadians(observerLon),
                height: observerAlt
            };

            const positionEcf = satellite.eciToEcf(positionEci, gmst);
            const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);

            const azimuth = satellite.radiansToDegrees(lookAngles.azimuth);
            const elevation = satellite.radiansToDegrees(lookAngles.elevation);
            const rangeSat = lookAngles.rangeSat; // in km

            // Calculate Velocity (scalar speed in km/s)
            const velocityEci = positionAndVelocity.velocity;
            const velocity = Math.sqrt(
                Math.pow(velocityEci.x, 2) +
                Math.pow(velocityEci.y, 2) +
                Math.pow(velocityEci.z, 2)
            );

            // Calculate Altitude (Height in km)
            const positionGd = satellite.eciToGeodetic(positionEci, gmst);
            const height = positionGd.height;

            if (elevation > minElevation) {
                visibleSats.push({
                    name: tle.name,
                    azimuth,
                    elevation,
                    range: rangeSat,
                    velocity: velocity.toFixed(2),
                    height: height.toFixed(1),
                    signalQuality: Math.min(100, (elevation / 90) * 100)
                });
            }
        });

        // specific sorting: highest elevation first
        return visibleSats.sort((a, b) => b.elevation - a.elevation);
    }
}

module.exports = new TleService();
