/**
 * Lógica da Página Home
 */

// Função para procurar e desenhar os dispositivos
async function fetchDevices() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch("http://localhost:8081/users/me/devices", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            renderDevices(data.devices);
        }
    } catch (error) {
        console.error("Erro ao carregar dispositivos:", error);
    }
}

// Função para construir o HTML dos dispositivos
function renderDevices(devices) {
    const deviceList = document.querySelector(".device-list");
    const deviceCountText = document.querySelector(".status-box .big-text");

    // 1. Atualiza o contador no quadradinho
    if (deviceCountText) deviceCountText.textContent = devices.length;

    // 2. Limpa os "Device#01", "Device#02" estáticos que estão no HTML
    deviceList.innerHTML = "";

    // 3. Adiciona os dispositivos reais
    devices.forEach(device => {
        const deviceItem = document.createElement("div");
        deviceItem.className = "device-item";
        
        // Se houver alerta ativo (canceled = 0 na mcu_detection)
        if (device.has_active_alert) {
            deviceItem.style.borderLeft = "5px solid #ff4d4d";
        }

        deviceItem.innerHTML = `
            <div class="device-icon">
                <svg class="icon"><use href="#icon-device"></use></svg>
            </div>
            <div>
                <strong>${device.name}</strong>
                <p>Número de Série : ${device.serial_number}</p>
            </div>
        `;

        // Clique para ir para detalhes
        deviceItem.addEventListener("click", () => {
            window.location.href = `device.html?id=${device.id}`;
        });

        deviceList.appendChild(deviceItem);
    });
}

/**
 * Função para criar dispositivo (Mantida do teu código)
 */
async function handleCreateDevice() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const nameInput = document.querySelector('input[placeholder="Nome do Dispositivo"]');
    const serialInput = document.querySelector('input[placeholder="Código de ID"]');
    const countrySelect = document.querySelector('select');
    const addressInput = document.querySelector('input[placeholder="Morada"]');
    const postalInput = document.querySelector('input[placeholder="Código Postal"]');

    const deviceData = {
        name: nameInput.value.trim(),
        serialNumber: serialInput.value.trim(),
        countryId: parseInt(countrySelect.value),
        address: addressInput.value.trim(),
        postalCode: postalInput.value.trim()
    };

    if (!deviceData.name || !deviceData.serialNumber || !deviceData.countryId || !deviceData.address || !deviceData.postalCode) {
        alert("Preencha todos os campos.");
        return;
    }

    try {
        const response = await fetch("http://localhost:8081/users/me/devices", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(deviceData)
        });

        const result = await response.json();

        if (response.status === 201) {
            alert("Criado!");
            location.reload(); // Recarrega para fechar modal e atualizar lista
        } else {
            alert("Erro: " + result.message);
        }
    } catch (error) {
        console.error(error);
    }
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    // Carregar a lista real
    fetchDevices();

    // Ligar o botão do modal
    const btnAdicionar = document.querySelector(".primary-modal-btn");
    if (btnAdicionar) {
        btnAdicionar.addEventListener("click", handleCreateDevice);
    }
});