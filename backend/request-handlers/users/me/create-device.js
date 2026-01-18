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
      [userId, countryId, name, serialNumber, address, postalCode],
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
          message: `Expected seedReadings to be a boolean value, got ${typeof rawSeedReadings}`,
        });
      }

      if (!seedReadings) {
        return res
          .status(201)
          .json({ success: true, message: "Device created successfully" });
      }

      const deviceId = result.insertId;
      const readings = generateFakeReadings(deviceId, 24);

      const insertReadingsSql = mysql.format(
        `INSERT INTO reading (device_id, gas_type, humidity, temperature, mq2, mq5, created_at) VALUES ?`,
        [readings],
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
 * Generates realistic fake readings for a device distributed across different time periods
 * Ensures data is available for: last hour, last week, last fortnight, and last month
 *
 * @param {string} deviceId The device identifier
 * @param {number} count Total number of readings to generate (default: 12)
 * @returns {Array} Array of readings with [deviceId, gasType, humidity, temperature, mq2, mq5, timestamp]
 */
function generateFakeReadings(deviceId, count = 12) {
  const gasTypes = ["NOTHING", "GAS", "CO"];
  const readings = [];

  const HUMIDITY_RANGE = { min: 35, max: 65 };
  const TEMPERATURE_RANGE = { min: 18, max: 28 };
  const MQ_RANGE = { min: 50, max: 750 };

  const now = Date.now();
  const HOUR_MS = 60 * 60 * 1000;
  const DAY_MS = 24 * HOUR_MS;

  /**
   * time periods distribution:
   * 25% in last hour
   * 25% in last week
   * 25% in last fortnight
   * 25% in last month
   */
  const readingsPerPeriod = Math.floor(count / 4);
  const remainder = count % 4;

  /**
   * Generates a timestamp within a specific time range
   *
   * @param {number} minMs Minimum milliseconds ago from now
   * @param {number} maxMs Maximum milliseconds ago from now
   * @returns {Date}
   */
  const generateTimestamp = (minMs, maxMs) => {
    const randomMs = minMs + Math.random() * (maxMs - minMs);
    return new Date(now - randomMs);
  };

  /**
   * Creates a single reading with random values
   *
   * @param {Date} timestamp
   * @returns {Array}
   */
  const createReading = (timestamp) => {
    const gasType = gasTypes[Math.floor(Math.random() * gasTypes.length)];
    return [
      deviceId,
      gasType,
      randomBetween(HUMIDITY_RANGE.min, HUMIDITY_RANGE.max),
      randomBetween(TEMPERATURE_RANGE.min, TEMPERATURE_RANGE.max),
      randomBetween(MQ_RANGE.min, MQ_RANGE.max),
      randomBetween(MQ_RANGE.min, MQ_RANGE.max),
      timestamp,
    ];
  };

  // generate readings for last hour (0-60 minutes ago)
  for (let i = 0; i < readingsPerPeriod; i++) {
    readings.push(createReading(generateTimestamp(0, HOUR_MS)));
  }

  // generate readings for last week (1-7 days ago)
  for (let i = 0; i < readingsPerPeriod; i++) {
    readings.push(createReading(generateTimestamp(DAY_MS, 7 * DAY_MS)));
  }

  // generate readings for last fortnight (7-14 days ago)
  for (let i = 0; i < readingsPerPeriod; i++) {
    readings.push(createReading(generateTimestamp(7 * DAY_MS, 14 * DAY_MS)));
  }

  // generate readings for last month (14-30 days ago)
  for (let i = 0; i < readingsPerPeriod; i++) {
    readings.push(createReading(generateTimestamp(14 * DAY_MS, 30 * DAY_MS)));
  }

  // distribute remaining readings across all periods
  for (let i = 0; i < remainder; i++) {
    readings.push(createReading(generateTimestamp(0, 30 * DAY_MS)));
  }

  // sort readings by timestamp (most recent first)
  readings.sort((a, b) => b[6].getTime() - a[6].getTime());

  return readings;
}
