const express = require("express");
const mysql = require("mysql2");

const { mysqlPool } = require("../../db/mysql-pool");

/**
 * Handles user password reset code verification requests.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
function verifyPasswordResetCodeHandler(req, res) {
  // destructuring request body
  const { email, code } = req.body;

  // validate request body
  if (!email || !code) {
    return res.status(400).json({
      message: "Missing fields, expected: email, code",
    });
  }

  // get user by email
  const getUserByEmailSql = mysql.format(
    "SELECT * FROM  user WHERE email = ?",
    [email]
  );
  mysqlPool.query(getUserByEmailSql, (err, result) => {
    if (err) {
      console.error("Error getting user:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    const user = result[0];
    const userId = user ? user.id : null;

    if (!userId) {
      // neutral response to prevent user enumeration
      return res
        .status(200)
        .json({ message: "Invalid or expired password reset code" });
    }

    // check if code is valid
    const checkCodeSql = mysql.format(
      "SELECT * FROM password_reset_code WHERE user_id = ? AND code = ? AND used_at IS NULL AND expires_at > NOW()",
      [userId, code]
    );
    mysqlPool.query(checkCodeSql, (err, result) => {
      if (err) {
        console.error("Error checking code:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      if (result.length === 0) {
        return res
          .status(200)
          .json({ message: "Invalid or expired password reset code" });
      }

      return res.status(200).json({ message: "Password reset code is valid" });
    });
  });
}

module.exports.verifyPasswordResetCodeHandler = verifyPasswordResetCodeHandler;
