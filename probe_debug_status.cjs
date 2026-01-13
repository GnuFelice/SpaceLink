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

            if (response.dish_get_status) {
                const status = response.dish_get_status;
                console.log("Dish Status Keys:", Object.keys(status));
                // Check flattened floats
                console.log("1014:", status.val_1014);
                console.log("1015:", status.val_1015);
                console.log("1016:", status.val_1016);
                console.log("1017:", status.val_1017);
                console.log("1018:", status.val_1018);

                if (status.alignment_stats) console.log("FOUND 1013 (Msg):", JSON.stringify(status.alignment_stats));

                console.log("RAW 1013:", status.alignment_stats_raw ? status.alignment_stats_raw.toString('hex') : "NULL");
                console.log("RAW 1010:", status.probe_1010 ? status.probe_1010.toString('hex') : "NULL");
                console.log("RAW 1014:", status.probe_1014 ? status.probe_1014.toString('hex') : "NULL");
                console.log("RAW 1015:", status.probe_1015 ? status.probe_1015.toString('hex') : "NULL");
                console.log("RAW 1016:", status.probe_1016 ? status.probe_1016.toString('hex') : "NULL");
            } else {
                console.log("No dish_get_status in response");
            }
        }
    });
}

runProbe();
