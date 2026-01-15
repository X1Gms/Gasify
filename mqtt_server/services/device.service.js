const pool = require("../db/db.js");

const findDeviceByMac = async (mac) => {
    const [rows] = await pool.query('SELECT * FROM device WHERE serial_number = ?',[mac]);
    return rows[0] || null;
};

const createDevice = async (mac) => {
    await pool.execute("INSERT INTO device (user_id,name,serial_number,located_at,created_at,updated_at) " + "VALUES (null,'',?,null,now(),null)", [mac]);
};

const saveReading = async (deviceId, data) => {
    const [result] = await pool.execute(`INSERT INTO readings
                            (device_id, created_at, gas_type, humidity, temperature, mq2, mq5)
                        VALUES (?, NOW(), ?, ?, ?, ?,
                                ?)`, [deviceId, data.gas_result, data.humidity, data.temperature, data.mq2_analog, data.mq5_analog]);
    return result.insertId;
};
const insertDetection = async (data) => {
    const [result] = await pool.execute("INSERT INTO `gasify`.`mcu_detetion` (`readings_id`,`created_at`,`canceled`) " +
        "VALUES (?,NOW(),?);",[data.id,-1]);
    return result.insertId;
}
const updateDetection = async(data,bit) => {
    const [result] = await pool.execute( "UPDATE `gasify`.`mcu_detetion` SET `canceled` = ? WHERE `id` = ?;", [bit,data.detectId]);
    return data.detectId;
}
const registerDetection = async (data) => {
    let id = null;
    console.log(data);
    switch (data.status){
        case "PENDING":
            id = insertDetection(data);
            break;
        case "CANCELED":
            id = updateDetection(data,1);
            break;
        case "EMERGENCY":
            id = updateDetection(data,0);
            break;
        default: console.warn("Invalid data status!");break;
    }
    return id;
}

module.exports = {
    findDeviceByMac, createDevice, saveReading,
    registerDetection
};
