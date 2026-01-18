const express = require("express");
const mysql = require("mysql2");
const crypto = require("node:crypto");

const config = require("../../../config/options.json");

const { mysqlPool } = require("../../../db/mysql-pool");

/**
 * Handles the cancel of a device alert for the authenticated user
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
function cancelDeviceAlertHandler(req, res) {
  const { id: userId } = req.user;
  const { id: deviceId } = req.params;

  // check if device exists and belongs to the user
  const getDeviceSql = mysql.format(
    `SELECT * FROM device WHERE id = ? AND user_id = ?`,
    [deviceId, userId]
  );
  mysqlPool.query(getDeviceSql, [deviceId, userId], (err, row) => {
    if (err) {
      console.error("Error checking device ownership:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }

    if (row.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    const serialNumber = row[0].serial_number;

    const body = {
      downlinks: [
        {
          f_port: config.ttn.fPort,
          frm_payload: generatePayload(serialNumber),
          priority: config.ttn.priority,
        },
      ],
    };

    fetch(urlBuilder(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.ttn.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((response) => {
        if (!response.ok) {
          return res.status(response.status).json({
            success: false,
            message: "Failed to cancel device alert",
          });
        }

        res.status(200).json({
          success: true,
          message: "Device alert cancelled successfully",
        });
      })
      .catch((err) => {
        console.error("Error cancelling device alert:", err);
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      });
  });
}
module.exports.cancelDeviceAlertHandler = cancelDeviceAlertHandler;

/**
 * Builds the URL for the device alert cancellation
 *
 * @returns {string}
 */
function urlBuilder() {
  return `https://${config.ttn.region}.cloud.thethings.network/api/v3/as/applications/${config.ttn.appId}/devices/${config.ttn.devId}/down/push`;
}

/**
 * Generates a payload for the device alert cancellation
 *
 * @param {string} serialNumber
 * @returns {string}
 */
function generatePayload(serialNumber) {
  const md5Hash = crypto.createHash("md5").update(serialNumber).digest("hex");
  const base64Payload = Buffer.from(md5Hash).toString("base64");
  return base64Payload.toString("base64");
}
