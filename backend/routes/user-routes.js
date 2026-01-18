const { Router } = require("express");

// import handlers
const { getMeHandler } = require("../request-handlers/users/me/get-me");
const { updateMeHandler } = require("../request-handlers/users/me/update-me");
const { deleteMeHandler } = require("../request-handlers/users/me/delete-me");
const {
  getMeNotificationsHandler,
} = require("../request-handlers/users/me/get-my-notifications");
const {
  updateMeNotificationHandler,
} = require("../request-handlers/users/me/update-my-notification");
const {
  getMyDevicesHandler,
} = require("../request-handlers/users/me/get-my-devices");
const {
  getMyDeviceHandler,
} = require("../request-handlers/users/me/get-my-device");
const {
  createDeviceHandler,
} = require("../request-handlers/users/me/create-device");
const {
  updateMeDeviceHandler,
} = require("../request-handlers/users/me/update-my-device");
const {
  deleteMyDeviceHandler,
} = require("../request-handlers/users/me/delete-my-device");
const {
  cancelDeviceAlertHandler,
} = require("../request-handlers/users/me/cancel-device-alert");

const router = Router();

// routes
router.get("/me", getMeHandler);
router.patch("/me", updateMeHandler);
router.delete("/me", deleteMeHandler);
router.get("/me/notifications", getMeNotificationsHandler);
router.patch("/me/notifications/:id", updateMeNotificationHandler);
router.get("/me/devices", getMyDevicesHandler);
router.get("/me/devices/:id", getMyDeviceHandler);
router.post("/me/devices", createDeviceHandler);
router.patch("/me/devices/:id", updateMeDeviceHandler);
router.delete("/me/devices/:id", deleteMyDeviceHandler);
router.delete("/me/devices/:id/alert", cancelDeviceAlertHandler);

module.exports = router;
