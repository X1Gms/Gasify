const axios = require("axios");
const { discord } = require("../config/options.json").notification;
const { buildEmergencyEmbed } = require("../templates/emergency.template");

const notifyEmergency = async (data) => {
    if (!discord.webhookUrl) {
        console.warn("Discord webhook not configured");
        return;
    }

    const payload = buildEmergencyEmbed({
        nome: data.nome,
        morada: data.morada,
        temperatura: data.temperature,
        humidade: data.humidity
    });

    try {
        await axios.post(discord.webhookUrl, payload);
    } catch (err) {
        console.error("Failed to send emergency notification:", err.message);
    }
};

module.exports = { notifyEmergency };
