const express = require("express");
const bcrypt = require("bcrypt");
const mysql = require("mysql2");

const { emailRegex, passwordRegex } = require("../../utils/regexes");
const options = require("../../config/options.json");
const { mysqlPool } = require("../../db/mysql-pool");

/**
 * Handles the update of user
 * todo: check if we just need to update one field at a time or this is good
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
function updateMeHandler(req, res) {
  const { id: userId } = req.user;

  // todo: check if this is enough or if we still need more fields
  // destructuring request body
  let { full_name, email, password, passwordConfirmation } = req.body;

  // validate request body
  if (!full_name || !email) {
    return res.status(400).json({
      message: "Missing fields, expected: full_name, email",
    });
  }

  // trim full_name
  full_name = full_name.trim();

  // validate full_name
  if (full_name.length < 3) {
    return res
      .status(400)
      .json({ message: "Full name must be at least 3 characters long" });
  }

  // check if email is valid using the util function
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // check if password fields are provided
  const isPasswordUpdate = password || passwordConfirmation;

  if (isPasswordUpdate) {
    // if one password field is provided, both must be provided
    if (!password || !passwordConfirmation) {
      return res.status(400).json({
        message: "Both password and passwordConfirmation are required",
      });
    }

    // validate passwords match
    if (password !== passwordConfirmation) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // validate password format using passwordRegex
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      });
    }

    // hash password and update user with password
    const saltRounds = options.auth.saltRounds;
    bcrypt.hash(password, saltRounds, (hashErr, hashedPassword) => {
      if (hashErr) {
        console.error(hashErr);
        return res.status(500).json({ message: "Internal server error" });
      }

      // update user with password
      const updateUserSql = mysql.format(
        "UPDATE user SET full_name = ?, email = ?, password_hash = ? WHERE id = ?",
        [full_name, email, hashedPassword, userId]
      );

      mysqlPool.query(updateUserSql, (err, rows) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Internal server error" });
        }

        if (rows.affectedRows === 0) {
          return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ message: "User updated successfully" });
      });
    });
  } else {
    // update user without password
    const updateUserSql = mysql.format(
      "UPDATE user SET full_name = ?, email = ? WHERE id = ?",
      [full_name, email, userId]
    );

    mysqlPool.query(updateUserSql, (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
      }

      if (rows.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({ message: "User updated successfully" });
    });
  }
}
module.exports.updateMeHandler = updateMeHandler;
