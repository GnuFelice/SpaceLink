const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, 'starlink.proto');
const ROUTER_ADDR = '192.168.1.1:9200';

class RouterService {
    constructor() {
        try {
            const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true
            });
            const starlinkProto = grpc.loadPackageDefinition(packageDefinition).SpaceX.API.Device;
            this.client = new starlinkProto.Device(ROUTER_ADDR, grpc.credentials.createInsecure());
        } catch (e) {
            console.error('Failed to init Router Client:', e);
            this.client = null;
        }
    }

    async getWifiStatus() {
        if (!this.client) return { error: 'Client not initialized' };

        return new Promise((resolve) => {
            const request = { wifi_get_status: {} };

            // Short timeout (2s) to handle bypass/unreachable scenarios gracefully
            const deadline = new Date();
            deadline.setSeconds(deadline.getSeconds() + 2);

            this.client.Handle(request, { deadline }, (err, response) => {
                if (err) {
                    console.warn("Router unreachable:", err.message);
                    resolve({
                        success: false,
                        error: err.message,
                        bypass_detected: err.code === grpc.status.DEADLINE_EXCEEDED || err.code === grpc.status.UNAVAILABLE
                    });
                } else {
                    resolve({ success: true, data: response });
                }
            });
        });
    }
}

module.exports = RouterService;
