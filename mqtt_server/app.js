const mqtt = require('mqtt');
const crypto = require('crypto'); // Nativo do Node.js
const options = require("./options.json");

const ENCRYPTION_KEY = Buffer.from([
    0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 
    0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10, 
    0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18
]);

const decrypt3DES = (encryptedBuffer) => {
    try {
        // des-ede3 = Triple DES em modo ECB (como no seu Arduino)
        // Se usou IV no Arduino, precisaria de des-ede3-cbc
        const decipher = crypto.createDecipheriv('des-ede3', ENCRYPTION_KEY, null);
        decipher.setAutoPadding(false); // Desativamos pois fizemos padding manual ou zero padding

        let decrypted = decipher.update(encryptedBuffer, 'binary', 'utf8');
        decrypted += decipher.final('utf8');
        
        // Remove caracteres nulos (\0) que podem ter vindo do padding no Arduino
        return decrypted.replace(/\0/g, '');
    } catch (e) {
        console.error("Erro na descriptografia:", e.message);
        return null;
    }
};

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
        const encryptedBytes = payload.uplink_message.decoded_payload.encrypted_bytes;
        
        if (!encryptedBytes) {
            console.log("Nenhum dado criptografado recebido.");
            return;
        }

        // 1. Descriptografar
        const rawString = decrypt3DES(Buffer.from(encryptedBytes));
        
        if (rawString) {
            // 2. Split dos campos exatamente como no seu código original
            const parts = rawString.split(";");

            if (parts.length >= 7) {
                const gasResult = parseInt(parts[0], 10);
                const gasType = (gasResult === 0) ? "CO" : (gasResult === 1 ? "GAS" : "Nothing");
                const machineStateValue = parseInt(parts[6], 10);
                
                let machineState = "IDLE";
                if(machineStateValue === 1) machineState = "PENDING";
                else if(machineStateValue === 2) machineState = "CANCELED";
                else if(machineStateValue === 3) machineState = "CONFIRMED";

                const data = {
                    state: machineState,
                    gas_result: gasResult,
                    gas_type: gasType,
                    mq2_analog: parseInt(parts[1], 10),
                    mq5_analog: parseInt(parts[2], 10),
                    temperature_c: parseInt(parts[3], 10),
                    humidity_percent: parseInt(parts[4], 10),
                    efuse_mac: parts[5],
                    raw_decrypted: rawString
                };

                console.log("✅ DADOS DESCRIPTOGRAFADOS:");
                console.table(data); // Printa formatado em tabela no console
            }
        }
    } catch (err) {
        console.error("Message parsing error:", err);
    }
};
const handleError = (err) => {
    console.error('❌ MQTT Error:', err);
}

createMqtt();
