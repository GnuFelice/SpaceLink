const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, 'electron', 'services', 'starlink.proto');
const DISH_ADDR = '192.168.100.1:9200';

async function runProbe() {
    console.log(`=== DEBUG STATUS PROBE ===`);
    console.log(`Proto Path: ${PROTO_PATH}`);

    let packageDefinition;
    try {
        packageDefinition = protoLoader.loadSync(PROTO_PATH, {
            keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
        });
        console.log("Proto Loaded OK.");
    } catch (e) {
        console.error("Proto Load Failed:", e.message);
        return;
    }

    const starlinkProto = grpc.loadPackageDefinition(packageDefinition).SpaceX.API.Device;
    const client = new starlinkProto.Device(DISH_ADDR, grpc.credentials.createInsecure());

    const req = { get_status: {} };
    const deadline = new Date();
    deadline.setSeconds(deadline.getSeconds() + 5);

    console.log("Sending Handle(get_status) request...");
    client.Handle(req, { deadline }, (err, response) => {
        if (err) {
            console.error("RPC Error:", err);
        } else {
            console.log("Response Received:");
            console.log(JSON.stringify(response, null, 2));

            if (!response.dish_get_status) {
                console.error("CRITICAL: dish_get_status is MISSING in response!");
            } else {
                console.log("OK: dish_get_status is present.");
            }
        }
    });
}

runProbe();
