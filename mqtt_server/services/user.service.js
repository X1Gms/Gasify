// SELECT * FROM device d inner join user u where d.user_id = u.id AND serial_number = "";

const pool = require("../db/db.js");

const findUserByDeviceMac = async (mac) => {
    console.log(mac);
    const [rows] = await pool.query("SELECT * FROM device d left join user u on d.user_id = u.id AND serial_number = ?", [mac]);
    console.log(rows);
    return rows[0];
}

module.exports = {findUserByDeviceMac};