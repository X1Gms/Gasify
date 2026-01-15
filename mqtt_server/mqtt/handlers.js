const { decrypt3DES } = require("../config/encryption");
const { parsePayload } = require("../services/parser.service");
const deviceService = require("../services/device.service");
const userService = require("../services/user.service.js");
const { notifyEmergency } = require("../services/notify.service");
let myArray = [];
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

        const device = await deviceService.findDeviceByMac(data.mac);
        if (!device) {
            // await deviceService.createDevice(data.mac);
            console.warn(`Device pending a register! Serial number ${data.mac}`);
            return;
        }

        const reading = await deviceService.saveReading(device.id, data);
        if(data.status === "IDLE"){
            const index = myArray.findIndex(obj => obj.serial_number === data.mac);
            if(index !== -1){
                if(myArray[index].status !== "PENDING")
                    myArray.splice(index,1);
            }
        }
        if(data.status === "PENDING"){
            const exists = myArray.some(obj => obj.serial_number === data.mac);
            if(!exists){
                const myItem = {"serial_number": data.mac, status: "PENDING", "id": reading}
                myArray.push(myItem);
                const index = myArray.findIndex(obj => obj.serial_number === data.mac);
                myItem.userID = await userService.findUserIdByDeviceMac(data.mac);
                myArray[index].detectId = await deviceService.registerDetection(myItem);
                return;
            }
        }

        if(data.status === "CANCELED"){
            const exists = myArray.some(obj => obj.serial_number === data.mac && obj.status === "PENDING");
            if(exists){
                const index = myArray.findIndex(obj => obj.serial_number === data.mac);
                myArray[index].status = "CANCELED";
                await deviceService.registerDetection(myArray[index]);
            }
        }


        // const meuStatus = "EMERGENCY"
        if (data.status === "EMERGENCY") {
            const index = myArray.findIndex(obj => obj.serial_number === data.mac);
            const exists = myArray.some(obj => obj.serial_number === data.mac && obj.status === "PENDING");
            if(exists){
                myArray[index].status = "EMERGENCY";
                await deviceService.registerDetection(myArray[index]);
                const userID = await userService.findUserIdByDeviceMac(data.mac);
                const user = await userService.findUserById(userID);
                await deviceService.registerDetection("EMERGENCY");
                await notifyEmergency({
                    nome: user.full_name || "",      // replace when you have real data
                    // morada: located_at | "",  // same here
                    // temperature: data.temperature || "",
                    // humidity: data.humidity || ""
                });
            }
            myArray[index].status = "EMERGENCY_POP";
        }

    } catch (err) {
        console.error("MQTT message error:", err.message);
    }
};

const handleError = (err) => {
    console.error("❌ MQTT Error:", err);
};

module.exports = { handleMessage, handleError };
