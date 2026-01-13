/**
 * Parses a string to a boolean
 *
 * @param {*} value
 * @returns {boolean | null}
 */
function parseBoolean(value) {
  if (value === true || value === false) return value;
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}
module.exports.parseBoolean = parseBoolean;
