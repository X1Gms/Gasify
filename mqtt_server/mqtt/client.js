const mqtt = require("mqtt");
const options = require("../config/options.json");
const { handleMessage, handleError } = require("./handlers");

const createMqttClient = () => {
    const client = mqtt.connect(options.ttn.url, {
        clean: options.ttn.clean,
        connectTimeout: options.ttn.connectTimeout,
        username: options.ttn.username,
        password: options.ttn.apikey,
    });

    client.on("connect", () => {
        const topic = `v3/${options.ttn.username}/devices/+/up`;
        client.subscribe(topic);
        console.log("📡 Connected and subscribed:", topic);
    });

    client.on("message", handleMessage);
    client.on("error", handleError);
};

module.exports = { createMqttClient };
