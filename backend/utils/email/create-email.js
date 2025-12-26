const templates = require("./templates");

/**
 * @typedef {Object} EmailData
 *
 * @property {string} subject The subject of the email.
 * @property {string} text The text content of the email.
 * @property {string} html The HTML content of the email.
 */

/**
 * Creates an email object with the given template and data.
 *
 * @param {string} templateName The name of the template to use.
 * @param {Object} data The data to use in the template.
 * @returns {EmailData} The email object.
 */
function createEmail(templateName, data) {
  // get template
  const template = templates[templateName];

  if (!template) {
    throw new Error(`Template ${templateName} not found`);
  }

  return template(data);
}
module.exports.createEmail = createEmail;
