const mqtt = require('mqtt');
const options = require("./options.json").ttn;

const createMqtt = () => {
    const client = mqtt.connect(options.url, {
        clean: options.clean || true,
        connectTimeout: options.connectTimeout || 4000,
        username: options.username,
        password: options.apikey,
    });

    client.on('connect', () => handleConnect(client));
    client.on('message', handleMessage);
    client.on('error', handleError);

}

const handleConnect = (client) => {
    console.log('✅ Connect to TTN by MQTT');
    const topic = `v3/${options.username}/devices/+/up`;

    client.subscribe(topic, (err) => {
        if (err) console.error('❌ Subscription Error:', err);
        else console.log(`📡 Subscribed as: ${topic}`);
    });
}

const handleMessage = (topic, message) => {
    try {
        const payload = JSON.parse(message.toString());
        const data = payload.uplink_message.decoded_payload;
        console.log(data);
    } catch (err) {
        console.error("Message parsing error:", err);
    }
};

const handleError = (err) => {
    console.error('❌ MQTT Error:', err);
}

module.exports = {createMqtt};