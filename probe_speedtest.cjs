try {
    const speedtest = require('speedtest-cli');
    console.log('Type of speedtest:', typeof speedtest);
    console.log('Exports:', speedtest);
} catch (e) {
    console.error(e);
}
