const express = require("express");
const mysql = require("mysql2");

const { mysqlPool } = require("../../db/mysql-pool");

/**
 * Handles the update of a device for the authenticated user
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
function updateMeDeviceHandler(req, res) {
  const { id: userId } = req.user;
  const { id: deviceId } = req.params;

  // destructuring request body
  let { name, countryId, address, postalCode } = req.body;

  // check if at least one field is provided
  if (!name && !countryId && !address && !postalCode) {
    return res.status(400).json({
      success: false,
      message:
        "At least one field is expected: name, countryId, address, postalCode",
    });
  }

  // validate name
  if (name) {
    name = name.trim();
    if (name.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 3 characters long",
      });
    }
  }

  // validate address
  if (address) {
    address = address.trim();
    if (address.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Address must be at least 3 characters long",
      });
    }
  }

  // validate postalCode
  if (postalCode) {
    postalCode = postalCode.trim();
    if (postalCode.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Postal code must be at least 3 characters long",
      });
    }
  }

  // check if device exists and belongs to user
  const checkDeviceSql = mysql.format(
    `SELECT * FROM device WHERE id = ? AND user_id = ?`,
    [deviceId, userId]
  );
  mysqlPool.query(checkDeviceSql, (err, results) => {
    if (err) {
      console.error("Error checking device:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Device not found" });
    }

    // if countryId is provided, check if it exists
    if (countryId) {
      const checkCountrySql = mysql.format(
        `SELECT 1 FROM country WHERE id = ?`,
        [countryId]
      );
      mysqlPool.query(checkCountrySql, (err, countryResults) => {
        if (err) {
          console.error("Error checking country:", err);
          return res
            .status(500)
            .json({ success: false, message: "Internal server error" });
        }

        if (countryResults.length === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Country not found" });
        }

        // proceed with update
        performUpdate();
      });
    } else {
      // proceed with update
      performUpdate();
    }
  });

  function performUpdate() {
    const fieldsToUpdate = [];
    const values = [];

    if (name) {
      fieldsToUpdate.push("name = ?");
      values.push(name);
    }
    if (countryId) {
      fieldsToUpdate.push("country_id = ?");
      values.push(countryId);
    }
    if (address) {
      fieldsToUpdate.push("address = ?");
      values.push(address);
    }
    if (postalCode) {
      fieldsToUpdate.push("postal_code = ?");
      values.push(postalCode);
    }

    // add deviceId and userId to values for WHERE clause
    values.push(deviceId);
    values.push(userId);

    const updateDeviceSql = mysql.format(
      `UPDATE device SET ${fieldsToUpdate.join(
        ", "
      )} WHERE id = ? AND user_id = ?`,
      values
    );

    mysqlPool.query(updateDeviceSql, (err, result) => {
      if (err) {
        console.error("Error updating device:", err);
        return res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }

      return res
        .status(200)
        .json({ success: true, message: "Device updated successfully" });
    });
  }
}
module.exports.updateMeDeviceHandler = updateMeDeviceHandler;
