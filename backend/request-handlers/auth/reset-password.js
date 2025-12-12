const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");

const { mysqlPool } = require("../../db/mysql-pool");
const { passwordRegex } = require("../../utils/regexes");
const options = require("../../config/options.json");
const { sendNeutralResponse } = require("../../utils/send-neutral-response");

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
    "SELECT id FROM user WHERE email = ?",
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
      return sendNeutralResponse(res, "Invalid data", productionMessage);
    }

    const userId = result[0].id;

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
        return sendNeutralResponse(res, "Invalid data", productionMessage);
      }

      const resetCode = result[0];

      // check expiration
      const now = new Date();
      const expiresAt = new Date(resetCode.expires_at);

      if (expiresAt < now || resetCode.used_at !== null) {
        return sendNeutralResponse(res, "Invalid data", productionMessage);
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
              console.error("Error marking Password Reset Code as used:", err);
              // still send neutral response
            }

            // final neutral response
            return sendNeutralResponse(
              res,
              "Password successfully updated",
              productionMessage
            );
          });
        });
      });
    });
  });
}

module.exports.resetPasswordHandler = resetPasswordHandler;
