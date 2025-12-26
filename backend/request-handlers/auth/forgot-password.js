const express = require("express");
const mysql = require("mysql2");

const { mysqlPool } = require("../../db/mysql-pool");
const { generateRandomCode } = require("../../utils/random-code");
const config = require("../../config/options.json");
const { sendNeutralResponse } = require("../../utils/send-neutral-response");
const { createEmail } = require("../../utils/email/create-email");
const { sendEmail } = require("../../utils/email/send-email");

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
      success: false,
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
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }

    // if user does not exist, still respond with neutral message to prevent user enumeration
    const user = result[0];
    const userId = user ? user.id : null;

    const productionMessage =
      "If an account exists for this email, a password reset code has been sent";

    // if no user, return neutral response
    if (!userId) {
      return sendNeutralResponse(
        res,
        true,
        "User not found",
        productionMessage
      );
    }

    // check if user already has a code
    const checkCodeSql = mysql.format(
      "SELECT * FROM password_reset_code WHERE user_id = ? AND used_at IS NULL AND expires_at > NOW()",
      [userId]
    );
    mysqlPool.query(checkCodeSql, (err, result) => {
      if (err) {
        console.error("Error checking code:", err);
        return res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }

      if (result.length > 0) {
        const existingCode = result[0].code;

        return sendNeutralResponse(
          res,
          true,
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
          return res
            .status(500)
            .json({ success: false, message: "Internal server error" });
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
              return res
                .status(500)
                .json({ success: false, message: "Internal server error" });
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
                  .json({ success: false, message: "Internal server error" });
              }

              // create email using the template
              const emailContent = createEmail("password-reset-code", {
                fullName,
                code,
                codeExpirationTimeInMinutes,
              });

              // send email
              sendEmail(
                {
                  to: email,
                  subject: emailContent.subject,
                  text: emailContent.text,
                  html: emailContent.html,
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
                    true,
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
