const crypto = require('crypto'); // Nativo do Node.js
const ENCRYPTION_KEY = Buffer.from([
    0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10,
    0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18
]);

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