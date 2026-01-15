const nodemailer = require("nodemailer");

const { isDevelopmentEnv } = require("../dev-environment");
const config = require("../../config/options.json");

/**
 * Creates a nodemailer transporter based on the environment and returns it.
 *
 * @param {Function} callback
 */
function getTransporter(callback) {
  if (isDevelopmentEnv) {
    nodemailer.createTestAccount((err, account) => {
      if (err) {
        return callback(err);
      }

      const transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
          user: account.user,
          pass: account.pass,
        },
      });

      callback(null, transporter);
    });
  } else {
    const transporter = nodemailer.createTransport({
      host: config.nodemailer.host,
      port: config.nodemailer.port,
      secure: config.nodemailer.secure,
      auth: {
        user: config.nodemailer.auth.user,
        pass: config.nodemailer.auth.pass,
      },
    });

    callback(null, transporter);
  }
}
module.exports.getTransporter = getTransporter;
