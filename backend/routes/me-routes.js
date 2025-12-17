const { Router } = require("express");

// import middlewares
const { requireAuth } = require("../middlewares/require-auth");

// import handlers
const { getMeHandler } = require("../request-handlers/me/get-me");
const { updateMeHandler } = require("../request-handlers/me/update-me");
const { deleteMeHandler } = require("../request-handlers/me/delete-me");
const {
  getMeNotificationsHandler,
} = require("../request-handlers/me/get-my-notifications");
const {
  updateMeNotificationHandler,
} = require("../request-handlers/me/update-my-notification");
const {
  getMyDevicesHandler,
} = require("../request-handlers/me/get-my-devices");
const { createDeviceHandler } = require("../request-handlers/me/create-device");
const {
  updateMeDeviceHandler,
} = require("../request-handlers/me/update-my-device");

const router = Router();

// routes
router.get("/", requireAuth, getMeHandler);
router.patch("/", requireAuth, updateMeHandler);
router.delete("/", requireAuth, deleteMeHandler);
router.get("/notifications", requireAuth, getMeNotificationsHandler);
router.patch("/notifications/:id", requireAuth, updateMeNotificationHandler);
router.get("/devices", requireAuth, getMyDevicesHandler);
router.post("/devices", requireAuth, createDeviceHandler);
router.patch("/devices/:id", requireAuth, updateMeDeviceHandler);

module.exports = router;
