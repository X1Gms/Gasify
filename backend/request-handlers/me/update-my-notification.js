const express = require("express");
const mysql = require("mysql2");

const { mysqlPool } = require("../../db/mysql-pool");

/**
 * Handles update user notification requests.
 * At the moment, this is only used to mark a notification as read,
 * but it can be used to update other fields in the future because
 * it is scalable.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
function updateMeNotificationHandler(req, res) {
  const { id: userId } = req.user;

  // destructuring id from params
  const { id: notificationId } = req.params;

  // validate notification id
  if (!notificationId) {
    return res.status(400).json({ message: "Missing field, expected: id" });
  }

  // convert notification id to number
  const notificationIdNumber = Number(notificationId);

  // validate notification id is a number
  if (isNaN(notificationIdNumber)) {
    return res.status(400).json({ message: "Invalid notification id" });
  }

  // check if the notification exists and its read status
  const checkNotificationSql = mysql.format(
    `SELECT read_at FROM notification WHERE id = ? AND user_id = ?`,
    [notificationIdNumber, userId]
  );
  mysqlPool.query(checkNotificationSql, (err, results) => {
    if (err) {
      console.error("Error checking notification status:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const notification = results[0];
    // if notification is already read
    if (notification.read_at !== null) {
      return res
        .status(200)
        .json({ message: "Notification is already marked as read" });
    }

    // if notification not already read, proceed to update
    const updateNotificationSql = mysql.format(
      `UPDATE notification SET read_at = NOW() WHERE id = ? AND user_id = ?`,
      [notificationIdNumber, userId]
    );
    mysqlPool.query(updateNotificationSql, (err, result) => {
      if (err) {
        console.error("Error updating notification:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      return res
        .status(200)
        .json({ message: "Notification updated successfully" });
    });
  });
}
module.exports.updateMeNotificationHandler = updateMeNotificationHandler;
