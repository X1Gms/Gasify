const { resHandler, statusHandler } = require("../utils/mappers.js");

const parsePayload = (rawString) => {
    const parts = rawString.split(";").map(p => p.trim());
    if (parts.length < 7) return null;

    return {
        gas_result: resHandler(parseInt(parts[0])),
        mq2_analog: parseInt(parts[1]),
        mq5_analog: parseInt(parts[2]),
        temperature: parseInt(parts[3]),
        humidity: parseInt(parts[4]),
        mac: parts[5],
        status: statusHandler(parseInt(parts[6]))
    };
};

module.exports = { parsePayload };
