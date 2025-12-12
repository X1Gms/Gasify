const express = require("express");
const mysql = require("mysql2");

const { mysqlPool } = require("../../db/mysql-pool");

/**
 * Handles user get requests.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
function getMeHandler(req, res) {
  const { id: userId } = req.user;

  // get user
  const getUserSql = mysql.format("SELECT * FROM user WHERE id = ?", [userId]);
  mysqlPool.query(getUserSql, (err, result) => {
    if (err) {
      console.error("Error getting user:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }

    if (result.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const dbUser = result[0];
    const user = {
      id: dbUser.id,
      fullName: dbUser.full_name,
      email: dbUser.email,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
    };

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      user,
    });
  });
}

module.exports.getMeHandler = getMeHandler;
