const crypto = require("node:crypto");

const options = require("../config/options.json");
const codeLength = options.forgotPassword.codeLength;

/**
 * Generates a random code of a given length
 *
 * @param {Number} length
 * @returns {string}
 */
function generateRandomCode(length = codeLength) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(length);

  let code = "";
  for (let i = 0; i < length; i++) {
    // get a random char from chars
    code += chars[bytes[i] % chars.length];
  }

  return code;
}
module.exports.generateRandomCode = generateRandomCode;
