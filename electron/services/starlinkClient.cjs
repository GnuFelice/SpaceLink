const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const util = require('util');

const PROTO_PATH = path.join(__dirname, 'starlink.proto');
const DISH_ADDR = '192.168.100.1:9200';

class StarlinkService {
    constructor() {
        this.cachedHardwareVersion = null; // Cache for capabilities

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
            console.log('Starlink gRPC client initialized →', DISH_ADDR);
        } catch (e) {
            console.error('CRITICAL: Failed to initialize gRPC client:', e);
            throw new Error('Cannot initialize Starlink gRPC client. Proto file missing or invalid.');
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
