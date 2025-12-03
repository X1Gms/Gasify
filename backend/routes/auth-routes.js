const { Router } = require("express");

// import handlers
const { registerHandler } = require("../request-handlers/auth/register");
const { loginHandler } = require("../request-handlers/auth/login");
const {
  forgotPasswordHandler,
} = require("../request-handlers/auth/forgot-password");
const {
  verifyPasswordResetCodeHandler,
} = require("../request-handlers/auth/verify-password-reset-code");
const {
  resetPasswordHandler,
} = require("../request-handlers/auth/reset-password");

const router = Router();

// routes
router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.post("/forgot-password", forgotPasswordHandler);
router.post("/verify-password-reset-code", verifyPasswordResetCodeHandler);
router.post("/reset-password", resetPasswordHandler);

module.exports = router;
