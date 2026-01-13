const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const util = require('util');

const PROTO_PATH = path.join(__dirname, 'electron', 'services', 'starlink.proto');
const DISH_ADDR = '192.168.100.1:9200';

console.log('=== STARLINK DISH PROBE FOR UNKNOWN DATA ===');
console.log(`Proto: ${PROTO_PATH}`);
console.log(`Dish: ${DISH_ADDR}\n`);

// Load proto
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const starlinkProto = grpc.loadPackageDefinition(packageDefinition).SpaceX.API.Device;
const client = new starlinkProto.Device(DISH_ADDR, grpc.credentials.createInsecure());

console.log('Sending get_status request...\n');

const request = { get_status: {} };

client.Handle(request, (err, response) => {
    if (err) {
        console.error('Error:', err);
        process.exit(1);
    }

    console.log('=== RAW RESPONSE (Full) ===');
    console.log(util.inspect(response, { depth: null, colors: true }));
    console.log('\n');

    if (response.dish_get_status) {
        const status = response.dish_get_status;

        console.log('=== KNOWN FIELDS ===');
        console.log('Device Info:', status.device_info);
        console.log('Device State:', status.device_state);
        console.log('Alerts:', status.alerts);
        console.log('SNR:', status.snr);
        console.log('Downlink:', status.downlink_throughput_bps);
        console.log('Uplink:', status.uplink_throughput_bps);
        console.log('Latency:', status.pop_ping_latency_ms);
        console.log('Obstruction Stats:', status.obstruction_stats);
        console.log('Alignment Stats:', status.alignment_stats);
        console.log('\n');

        console.log('=== SEARCHING FOR UNKNOWN FIELDS ===');
        const knownFields = [
            'device_info', 'device_state', 'alerts', 'snr',
            'downlink_throughput_bps', 'uplink_throughput_bps',
            'pop_ping_latency_ms', 'power_in', 'obstruction_stats',
            'alignment_stats', 'capabilities'
        ];

        const allKeys = Object.keys(status);
        const unknownKeys = allKeys.filter(key => !knownFields.includes(key));

        if (unknownKeys.length > 0) {
            console.log('🔍 FOUND UNKNOWN FIELDS:');
            unknownKeys.forEach(key => {
                const value = status[key];
                console.log(`\n  Field: "${key}"`);
                console.log(`  Type: ${typeof value}`);
                console.log(`  Value:`, util.inspect(value, { depth: 3, colors: true }));

                // If it's a buffer, show hex dump
                if (Buffer.isBuffer(value)) {
                    console.log(`  Hex: ${value.toString('hex')}`);
                    console.log(`  Length: ${value.length} bytes`);
                }
            });
        } else {
            console.log('✅ No unknown fields detected in current response.');
            console.log('All fields are already mapped in our proto definition.');
        }

        console.log('\n=== FIELD ID ANALYSIS ===');
        console.log('Note: gRPC doesn\'t expose field IDs directly in JavaScript.');
        console.log('To probe specific field IDs, modify starlink.proto to add:');
        console.log('  bytes unknown_XXXX = XXXX;');
        console.log('where XXXX is the field ID to probe (e.g., 1010, 1014, 1015, etc.)');

    } else {
        console.log('❌ No dish_get_status in response');
    }

    console.log('\n=== PROBE COMPLETE ===');
    process.exit(0);
});
