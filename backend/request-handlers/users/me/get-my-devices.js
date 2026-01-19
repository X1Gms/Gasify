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

  // requires multiple statements in config.json
  // get total devices, active alerts, average gas, average co only for the user's devices
  const getInfosAndDevicesSql = mysql.format(
    `
    SELECT
      d.*,
      c.name AS country,
      EXISTS(
        SELECT 1
        FROM reading r
        JOIN mcu_detection md ON md.reading_id = r.id
        WHERE r.device_id = d.id AND md.canceled = -1
      ) AS has_active_alert
    FROM device d
    INNER JOIN country c ON c.id = d.country_id
    WHERE d.user_id = ?;

    SELECT
      COUNT(DISTINCT d.id) AS totalDevices,
      COUNT(DISTINCT CASE
        WHEN EXISTS (
          SELECT 1
          FROM reading r2
          JOIN mcu_detection md ON md.reading_id = r2.id
          WHERE r2.device_id = d.id AND md.canceled = -1
        )
        THEN d.id
      END) AS devicesWithActiveAlert,
      AVG(r.mq2) AS avgGas,
      AVG(r.mq5) AS avgCo
    FROM device d
    LEFT JOIN reading r ON r.device_id = d.id
    WHERE d.user_id = ?;
    `,
    [userId, userId],
  );

  mysqlPool.query(getInfosAndDevicesSql, (err, rows) => {
    if (err) {
      console.error("Error getting user devices:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }

    const devicesRaw = rows[0];
    const statsRaw = rows[1][0];

    const devices = devicesRaw.map((device) => ({
      ...device,
      has_active_alert: !!device.has_active_alert,
    }));

    const cards = {
      total_devices: Number(statsRaw.totalDevices),
      devices_with_active_alert: Number(statsRaw.devicesWithActiveAlert),
      avg_gas:
        statsRaw.avgGas !== null
          ? Number(parseFloat(statsRaw.avgGas).toFixed(2))
          : null,
      avg_co:
        statsRaw.avgCo !== null
          ? Number(parseFloat(statsRaw.avgCo).toFixed(2))
          : null,
    };

    return res.status(200).json({ success: true, cards, devices });
  });
}
module.exports.getMyDevicesHandler = getMyDevicesHandler;
