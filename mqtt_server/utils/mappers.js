const resHandler = (res) => {
  if (res === 0) {
    return "CO";
  } else if (res === 1) {
    return "GAS";
  } else return "NOTHING";
};

const statusHandler = (status) => {
  if (status === 0) return "IDLE";
  if (status === 1) return "PENDING";
  if (status === 2) return "CANCELED";
  if (status === 3) return "EMERGENCY";
};

module.exports = { resHandler, statusHandler };
