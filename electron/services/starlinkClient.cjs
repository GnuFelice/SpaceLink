const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const util = require('util');

const PROTO_PATH = path.join(__dirname, 'starlink.proto');
const DISH_ADDR = '192.168.100.1:9200';

// Mock data generator for development without a dish
class MockStarlinkClient {
    constructor() {
        console.log('Using Mock Starlink Client');
    }

    getStatus(cb) {
        // Simulate network delay
        setTimeout(() => {
            cb(null, {
                dish_get_status: {
                    device_info: {
                        id: 'MOCK-GEN3-001',
                        hardware_version: 'rev4_prod', // Gen 3 Standard
                        software_version: '2026.01.0.mr1234',
                        country_code: 'IT'
                    },
                    device_state: { uptime_s: process.uptime() },
                    snr: 9,
                    downlink_throughput_bps: Math.random() * 350 * 1000000, // Gen 3 is faster
                    uplink_throughput_bps: Math.random() * 40 * 1000000,
                    pop_ping_latency_ms: 20 + Math.random() * 15,
                    obstruction_stats: {
                        fraction_obstructed: 0.15, // 15% obstructed
                        valid_s: 3600,
                        wedge_fraction_obstructed: Array.from({ length: 12 }, (_, i) =>
                            (i < 3 || i > 9) ? Math.random() * 0.8 : 0 // North/NorthEast obstructed
                        )
                    },
                    // Gen 3 Alignment Data (Mocked as slightly misaligned)
                    alignment_stats: {
                        boresight_azimuth_deg: 175.5,
                        boresight_elevation_deg: 65.2,
                        desired_boresight_azimuth_deg: 180.0, // South (Northern Hemisphere)
                        desired_boresight_elevation_deg: 70.0
                    },
                    alerts: { motors_stuck: false, thermal_throttle: false, roaming: false }
                }
            });
        }, 100);
    }

    getHistory(cb) {
        setTimeout(() => {
            const generateHistory = (min, max) =>
                Array.from({ length: 120 }, () => min + Math.random() * (max - min));

            cb(null, {
                dish_get_history: {
                    current: Date.now(),
                    pop_ping_latency_ms: generateHistory(15, 40),
                    downlink_throughput_bps: generateHistory(5000000, 350000000),
                    uplink_throughput_bps: generateHistory(1000000, 50000000)
                }
            });
        }, 100);
    }

    reboot(cb) {
        console.log('MOCK: Rebooting...');
        setTimeout(() => cb(null, {}), 500);
    }

    stow(req, cb) {
        // Gen 3 has no motors, so stow should fail or just log
        // But the Service layer catches this. If called directly:
        console.warn('MOCK: Stow called on Gen 3 (Hardware is static). Ignoring.');
        setTimeout(() => cb(new Error("UNIMPLEMENTED: Dish has no motors")), 500);
    }

    getLocation(cb) {
        // Mock Rome, Italy
        cb(null, {
            get_location: {
                lla: {
                    lat: 41.9028,
                    lon: 12.4964,
                    alt: 50.0
                }
            }
        });
    }
}

class StarlinkService {
    constructor(useMock = false) {
        this.cachedHardwareVersion = null; // Cache for capabilities

        if (useMock) {
            this.client = new MockStarlinkClient();
            return;
        }

        try {
            const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true
            });
            const starlinkProto = grpc.loadPackageDefinition(packageDefinition).SpaceX.API.Device;
            this.client = new starlinkProto.Device(DISH_ADDR, grpc.credentials.createInsecure());
        } catch (e) {
            console.error('Failed to load proto or connect:', e);
            console.warn('Falling back to Mock Client due to error');
            this.client = new MockStarlinkClient();
        }
    }

    // Identify if hardware is Gen 3 or newer (Non-Actuated)
    isGen3(hwVersion) {
        if (!hwVersion) return false;
        const gen3Identifiers = ['rev4', 'ut_standard', 'proto4']; // Known Gen 3 strings
        return gen3Identifiers.some(id => hwVersion.toLowerCase().includes(id));
    }

    async getStatus() {
        return new Promise((resolve, reject) => {
            const request = { get_status: {} };

            // Helper to process response and cache HW version
            const processResponse = (err, response) => {
                if (err) return reject(err);

                // Cache hardware version for capabilities
                if (response?.dish_get_status?.device_info?.hardware_version) {
                    this.cachedHardwareVersion = response.dish_get_status.device_info.hardware_version;
                }

                // Augment response with derived capabilities for Frontend
                if (response?.dish_get_status) {
                    const isGen3 = this.isGen3(this.cachedHardwareVersion);
                    response.dish_get_status.capabilities = {
                        has_motors: !isGen3,
                        requires_manual_alignment: isGen3
                    };
                }

                resolve(response);
            };

            if (this.client.Handle) {
                const deadline = new Date();
                deadline.setSeconds(deadline.getSeconds() + 5);
                this.client.Handle(request, { deadline }, processResponse);
            } else {
                this.client.getStatus(processResponse);
            }
        });
    }

    async reboot() {
        return new Promise((resolve, reject) => {
            const request = { reboot: {} };
            const cb = (err, response) => err ? reject(err) : resolve(response);

            if (this.client.Handle) this.client.Handle(request, cb);
            else this.client.reboot(cb);
        });
    }

    async stow(unstow = false) {
        // Pre-flight check for motor capabilities
        if (this.cachedHardwareVersion && this.isGen3(this.cachedHardwareVersion)) {
            return Promise.reject(new Error("Operation Not Supported: This Starlink model (Gen 3) does not have motors."));
        }

        return new Promise((resolve, reject) => {
            const request = { dish_stow: { unstow } };
            const cb = (err, response) => err ? reject(err) : resolve(response);

            if (this.client.Handle) this.client.Handle(request, cb);
            else this.client.stow(request.dish_stow, cb);
        });
    }

    async getLocation() {
        return new Promise((resolve, reject) => {
            const request = { get_location: {} };
            if (this.client.Handle) {
                this.client.Handle(request, (err, response) => {
                    if (err) reject(err);
                    else resolve(response);
                });
            } else {
                this.client.getLocation((err, response) => {
                    if (err) reject(err);
                    else resolve(response);
                });
            }
        });
    }

    async getHistory() {
        return new Promise((resolve, reject) => {
            // Ensure the key strictly matches the oneof field name
            const request = { get_history: {} };

            const cb = (err, response) => {
                if (err) return reject(err);
                if (!response) return resolve(null);
                // Handle wraps response in oneof 'dish_get_history'
                resolve(response.dish_get_history || response);
            };

            if (this.client.Handle) {
                this.client.Handle(request, cb);
            } else if (this.client.getHistory) {
                this.client.getHistory({}, cb);
            } else {
                reject(new Error("Method getHistory not implemented in client"));
            }
        });
    }
}

module.exports = StarlinkService;
