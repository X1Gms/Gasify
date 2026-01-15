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

const router = Router();

// routes
router.get("/", requireAuth, getMeHandler);
router.patch("/", requireAuth, updateMeHandler);
router.delete("/", requireAuth, deleteMeHandler);
router.get("/notifications", requireAuth, getMeNotificationsHandler);
router.patch("/notifications/:id", requireAuth, updateMeNotificationHandler);

module.exports = router;
