// SELECT * FROM device d inner join user u where d.user_id = u.id AND serial_number = "";

const pool = require("../db/db.js");

const findUserByDeviceMac = async (mac) => {
    const [rows] = await pool.execute("SELECT * FROM device d inner join user u where d.user_id = u.id AND serial_number = ?", [mac])
    return rows[0];
}

module.exports = {findUserByDeviceMac};