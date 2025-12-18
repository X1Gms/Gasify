const express = require("express");
const mysql = require("mysql2");

const { mysqlPool } = require("../../../db/mysql-pool");

/**
 * Handles user devices requests.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
function getMyDevicesHandler(req, res) {
  const { id: userId } = req.user;

  // get user devices
  const getUserDevicesSql = mysql.format(
    `SELECT * FROM device WHERE user_id = ?`,
    [userId]
  );
  mysqlPool.query(getUserDevicesSql, (err, result) => {
    if (err) {
      console.error("Error getting user devices:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }

    return res.status(200).json({ success: true, devices: result });
  });
}
module.exports.getMyDevicesHandler = getMyDevicesHandler;
