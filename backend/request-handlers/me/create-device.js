const express = require("express");
const mysql = require("mysql2");

const { mysqlPool } = require("../../db/mysql-pool");

/**
 * Handles the creation of a new device for the authenticated user
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
function createDeviceHandler(req, res) {
  const { id: userId } = req.user;

  // destructure request body
  const { name, serialNumber, countryId, address, postalCode } = req.body;

  // validate request body
  if (!name || !serialNumber || !countryId || !address || !postalCode) {
    return res.status(400).json({
      error:
        "Missing fields, expected: name, serialNumber, countryId, address, postalCode",
    });
  }

  // check if country exists
  const checkCountrySql = mysql.format(`SELECT 1 FROM country WHERE id = ?`, [
    countryId,
  ]);
  mysqlPool.query(checkCountrySql, (err, results) => {
    if (err) {
      console.error("Error checking country:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }

    // if country not found
    if (results.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Country not found" });
    }

    // create device
    const createDeviceSql = mysql.format(
      `INSERT INTO device (user_id, country_id, name, serial_number, address, postal_code) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, countryId, name, serialNumber, address, postalCode]
    );
    mysqlPool.query(createDeviceSql, (err, result) => {
      if (err) {
        // if device already exists
        if (err.code === "ER_DUP_ENTRY") {
          return res
            .status(409)
            .json({ success: false, message: "Device already exists" });
        }

        console.error("Error creating device:", err);
        return res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }

      return res
        .status(201)
        .json({ success: true, message: "Device created successfully" });
    });
  });
}
module.exports.createDeviceHandler = createDeviceHandler;
