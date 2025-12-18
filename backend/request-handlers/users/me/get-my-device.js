const express = require("express");
const mysql = require("mysql2");

const { mysqlPool } = require("../../../db/mysql-pool");

/**
 * Handles the retrieval of device details including sensor readings and charts
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
function getMyDeviceHandler(req, res) {
  const { id: userId } = req.user;
  const { id: deviceId } = req.params;
  const { range } = req.query;

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

    // get latest readings
    const getLateastReadingSql = mysql.format(
      "SELECT * FROM readings WHERE device_id = ? ORDER BY created_at DESC LIMIT 1",
      [deviceId]
    );
    mysqlPool.query(getLateastReadingSql, (err, latestReadingRows) => {
      if (err) {
        console.error("Error fetching latest reading:", err);
        return res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }

      // get history readings
      const rangeCondition = getRangeCondition(range);
      const getHistoryReadingsSql = mysql.format(
        `SELECT * FROM readings WHERE device_id = ? AND created_at >= NOW() - INTERVAL ${rangeCondition} ORDER BY created_at ASC`,
        [deviceId]
      );
      mysqlPool.query(getHistoryReadingsSql, (err, historyRows) => {
        if (err) {
          console.error("Error fetching history readings:", err);
          return res
            .status(500)
            .json({ success: false, message: "Internal server error" });
        }

        const response = formatResponse(latestReadingRows[0], historyRows);
        return res.json({
          success: true,
          ...response,
        });
      });
    });
  });
}
module.exports.getMyDeviceHandler = getMyDeviceHandler;

/**
 * Get the SQL interval condition based on range
 *
 * @param {string} range
 */
function getRangeCondition(range) {
  switch (range) {
    case "week":
      return "1 WEEK";
    case "fortnight":
      return "2 WEEK";
    case "month":
      return "1 MONTH";
    case "hour":
    default:
      return "1 HOUR";
  }
}

/**
 * Format the final response structure
 *
 * @param {Object} latestReading
 * @param {Array} historyReadings
 */
function formatResponse(latestReading, historyReadings) {
  // normalize cards
  const cards = {
    gas: latestReading ? latestReading.mq2 : null,
    co: latestReading ? latestReading.mq5 : null,
    temperature: latestReading ? parseFloat(latestReading.temperature) : null,
    humidity: latestReading ? parseFloat(latestReading.humidity) : null,
  };

  // format charts
  const charts = {
    gas: [],
    co: [],
    temperature: [],
    humidity: [],
  };

  historyReadings.forEach((reading) => {
    const timestamp = reading.created_at;
    if (reading.mq2 !== null)
      charts.gas.push({ value: reading.mq2, timestamp });
    if (reading.mq5 !== null) charts.co.push({ value: reading.mq5, timestamp });
    if (reading.temperature !== null)
      charts.temperature.push({
        value: parseFloat(reading.temperature),
        timestamp,
      });
    if (reading.humidity !== null)
      charts.humidity.push({
        value: parseFloat(reading.humidity),
        timestamp,
      });
  });

  return { cards, charts };
}
