const mysql = require("mysql2");

const options = require("../config/options.json");

// create pool
const mysqlPool = mysql.createPool(options.database);

module.exports.mysqlPool = mysqlPool;
