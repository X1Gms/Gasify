const express = require("express");
const mysql = require("mysql2");

const { mysqlPool } = require("../../db/mysql-pool");
const { generateRandomCode } = require("../../utils/random-code");
const config = require("../../config/options.json");
const { sendEmail } = require("../../utils/email/send-email");
const { sendNeutralResponse } = require("../../utils/send-neutral-response");
const { emailStyles } = require("../../utils/email/email-helpers");

/**
 * Handles user forgot password requests.
 * It sends a password reset code to the user's email.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
function forgotPasswordHandler(req, res) {
  // destructuring request body
  const { email } = req.body;

  // validate request body
  if (!email) {
    return res.status(400).json({
      message: "Missing fields, expected: email",
    });
  }

  // get user by email
  const getUserByEmailSql = mysql.format("SELECT * FROM user WHERE email = ?", [
    email,
  ]);
  mysqlPool.query(getUserByEmailSql, (err, result) => {
    if (err) {
      console.error("Error getting user:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    // if user does not exist, still respond with neutral message to prevent user enumeration
    const user = result[0];
    const userId = user ? user.id : null;

    const productionMessage =
      "If an account exists for this email, a password reset code has been sent";

    // if no user, return neutral response
    if (!userId) {
      return sendNeutralResponse(res, "User not found", productionMessage);
    }

    // check if user already has a code
    const checkCodeSql = mysql.format(
      "SELECT * FROM password_reset_code WHERE user_id = ? AND used_at IS NULL AND expires_at > NOW()",
      [userId]
    );
    mysqlPool.query(checkCodeSql, (err, result) => {
      if (err) {
        console.error("Error checking code:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      if (result.length > 0) {
        const existingCode = result[0].code;

        return sendNeutralResponse(
          res,
          "Email not sent again because user already has a valid password reset code",
          productionMessage,
          { code: existingCode }
        );
      }

      // delete all unused and expired codes for this user before generating a new one
      const deleteOldCodesSql = mysql.format(
        "DELETE FROM password_reset_code WHERE user_id = ? AND (used_at IS NOT NULL OR expires_at <= NOW())",
        [userId]
      );
      mysqlPool.query(deleteOldCodesSql, (err) => {
        if (err) {
          console.error("Error deleting old codes:", err);
          return res.status(500).json({ message: "Internal server error" });
        }

        function generateUniqueCode() {
          const code = generateRandomCode();
          const fullName = user.full_name;

          // check if code exists
          const checkCodeSql = mysql.format(
            "SELECT * FROM password_reset_code WHERE code = ?",
            [code]
          );
          mysqlPool.query(checkCodeSql, (err, result) => {
            if (err) {
              console.error("Error checking code:", err);
              return res.status(500).json({ message: "Internal server error" });
            }

            // if code exists, generate a new one
            if (result.length > 0) {
              return generateUniqueCode();
            }

            // get code expiration minutes from config
            const codeExpirationTimeInMinutes =
              config.forgotPassword.codeExpirationTimeInMinutes;
            // generate expires at
            const expiresAt = new Date(
              Date.now() + codeExpirationTimeInMinutes * 60 * 1000
            );

            // insert code
            const insertCodeSql = mysql.format(
              "INSERT INTO password_reset_code (user_id, code, expires_at) VALUES (?, ?, ?)",
              [userId, code, expiresAt]
            );
            mysqlPool.query(insertCodeSql, (err) => {
              if (err) {
                console.error("Error inserting code:", err);
                return res
                  .status(500)
                  .json({ message: "Internal server error" });
              }

              const emailText = `
              Password Reset Code

              Hello, ${fullName},

              We received a request to reset the password associated with your Gasify account.

              Your password reset code is: ${code}

              This code is valid for ${codeExpirationTimeInMinutes} minutes. If you did not request a password reset, you can safely ignore this message.

              Thank you,
              Gasify
              `;

              // todo: add styles
              const emailHtml = `
              <div style="width: 100%; background-color: ${emailStyles.background}; padding: 40px 0; font-family: Arial, sans-serif;">
                <div style="
                    max-width: 480px;
                    margin: auto;
                    background-color: ${emailStyles.card};
                    border: 1px solid ${emailStyles.border};
                    border-radius: 12px;
                    padding: 32px;
                    box-shadow: ${emailStyles.boxShadow};
                    color: ${emailStyles.foreground};
                  "
                >
                  <h2 style="color: ${emailStyles.primary}; margin-top: 0; margin-bottom: 24px; font-size: 24px; font-weight: 600;">
                    Password Reset Code
                  </h2>

                  <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5;">
                    Hello, ${fullName},
                  </p>

                  <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5;">
                    We received a request to reset the password associated with your Gasify account.
                  </p>

                  <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.5;">
                    Your password reset code is:
                  </p>

                  <div style="
                      text-align: center;
                      padding: 20px;
                      font-size: 28px;
                      font-weight: bold;
                      color: ${emailStyles.primary};
                      background-color: ${emailStyles.muted};
                      border: 1px solid ${emailStyles.primary};
                      border-radius: 8px;
                      margin-bottom: 24px;
                    "
                  >
                    ${code}
                  </div>

                  <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.5;">
                    This code is valid for <strong style="color: ${emailStyles.primary};">${codeExpirationTimeInMinutes} minutes</strong>.  
                    If you did not request a password reset, you can safely ignore this message.
                  </p>

                  <hr style="border: none; border-top: 1px solid ${emailStyles.border}; margin: 28px 0;" />

                  <p style="margin: 0; font-size: 13px; line-height: 1.5; color: ${emailStyles.mutedForeground};">
                    Thank you,<br />
                    <strong style="color: ${emailStyles.foreground};">Gasify</strong>
                  </p>
                </div>
              </div>
              `;

              // send email
              sendEmail(
                {
                  to: email,
                  subject: "Password Reset Code",
                  text: emailText,
                  html: emailHtml,
                },
                function (err) {
                  if (err) {
                    // continue silently to not expose email sending errors to the user to prevent user enumeration
                    console.error(
                      `Email could not be sent for ${email}, continuing silently`
                    );
                  }

                  return sendNeutralResponse(
                    res,
                    "New code generated and email sent",
                    productionMessage,
                    { code }
                  );
                }
              );
            });
          });
        }

        generateUniqueCode();
      });
    });
  });
}

module.exports.forgotPasswordHandler = forgotPasswordHandler;
