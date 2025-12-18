const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");

const { mysqlPool } = require("../../../db/mysql-pool");

/**
 * Handles user deletion requests, requiring password confirmation.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
function deleteMeHandler(req, res) {
  const { id: userId } = req.user;

  // destructuring request body
  const { password } = req.body;

  // validate request body
  if (!password) {
    return res
      .status(400)
      .json({ success: false, message: "Missing fields, expected: password" });
  }

  // get user password
  const getUserSql = mysql.format(
    "SELECT password_hash FROM user WHERE id = ?",
    [userId]
  );
  mysqlPool.query(getUserSql, (err, results) => {
    if (err) {
      console.error("Error fetching user for password verification:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }

    if (results.length === 0) {
      // return standard success response even if user not found (idempotent-ish) or 404?
      // Existing code returned 204.
      return res
        .status(200)
        .json({ success: true, message: "User deleted successfully" });
    }

    const hashedPassword = results[0].password_hash;
    bcrypt.compare(password, hashedPassword, (err, isMatch) => {
      if (err) {
        console.error("Error comparing passwords:", err);
        return res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }

      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, message: "Incorrect password" });
      }

      // delete user
      const deleteUserSql = mysql.format("DELETE FROM user WHERE id = ?", [
        userId,
      ]);
      mysqlPool.query(deleteUserSql, (err, result) => {
        if (err) {
          console.error("Error deleting user:", err);
          return res
            .status(500)
            .json({ success: false, message: "Internal server error" });
        }

        if (result.affectedRows === 0) {
          // this case should ideally not be hit if the user was found for password check
          return res
            .status(200)
            .json({ success: true, message: "User deleted successfully" });
        }

        return res
          .status(200)
          .json({ success: true, message: "User deleted successfully" });
      });
    });
  });
}
module.exports.deleteMeHandler = deleteMeHandler;
