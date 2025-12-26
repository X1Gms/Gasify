const express = require("express");

const { isDevelopmentEnv } = require("./dev-environment");

/**
 * Sends a neutral response to the client, with optional debug information in development.
 *
 * @param {express.Response} res
 * @param {boolean} success Success status
 * @param {string} debugMessage Message shown in development environment
 * @param {string} productionMessage Message shown in production environment
 * @param {Object} [extraDebugData={}] Additional data to include in the response in development environment
 */
function sendNeutralResponse(
  res,
  success = true,
  debugMessage,
  productionMessage,
  extraDebugData = {}
) {
  if (isDevelopmentEnv) {
    return res.status(200).json({
      success,
      debugMessage,
      ...extraDebugData,
    });
  }

  return res.status(200).json({
    success,
    message: productionMessage,
  });
}

module.exports = { sendNeutralResponse };
