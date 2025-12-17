const express = require("express");
const mysql = require("mysql2");

const { mysqlPool } = require("../../db/mysql-pool");

/**
 * Handles get countries requests.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
function getCountriesHandler(req, res) {
  // get countries
  const getCountriesSql = "SELECT * FROM country";
  mysqlPool.query(getCountriesSql, (err, rows) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }

    return res.json({ success: true, countries: rows });
  });
}

module.exports.getCountriesHandler = getCountriesHandler;
