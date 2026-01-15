// SELECT * FROM device d inner join user u where d.user_id = u.id AND serial_number = "";

const pool = require("../db/db.js");

const findUserIdByDeviceMac = async (mac) => {
    console.log(mac);
    const [rows] = await pool.query("SELECT user_id FROM device where serial_number = ?", [mac]);
    console.log(rows);
    return rows[0];
}

const findUserById = async (id) => {
    const [rows] = await pool.query("SELECT * FROM user WHERE id = ?", [id]);
    return rows[0];
}
module.exports = {findUserById,findUserIdByDeviceMac};