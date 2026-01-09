const mysql = require('mysql2');
const options = require("../config/options.json").mysql;

// const pool = mysql.createPool({
//     host: options.host,
//     user: options.user,
//     password: options.password,
//     database: options.database,
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });

const pool = mysql.createPool(options);

// create pool
// const mysqlPool = mysql.createPool(options.database);

module.exports = pool;