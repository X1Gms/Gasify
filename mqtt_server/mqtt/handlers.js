const { decrypt3DES } = require("../config/encryption");
const { parsePayload } = require("../services/parser.service");
const deviceService = require("../services/device.service");
const userService = require("../services/user.service.js");
const { notifyEmergency } = require("../services/notify.service");

const handleMessage = async (_, message) => {
    try {
        const payload = JSON.parse(message.toString());
        const encryptedBytes = payload?.uplink_message?.decoded_payload?.encrypted_bytes;
        if (!encryptedBytes) return;

        const hexString = Buffer.from(encryptedBytes).toString().trim();
        const encryptedBuffer = Buffer.from(hexString, "hex");

        const raw = decrypt3DES(encryptedBuffer);
        if (!raw) return;

        const data = parsePayload(raw);
        if (!data) return;

        console.log(JSON.stringify(data, null, 2));

        if (data.status === "EMERGENCY") {
            const {name, located_at} = await userService.findUserByDeviceMac(data.mac);
            await notifyEmergency({
                nome: name,      // replace when you have real data
                morada: located_at,  // same here
                temperature: data.temperature,
                humidity: data.humidity
            });
        }

        const device = await deviceService.findDeviceByMac(data.mac);
        if (!device) {
            await deviceService.createDevice(data.mac);
            return;
        }

        await deviceService.saveReading(device.id, data);
    } catch (err) {
        console.error("MQTT message error:", err.message);
    }
};

const handleError = (err) => {
    console.error("❌ MQTT Error:", err);
};

module.exports = { handleMessage, handleError };
