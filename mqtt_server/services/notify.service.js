const axios = require("axios");
const notification = require("../config/options.json").notification;
const { buildEmergencyEmbed } = require("../templates/emergency.template");

const notifyEmergency = async (data) => {
    if (!notification.webhookUrl) {
        console.warn("Notification webhook not configured");
        return;
    }

    const payload = buildEmergencyEmbed({
        nome: data.nome,
        morada: data.morada,
        temperatura: data.temperature,
        humidade: data.humidity
    });

    try {
        await axios.post(notification.webhookUrl, payload);
    } catch (err) {
        console.error("Failed to send emergency notification:", err.message);
    }
};

module.exports = { notifyEmergency };
