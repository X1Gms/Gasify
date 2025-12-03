const nodemailer = require("nodemailer");

const { getTransporter } = require("./transporter");
const { isDevelopmentEnv } = require("../dev-environment");

/**
 * Sends an email.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address.
 * @param {string} options.subject - Email subject.
 * @param {string} options.text - Plain text body.
 * @param {string} options.html - Optional HTML body.
 * @param {function()} callback - Callback function to be called when the email is sent.
 */
function sendEmail({ to, subject, text, html }, callback) {
  getTransporter((err, transporter) => {
    if (err) {
      console.error("Error getting mail client:", err);
      return callback(err);
    }

    const mailOptions = {
      from: `Gasify <${transporter.options.auth.user}>`,
      to,
      subject,
      text,
      html,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return callback(error);
      }

      if (isDevelopmentEnv) {
        console.log("Email sent to:", to);
        console.log("Test message URL:", nodemailer.getTestMessageUrl(info));
      }

      callback(null, info);
    });
  });
}
module.exports.sendEmail = sendEmail;
