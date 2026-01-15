const options = require("../config/options.json");

const isDevelopmentEnv = options.server.environment === "development";
module.exports.isDevelopmentEnv = isDevelopmentEnv;
