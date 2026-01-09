const buildEmergencyEmbed = ({
                                 nome,
                                 morada,
                                 temperatura,
                                 humidade
                             }) => {
    return {
        username: "Gasify Alert",
        avatar_url:
            "https://cdn.discordapp.com/icons/1446516300531761335/d0c2c1151208cbe38a7af03db25fdff5.webp?size=80&quality=lossless",
        embeds: [
            {
                title: "🚨 ALERTA EMERGENCIAL — GASIFY",
                color: 13500416,
                author: {
                    name: "Gasify"
                },
                description:
                    `Foi detetado um alerta emergencial de Gás num dispositivo associado a um utilizador.

**Detalhes do alerta:**
• **Nome:** ${nome}
• **Morada:** ${morada}
• **Tipo de alerta:** Gás
• **Temperatura:** ${temperatura} °C
• **Humidade:** ${humidade} %
• **Estado:** ⚠️ EMERGÊNCIA

Este alerta indica uma situação potencialmente perigosa.
Recomenda-se verificação imediata do local e contacto com o utilizador, seguindo os protocolos de segurança definidos pela Gasify.

—
Sistema de Monitorização Gasify
Mensagem gerada automaticamente`
            }
        ]
    };
};

module.exports = {buildEmergencyEmbed};
