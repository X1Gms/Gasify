const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");

const { mysqlPool } = require("../../db/mysql-pool");
const { passwordRegex } = require("../../utils/regexes");
const options = require("../../config/options.json");
const { sendNeutralResponse } = require("../../utils/send-neutral-response");
const { sendEmail } = require("../../utils/email/send-email");
const {
  emailStyles,
  logoUrl,
  discordUrl,
} = require("../../utils/email/email-helpers");

/**
 * Handles user reset password requests.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
function resetPasswordHandler(req, res) {
  // destructuring request body
  const { email, code, password, passwordConfirmation } = req.body;

  // validate request body
  if (!email || !code || !password || !passwordConfirmation) {
    return res.status(400).json({
      success: false,
      message:
        "Missing fields, expected: email, code, password, passwordConfirmation",
    });
  }

  // validate password format
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      message:
        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
    });
  }

  // validate password confirmation
  if (password !== passwordConfirmation) {
    return res.status(400).json({
      success: false,
      message: "Passwords do not match",
    });
  }

  const productionMessage =
    "If the data is valid, the password will be updated";

  // get user by email
  const getUserByEmailSql = mysql.format(
    "SELECT id, full_name, password_hash FROM user WHERE email = ?",
    [email]
  );
  mysqlPool.query(getUserByEmailSql, (err, result) => {
    if (err) {
      console.error("Error getting user:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }

    // neutral response if user does not exist to prevent exposure of emails
    if (result.length === 0) {
      return sendNeutralResponse(res, false, "Invalid data", productionMessage);
    }

    const userId = result[0].id;
    const fullName = result[0].full_name;
    const currentPasswordHash = result[0].password_hash;

    // check reset code
    const getCodeSql = mysql.format(
      "SELECT * FROM password_reset_code WHERE user_id = ? AND code = ?",
      [userId, code]
    );
    mysqlPool.query(getCodeSql, (err, result) => {
      if (err) {
        console.error("Error checking Password Reset Code:", err);
        return res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }

      // neutral response for invalid or missing code
      if (result.length === 0) {
        return sendNeutralResponse(
          res,
          false,
          "Invalid data",
          productionMessage
        );
      }

      const resetCode = result[0];

      // check expiration
      const now = new Date();
      const expiresAt = new Date(resetCode.expires_at);

      if (expiresAt < now || resetCode.used_at !== null) {
        return sendNeutralResponse(
          res,
          false,
          "Invalid data",
          productionMessage
        );
      }

      // check if the new password is the same as the current one
      bcrypt.compare(password, currentPasswordHash, (err, isSame) => {
        if (err) {
          console.error("Error comparing passwords:", err);
          return res
            .status(500)
            .json({ success: false, message: "Internal server error" });
        }

        if (isSame) {
          return sendNeutralResponse(
            res,
            false,
            "New password cannot be the same as the current password",
            productionMessage
          );
        }

        const saltRounds = Number(options.auth.saltRounds) || 10;

        // hash password
        bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
          if (err) {
            console.error("Error hashing password:", err);
            return res
              .status(500)
              .json({ success: false, message: "Internal server error" });
          }

          // update user password
          const updatePasswordSql = mysql.format(
            "UPDATE user SET password_hash = ? WHERE id = ?",
            [hashedPassword, userId]
          );
          mysqlPool.query(updatePasswordSql, (err) => {
            if (err) {
              console.error("Error updating password:", err);
              return res
                .status(500)
                .json({ success: false, message: "Internal server error" });
            }

            // mark recovery code as used
            const markCodeAsUsedSql = mysql.format(
              "UPDATE password_reset_code SET used_at = NOW() WHERE id = ?",
              [resetCode.id]
            );

            mysqlPool.query(markCodeAsUsedSql, (err) => {
              if (err) {
                console.error(
                  "Error marking Password Reset Code as used:",
                  err
                );
                // still send neutral response
              }

              const emailText = `
              Password Changed Successfully

              Hello, ${fullName},

              This is a confirmation that the password for your Gasify account has been successfully changed on ${new Date().toLocaleString()}.

              If you made this change, no further action is required.

              SECURITY NOTICE:
              Didn’t change your password?

              If you did not make this change and are unable to access your account, please contact our support team immediately using one of the options below:

              - Email: ${options.nodemailer.auth.user}
              - Discord: ${discordUrl}

              ---
              This is an automated message, please do not reply to this email.

              Thank you,
              Gasify
              `;

              const emailHtml = `
              <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${
                emailStyles.background
              }" style="background-color:${
                emailStyles.background
              }; font-family:Arial, sans-serif;">
                <tr>
                  <td align="center" style="padding:40px 0;">
                    <table width="480" cellpadding="0" cellspacing="0" border="0" align="center" style="width:480px; max-width:480px;">
                      <tr>
                        <td>
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <!-- Card sem padding -->
                              <td bgcolor="${
                                emailStyles.card
                              }" style="background-color:${
                emailStyles.card
              }; border:1px solid ${
                emailStyles.border
              }; border-radius:12px; color:${
                emailStyles.foreground
              }; font-family:Arial, sans-serif;">

                                <!-- Header -->
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td align="center" style="padding:32px 32px 24px 32px;">
                                      <img src="${logoUrl}" alt="Gasify" width="${
                emailStyles.logoHeight
              }" style="display:block; border:0; outline:none; text-decoration:none; max-width:${
                emailStyles.logoHeight
              }px; border-radius:50%; height:auto;" />
                                    </td>
                                  </tr>
                                </table>

                                <!-- Body -->
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td style="padding:0 32px 32px 32px;">

                                      <h2 style="margin:0 0 24px 0; font-size:24px; font-weight:600; color:${
                                        emailStyles.primary
                                      };">
                                        Password Changed Successfully
                                      </h2>

                                      <p style="margin:0 0 16px 0; font-size:14px; line-height:1.5;">
                                        Hello, ${fullName},
                                      </p>

                                      <p style="margin:0 0 16px 0; font-size:14px; line-height:1.5;">
                                        This is a confirmation that the password for your Gasify account has been successfully changed on ${new Date().toLocaleString()}.
                                      </p>

                                      <p style="margin:0 0 24px 0; font-size:14px; line-height:1.5;">
                                        If you made this change, no further action is required.
                                      </p>

                                      <!-- Alert block -->
                                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px; background-color:${
                                        emailStyles.muted
                                      }; border-radius:8px;">
                                        <tr>
                                          <td width="4" bgcolor="${
                                            emailStyles.primary
                                          }" style="width:4px; background-color:${
                emailStyles.primary
              }; border-top-left-radius:8px; border-bottom-left-radius:8px;"></td>
                                          <td style="padding:16px; font-size:14px; line-height:1.5; color:${
                                            emailStyles.foreground
                                          };">
                                            <strong style="color:${
                                              emailStyles.dangerous
                                            };">
                                              Didn’t change your password?
                                            </strong>
                                            <br /><br />
                                            If you did not make this change and are unable to access your account, please contact our support team immediately using one of the options below:
                                            <ul style="margin:12px 0 0 18px; padding:0;">
                                              <li>
                                                Email:
                                                <a href="mailto:${
                                                  options.nodemailer.auth.user
                                                }" style="color:${
                emailStyles.link
              }; text-decoration:none;">
                                                  ${
                                                    options.nodemailer.auth.user
                                                  }
                                                </a>
                                              </li>
                                              <li>
                                                Discord:
                                                <a href="${discordUrl}" target="_blank" rel="noopener" style="color:${
                emailStyles.link
              }; text-decoration:none;">
                                                  ${discordUrl}
                                                </a>
                                              </li>
                                            </ul>
                                          </td>
                                        </tr>
                                      </table>

                                      <hr style="border:none; border-top:1px solid ${
                                        emailStyles.border
                                      }; margin:28px 0;" />

                                      <p style="margin:0; font-size:13px; line-height:1.5; color:${
                                        emailStyles.mutedForeground
                                      };">
                                        Thank you,<br />
                                        <strong style="color:${
                                          emailStyles.foreground
                                        };">Gasify</strong>
                                      </p>

                                    </td>
                                  </tr>
                                </table>

                                <!-- Footer full width -->
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${
                                  emailStyles.muted
                                }" style="border-top:1px solid ${
                emailStyles.border
              }; border-bottom-left-radius:12px; border-bottom-right-radius:12px;">
                                  <tr>
                                    <td align="center" style="padding:16px 24px; font-size:12px; line-height:1.4; color:${
                                      emailStyles.mutedForeground
                                    };">
                                      This is an automated message, please do not reply to this email.
                                    </td>
                                  </tr>
                                </table>

                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              `;

              // send email
              sendEmail(
                {
                  to: email,
                  subject: "Password Changed Successfully",
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

                  // final neutral response
                  return sendNeutralResponse(
                    res,
                    true,
                    "Password successfully updated",
                    productionMessage
                  );
                }
              );
            });
          });
        });
      });
    });
  });
}

module.exports.resetPasswordHandler = resetPasswordHandler;
