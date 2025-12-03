const express = require("express");
const mysql = require("mysql2");

const { emailRegex } = require("../../utils/regexes");
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
  let { full_name, email } = req.body;

  // validate request body
  if (!full_name || !email) {
    return res
      .status(400)
      .json({ message: "Missing fields, expected: full_name, email" });
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

  // update user
  const upateUserSql = mysql.format(
    "UPDATE user SET full_name = ?, email = ? WHERE id = ?",
    [full_name, email, userId]
  );

  mysqlPool.query(upateUserSql, (err, rows) => {
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
module.exports.updateMeHandler = updateMeHandler;
