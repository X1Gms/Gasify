const crypto = require('crypto'); // Nativo do Node.js
const config = require("../config/options.json").security;
const keyHex = config['3DES'].join('');
const ENCRYPTION_KEY = Buffer.from(keyHex, 'hex');
// const ENCRYPTION_KEY = Buffer.from();

const decrypt3DES = (encryptedBuffer) => {
    try {
        // 'des-ede3' is Node's name for Triple DES (168/192 bit)
        // Since your Arduino code doesn't use an IV, we use ECB mode
        const decipher = crypto.createDecipheriv('des-ede3', ENCRYPTION_KEY, null);

        // Disable automatic padding because Arduino manual padding includes 0x00 bytes
        // which are not standard PKCS7 padding.
        decipher.setAutoPadding(false);

        let decrypted = decipher.update(encryptedBuffer, 'binary', 'utf8');
        decrypted += decipher.final('utf8');

        // Remove the trailing null characters (Zero Padding) added by Arduino
        return decrypted.replace(/\0/g, '');
    } catch (err) {
        console.error("Decryption failed:", err.message);
        return null;
    }
};

module.exports = {decrypt3DES};