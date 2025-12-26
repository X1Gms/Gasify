const passwordResetCode = require("./password-reset-code");
const passwordChangedSuccessfully = require("./password-changed-successfully");

// defines the available templates
module.exports = {
  "password-reset-code": passwordResetCode,
  "password-changed-successfully": passwordChangedSuccessfully,
};
