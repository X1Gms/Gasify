const express = require("express");
const bcrypt = require("bcrypt");
const mysql = require("mysql2");

const { emailRegex, passwordRegex } = require("../../utils/regexes");
const { mysqlPool } = require("../../db/mysql-pool");
const options = require("../../config/options.json");

/**
 * Handles user registration requests.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
function registerHandler(req, res) {
  // destructuring request body
  let { fullName, email, password, passwordConfirmation } = req.body;

  // validate request body
  if (!fullName || !email || !password || !passwordConfirmation) {
    return res.status(400).json({
      success: false,
      message:
        "Missing fields, expected: fullName, email, password, passwordConfirmation",
    });
  }

  // trim full name
  fullName = fullName.trim();

  // validate full name
  if (fullName.length < 3) {
    return res.status(400).json({
      success: false,
      message: "Full name must be at least 3 characters long",
    });
  }

  // validate email format
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid email format" });
  }

  // validate password format
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      message: `Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.`,
    });
  }

  // validate password confirmation
  if (password !== passwordConfirmation) {
    return res
      .status(400)
      .json({ success: false, message: "Passwords do not match" });
  }

  // check if user already exists
  const getUserByEmailSql = mysql.format("SELECT * FROM user WHERE email = ?", [
    email,
  ]);
  mysqlPool.query(getUserByEmailSql, (err, rows) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }

    if (rows.length) {
      // prevent user enumeration by returning success but not creating user
      return res.status(200).json({
        success: true,
        message: "User registered successfully. Please log in.",
      });
    }

    const saltRounds = options.auth.saltRounds;
    // hash password
    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }

      // insert user
      const insertUserSql = mysql.format(
        "INSERT INTO user (full_name, email, password_hash) VALUES (?, ?, ?)",
        [fullName, email, hashedPassword]
      );
      mysqlPool.query(insertUserSql, (err, rows) => {
        if (err) {
          console.error(err);
          return res
            .status(500)
            .json({ success: false, message: "Internal server error" });
        }

        return res.status(201).json({
          success: true,
          message: "User registered successfully. Please log in.",
        });
      });
    });
  });
}

module.exports.registerHandler = registerHandler;
