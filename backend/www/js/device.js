/**
 * Lógica da Página de Detalhes do Dispositivo
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Extrair o ID da URL (?id=X)
    const urlParams = new URLSearchParams(window.location.search);
    const deviceId = urlParams.get('id');

    if (!deviceId) {
        window.location.href = "home.html"; // Se não houver ID, volta para trás
        return;
    }

    // 2. Carregar os dados do dispositivo
    fetchDeviceDetails(deviceId);
});

async function fetchDeviceDetails(id) {
    const token = localStorage.getItem("token");
    
    try {
        // Assume que tens uma rota GET /users/me/devices/:id
        const response = await fetch(`http://localhost:8081/users/me/devices/${id}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            updateDeviceUI(data.device);
        }
    } catch (error) {
        console.error("Erro ao carregar detalhes:", error);
    }
}

function updateDeviceUI(device) {
    // Atualiza o título e o número de série
    document.querySelector(".device-title").textContent = device.name;
    document.querySelector(".device-subtitle strong").nextSibling.textContent = ` ${device.serial_number}`;
    
    // Aqui podes adicionar lógica para carregar as leituras nos gráficos
    console.log("Dados do dispositivo carregados:", device);
}