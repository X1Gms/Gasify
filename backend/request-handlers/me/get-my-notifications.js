const express = require("express");
const mysql = require("mysql2");

const { mysqlPool } = require("../../db/mysql-pool");

/**
 * Handles user notifications requests.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
function getMeNotificationsHandler(req, res) {
  const { id: userId } = req.user;

  // get user notifications with type
  const getUserNotificationsSql = mysql.format(
    `SELECT notification.*, notification_type.name AS type FROM notification JOIN notification_type ON notification.type_id = notification_type.id WHERE notification.user_id = ?`,
    [userId]
  );
  mysqlPool.query(getUserNotificationsSql, (err, result) => {
    if (err) {
      console.error("Error getting user notifications:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    return res.status(200).json(result);
  });
}
module.exports.getMeNotificationsHandler = getMeNotificationsHandler;
