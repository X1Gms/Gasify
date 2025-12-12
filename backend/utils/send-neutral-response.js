const express = require("express");

const { isDevelopmentEnv } = require("./dev-environment");

/**
 * Sends a neutral response to the client, with optional debug information in development.
 *
 * @param {express.Response} res
 * @param {string} debugMessage - Message shown in development environment
 * @param {string} productionMessage - Message shown in production environment
 * @param {object} [extraDebugData={}] - Additional data to include in the response in development environment
 */
function sendNeutralResponse(
  res,
  debugMessage,
  productionMessage,
  extraDebugData = {}
) {
  if (isDevelopmentEnv) {
    return res.status(200).json({
      success: true,
      debugMessage,
      ...extraDebugData,
    });
  }

  return res.status(200).json({
    success: true,
    message: productionMessage,
  });
}

module.exports = { sendNeutralResponse };
