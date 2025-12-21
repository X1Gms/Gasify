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
    `SELECT d.*, EXISTS(SELECT 1 FROM reading r JOIN mcu_detection md ON md.reading_id = r.id WHERE r.device_id = d.id AND md.canceled = 0) as has_active_alert FROM device d WHERE d.user_id = ?`,
    [userId]
  );
  mysqlPool.query(getUserDevicesSql, (err, result) => {
    if (err) {
      console.error("Error getting user devices:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }

    const devices = result.map((device) => ({
      ...device,
      has_active_alert: !!device.has_active_alert,
    }));

    return res.status(200).json({ success: true, devices });
  });
}
module.exports.getMyDevicesHandler = getMyDevicesHandler;
