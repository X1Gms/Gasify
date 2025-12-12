const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { mysqlPool } = require("../../db/mysql-pool");
const options = require("../../config/options.json");

/**
 * Handles user login requests.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
function loginHandler(req, res) {
  // destructuring request body
  const { email, password } = req.body;

  // validate request body
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Missing fields, expected: email, password",
    });
  }

  // find user
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

    const user = rows[0];
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // compare password
    bcrypt.compare(password, user.password_hash, (err, isMatch) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }

      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      const userPayload = {
        id: user.id,
      };

      // generate jwt token
      const token = jwt.sign(userPayload, options.jwt.secret, {
        expiresIn: options.jwt.expiresIn,
      });

      return res.json({
        success: true,
        message: "User logged in successfully",
        token: token,
        user: userPayload,
      });
    });
  });
}

module.exports.loginHandler = loginHandler;
