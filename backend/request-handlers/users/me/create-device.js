const express = require("express");
const mysql = require("mysql2");

const { mysqlPool } = require("../../../db/mysql-pool");
const { parseBoolean } = require("../../../utils/parse-boolean");

/**
 * Handles the creation of a new device for the authenticated user
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
function createDeviceHandler(req, res) {
  const { id: userId } = req.user;

  // destructure request body
  const {
    name,
    serialNumber,
    countryId,
    address,
    postalCode,
    seedReadings: rawSeedReadings,
  } = req.body;

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

      // seed fake readings if requested
      const seedReadings = parseBoolean(rawSeedReadings);
      if (rawSeedReadings !== undefined && seedReadings === null) {
        return res.status(400).json({
          success: false,
          message:
            "Expected seedReadings to be a boolean value, got " +
            typeof rawSeedReadings,
        });
      }

      if (!seedReadings) {
        return res
          .status(201)
          .json({ success: true, message: "Device created successfully" });
      }

      const deviceId = result.insertId;
      const readings = generateFakeReadings(deviceId, 12);

      const insertReadingsSql = mysql.format(
        `INSERT INTO reading (device_id, gas_type, humidity, temperature, mq2, mq5, created_at) VALUES ?`,
        [readings]
      );

      mysqlPool.query(insertReadingsSql, (err) => {
        if (err) {
          console.error("Error creating fake readings:", err);
          return res.status(500).json({
            success: false,
            message: "Device created but failed to create fake readings",
          });
        }

        return res.status(201).json({
          success: true,
          message: "Device created successfully with fake readings",
        });
      });
    });
  });
}
module.exports.createDeviceHandler = createDeviceHandler;

/**
 * Generates a random number between a minimum and maximum value with a given number of decimals
 *
 * @param {number} min
 * @param {number} max
 * @param {number} decimals (default: 2)
 * @returns {number}
 */
function randomBetween(min, max, decimals = 2) {
  const value = min + Math.random() * (max - min);
  return Number(value.toFixed(decimals));
}

/**
 * Generates realistic fake readings for a device
 * TODO: Make sure the readings are within the expected range
 */
function generateFakeReadings(deviceId, count = 12) {
  const gasTypes = ["LPG", "Methane", "CO", "Smoke"];
  const readings = [];

  const HUMIDITY_RANGE = { min: 35, max: 65 };
  const TEMPERATURE_RANGE = { min: 18, max: 28 };
  const MQ_RANGE = { min: 50, max: 750 };

  for (let i = 0; i < count; i++) {
    const gasType = gasTypes[Math.floor(Math.random() * gasTypes.length)];

    readings.push([
      deviceId,
      gasType,
      randomBetween(HUMIDITY_RANGE.min, HUMIDITY_RANGE.max), // humidity 35–65
      randomBetween(TEMPERATURE_RANGE.min, TEMPERATURE_RANGE.max), // temperature 18–28
      randomBetween(MQ_RANGE.min, MQ_RANGE.max), // mq2 50–750
      randomBetween(MQ_RANGE.min, MQ_RANGE.max), // mq5 50–750
      new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // last 7 days
    ]);
  }

  return readings;
}
