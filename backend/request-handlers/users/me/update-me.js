const express = require("express");
const bcrypt = require("bcrypt");
const mysql = require("mysql2");

const { emailRegex, passwordRegex } = require("../../../utils/regexes");
const options = require("../../../config/options.json");
const { mysqlPool } = require("../../../db/mysql-pool");

/**
 * Handles the update of user
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
function updateMeHandler(req, res) {
  const { id: userId } = req.user;

  // destructuring request body
  let {
    fullName,
    email,
    currentPassword,
    newPassword,
    newPasswordConfirmation,
  } = req.body;

  // check if at least one field is provided
  if (!fullName && !email && !newPassword) {
    return res.status(400).json({
      success: false,
      message: "At least one field is expected: fullName, email, newPassword",
    });
  }

  // validate fullName if provided
  if (fullName) {
    fullName = fullName.trim();
    if (fullName.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Full name must be at least 3 characters long",
      });
    }
  }

  // validate email if provided
  if (email && !emailRegex.test(email)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid email format" });
  }

  // prepare fields to update
  const updateFields = {};

  if (fullName) updateFields.full_name = fullName;
  if (email) updateFields.email = email;

  // if newPassword provided, verify current password first
  if (newPassword) {
    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is required to change password",
      });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as the current password",
      });
    }

    // fetch current user hash to compare
    const getUserSql = "SELECT password_hash FROM user WHERE id = ?";
    mysqlPool.query(getUserSql, [userId], (err, rows) => {
      if (err) {
        console.error("Error fetching user for password check:", err);
        return res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }

      if (rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      const storedHash = rows[0].password_hash;
      bcrypt.compare(currentPassword, storedHash, (compareErr, isMatch) => {
        if (compareErr) {
          console.error(compareErr);
          return res
            .status(500)
            .json({ success: false, message: "Internal server error" });
        }

        if (!isMatch) {
          return res
            .status(401)
            .json({ success: false, message: "Current password is incorrect" });
        }

        // if newPassword is provided, newPasswordConfirmation must also be provided
        if (!newPasswordConfirmation) {
          return res.status(400).json({
            success: false,
            message:
              "Both newPassword and newPasswordConfirmation are required",
          });
        }

        // validate passwords match
        if (newPassword !== newPasswordConfirmation) {
          return res
            .status(400)
            .json({ success: false, message: "Passwords do not match" });
        }

        // validate password format using passwordRegex
        if (!passwordRegex.test(newPassword)) {
          return res.status(400).json({
            success: false,
            message:
              "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
          });
        }

        const saltRounds = options.auth.saltRounds;
        bcrypt.hash(newPassword, saltRounds, (hashErr, hashedPassword) => {
          if (hashErr) {
            console.error(hashErr);
            return res
              .status(500)
              .json({ success: false, message: "Internal server error" });
          }

          // add hashed password to update fields
          updateFields.password_hash = hashedPassword;
          executeUpdate(updateFields, userId, res);
        });
      });
    });
  } else {
    // proceed without password
    executeUpdate(updateFields, userId, res);
  }
}
module.exports.updateMeHandler = updateMeHandler;

/**
 * Helper function to execute the update query
 *
 * @param {Object} updateFields Object containing fields to update
 * @param {string|number} userId The ID of the user to update
 * @param {express.Response} res Express response object
 */
function executeUpdate(updateFields, userId, res) {
  // build dynamic SQL query
  const fields = Object.keys(updateFields);
  const values = Object.values(updateFields);
  const setClause = fields.map((field) => `${field} = ?`).join(", ");

  // update user with dynamic fields
  const updateUserSql = mysql.format(
    `UPDATE user SET ${setClause} WHERE id = ?`,
    [...values, userId]
  );
  mysqlPool.query(updateUserSql, (err, rows) => {
    if (err) {
      console.error("Error updating user:", err);
      // check if error is due to duplicate email
      if (err.code === "ER_DUP_ENTRY") {
        return res
          .status(409)
          .json({ success: false, message: "Email already in use" });
      }
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }

    if (rows.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "User updated successfully" });
  });
}
