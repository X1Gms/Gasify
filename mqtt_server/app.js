const aedes = require('aedes')();
const net = require('net');
const {createMqtt} = require("./external");
const server = net.createServer(aedes.handle);
const options = require("./options.json");



aedes.on('publish', (packet, client) => {
    if (client) {
        console.log(`📩 Message (${Date.now()}) from client ${client.id}:`);
        console.log(`Topic: ${packet.topic}`);
        console.log(`Payload: ${packet.payload.toString()}`);
    }
});

// Listen to client connections
aedes.on('client', (client) => {
    console.log(`👤 Client connected: ${client.id}`);
});

// Listen to client disconnections
aedes.on('clientDisconnect', (client) => {
    console.log(`❌ Client disconnected: ${client.id}`);
});


server.listen(options.server.mqtt.PORT, () => {
    console.log(`✅ MQTT broker running on port ${options.server.mqtt.PORT}`);
});


createMqtt();