const pool = require("../db/db.js");

const findDeviceByMac = async (mac) => {
    const [rows] = await pool.execute("SELECT * FROM device WHERE serial_number = ?", [mac]);
    return rows[0];
};

const createDevice = async (mac) => {
    await pool.execute("INSERT INTO device (user_id,name,serial_number,located_at,created_at,updated_at) " + "VALUES (null,'',?,null,now(),null)", [mac]);
};

const saveReading = async (deviceId, data) => {
    await pool.execute(`INSERT INTO readings
                            (device_id, created_at, gas_type, humidity, temperature, mq2, mq5)
                        VALUES (?, NOW(), ?, ?, ?, ?,
                                ?)`, [deviceId, data.gas_result, data.humidity, data.temperature, data.mq2_analog, data.mq5_analog]);
};

module.exports = {
    findDeviceByMac, createDevice, saveReading
};
