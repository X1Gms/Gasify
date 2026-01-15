const { Router } = require("express");

// import middlewares
const { requireAuth } = require("../middlewares/require-auth");

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
  cancelDeviceAlarmHandler,
} = require("../request-handlers/users/me/cancel-device-alarm");

const router = Router();

// routes
router.get("/me", requireAuth, getMeHandler);
router.patch("/me", requireAuth, updateMeHandler);
router.delete("/me", requireAuth, deleteMeHandler);
router.get("/me/notifications", requireAuth, getMeNotificationsHandler);
router.patch("/me/notifications/:id", requireAuth, updateMeNotificationHandler);
router.get("/me/devices", requireAuth, getMyDevicesHandler);
router.get("/me/devices/:id", requireAuth, getMyDeviceHandler);
router.post("/me/devices", requireAuth, createDeviceHandler);
router.patch("/me/devices/:id", requireAuth, updateMeDeviceHandler);
router.delete("/me/devices/:id", requireAuth, deleteMyDeviceHandler);
router.delete("/me/devices/:id/alarm", requireAuth, cancelDeviceAlarmHandler);

module.exports = router;
