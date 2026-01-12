const express = require("express");
const mysql = require("mysql2");

const { mysqlPool } = require("../../../db/mysql-pool");

/**
 * Handles user notifications requests.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
function getMeNotificationsHandler(req, res) {
  const { id: userId } = req.user;

  // get user notifications
  const getUserNotificationsSql = mysql.format(
    `
    SELECT
      n.id AS notification_id,
      n.created_at AS notification_created_at,
      n.read_at,
  
      md.id AS detection_id,
      md.canceled,
  
      r.id AS reading_id,
      r.gas_type,
      r.mq2,
      r.mq5,
      r.created_at AS reading_created_at,
  
      d.id AS device_id,
      d.name AS device_name,
      d.serial_number,
      d.address,
      d.postal_code,
  
      SUM(CASE WHEN n.read_at IS NULL THEN 1 ELSE 0 END) OVER() AS unread_count
  
    FROM notification n
    JOIN mcu_detection md ON md.id = n.mcu_detection_id
    JOIN reading r ON r.id = md.reading_id
    JOIN device d ON d.id = r.device_id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    `,
    [userId]
  );
  mysqlPool.query(getUserNotificationsSql, (err, result) => {
    if (err) {
      console.error("Error getting user notifications:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }

    // transform the unread count into a number
    const unreadCount = Number(result[0]?.unread_count || 0);

    // transform flat result into nested objects
    const notifications = result.map((row) => ({
      id: row.notification_id,
      created_at: row.notification_created_at,
      read_at: row.read_at,
      device: {
        id: row.device_id,
        name: row.device_name,
        serial_number: row.serial_number,
        address: row.address,
        postal_code: row.postal_code,
      },
      reading: {
        id: row.reading_id,
        gas_type: row.gas_type,
        gas: row.mq2,
        co: row.mq5,
        created_at: row.reading_created_at,
      },
      detection: {
        id: row.detection_id,
        canceled: !!row.canceled,
      },
    }));

    return res.status(200).json({
      success: true,
      unread_count: unreadCount,
      notifications,
    });
  });
}
module.exports.getMeNotificationsHandler = getMeNotificationsHandler;
