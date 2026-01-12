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
                        id: 'MOCK-DISH-001',
                        hardware_version: 'rev3_proto2',
                        software_version: '2025.01.0.mr1234',
                        country_code: 'IT'
                    },
                    device_state: { uptime_s: process.uptime() },
                    snr: 9,
                    downlink_throughput_bps: Math.random() * 250 * 1000000, // 0-250 Mbps
                    uplink_throughput_bps: Math.random() * 30 * 1000000,    // 0-30 Mbps
                    pop_ping_latency_ms: 25 + Math.random() * 20,           // 25-45 ms
                    obstruction_stats: {
                        fraction_obstructed: Math.random() * 0.1,
                        valid_s: 3600,
                        // Simulate 12 wedges, some clear (0), some obstructed (0-1)
                        wedge_fraction_obstructed: Array.from({ length: 12 }, (_, i) =>
                            (i === 0 || i === 11) ? Math.random() * 0.5 : 0 // North slightly obstructed
                        )
                    },
                    alerts: { motors_stuck: false, thermal_throttle: false }
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
                    pop_ping_latency_ms: generateHistory(20, 50),
                    downlink_throughput_bps: generateHistory(5000000, 300000000),
                    uplink_throughput_bps: generateHistory(1000000, 40000000)
                }
            });
        }, 100);
    }

    reboot(cb) {
        console.log('MOCK: Rebooting...');
        setTimeout(() => cb(null, {}), 500);
    }

    stow(req, cb) {
        console.log(`MOCK: ${req.unstow ? 'Unstowing' : 'Stowing'}...`);
        setTimeout(() => cb(null, {}), 500);
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
            // Fallback to mock if proto fails (e.g. file not found in build)
            console.warn('Falling back to Mock Client due to error');
            this.client = new MockStarlinkClient();
        }
    }

    async getStatus() {
        return new Promise((resolve, reject) => {
            // Handle method selector for status
            const request = { get_status: {} };

            // In proto, the method is generic Handle(Request)
            // Check if we are using real client (which has Handle) or Mock (which has getStatus)
            if (this.client.Handle) {
                const deadline = new Date();
                deadline.setSeconds(deadline.getSeconds() + 5);

                this.client.Handle(request, { deadline }, (err, response) => {
                    if (err) reject(err);
                    else resolve(response);
                });
            } else {
                this.client.getStatus((err, response) => {
                    if (err) reject(err);
                    else resolve(response);
                });
            }
        });
    }


    async reboot() {
        return new Promise((resolve, reject) => {
            const request = { reboot: {} };
            if (this.client.Handle) {
                this.client.Handle(request, (err, response) => {
                    if (err) reject(err);
                    else resolve(response);
                });
            } else {
                this.client.reboot((err, response) => {
                    if (err) reject(err);
                    else resolve(response);
                });
            }
        });
    }

    async stow(unstow = false) {
        return new Promise((resolve, reject) => {
            const request = { dish_stow: { unstow } };
            if (this.client.Handle) {
                this.client.Handle(request, (err, response) => {
                    if (err) reject(err);
                    else resolve(response);
                });
            } else {
                this.client.stow(request.dish_stow, (err, response) => {
                    if (err) reject(err);
                    else resolve(response);
                });
            }
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
}

module.exports = StarlinkService;
