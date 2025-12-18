const express = require("express");
const mysql = require("mysql2");

const { mysqlPool } = require("../../db/mysql-pool");

/**
 * Handles the deletion of a device
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
function deleteMyDeviceHandler(req, res) {
  const { id: userId } = req.user;
  const { id: deviceId } = req.params;

  // validate deviceId
  if (!deviceId || isNaN(parseInt(deviceId))) {
    return res.status(400).json({
      success: false,
      message: "Invalid device ID",
    });
  }

  // check ownership
  const checkOwnershipSql = mysql.format(
    "SELECT id FROM device WHERE id = ? AND user_id = ?",
    [deviceId, userId]
  );
  mysqlPool.query(checkOwnershipSql, (err, results) => {
    if (err) {
      console.error("Error checking device ownership:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }

    // check if device exists in user's devices
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    // delete device
    const deleteDeviceSql = mysql.format("DELETE FROM device WHERE id = ?", [
      deviceId,
    ]);
    mysqlPool.query(deleteDeviceSql, (err, result) => {
      if (err) {
        console.error("Error deleting device:", err);
        return res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }

      return res.json({
        success: true,
        message: "Device deleted successfully",
      });
    });
  });
}

module.exports.deleteMyDeviceHandler = deleteMyDeviceHandler;
