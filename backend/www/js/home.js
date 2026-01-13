/**
 * Lógica da Página Home - Gasify
 */

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
            // 1. Atualiza os quadradinhos de status com as médias e alertas
            renderStatusCards(data.cards, data.devices.length);
            
            // 2. Renderiza a lista de dispositivos em baixo
            renderDevices(data.devices);
        }
    } catch (error) {
        console.error("Erro ao carregar dispositivos:", error);
    }
}

/**
 * Preenche os blocos de status (quadradinhos) no topo
 */
/**
 * Preenche os blocos de status (quadradinhos) no topo
 */
/**
 * Preenche os blocos de status com lógica de níveis (Baixo/Médio/Alto)
 * sem alteração de cores via JavaScript.
 */
function renderStatusCards(cards, totalDevices) {
    const statusValues = document.querySelectorAll(".status-box .big-text");

    if (statusValues.length >= 4 && cards) {
        // Card 1: Total de Dispositivos
        statusValues[0].textContent = cards.total_devices ?? totalDevices ?? 0;

        // --- Lógica para Card 2: Gás Médio ---
        const gas = cards.avg_gas;
        if (gas === null) {
            statusValues[1].textContent = "---";
        } else if (gas < 300) {
            statusValues[1].textContent = "Baixo";
        } else if (gas < 600) {
            statusValues[1].textContent = "Médio";
        } else {
            statusValues[1].textContent = "Alto";
        }

        // --- Lógica para Card 3: Monóxido de Carbono Médio ---
        const co = cards.avg_co;
        if (co === null) {
            statusValues[2].textContent = "---";
        } else if (co < 200) {
            statusValues[2].textContent = "Baixo";
        } else if (co < 500) {
            statusValues[2].textContent = "Médio";
        } else {
            statusValues[2].textContent = "Alto";
        }

        // Card 4: Emergências Ativas
        statusValues[3].textContent = cards.active_alerts || 0;
    }
}

function renderDevices(devices) {
    const deviceList = document.querySelector(".device-list");
    deviceList.innerHTML = "";

    devices.forEach(device => {
        const deviceItem = document.createElement("div");
        deviceItem.className = "device-item";
        
        // Se o dispositivo tiver um alerta ativo (baseado na tabela mcu_detection)
        if (device.has_active_alert) {
            deviceItem.style.borderLeft = "5px solid #ff4d4d";
        }

        deviceItem.innerHTML = `
            <div class="device-icon">
                <svg class="icon"><use href="#icon-device"></use></svg>
            </div>
            <div>
                <strong>${device.name}</strong>
                <p>Serial Number : ${device.serial_number}</p>
            </div>
        `;

        deviceItem.addEventListener("click", () => {
            window.location.href = `device.html?id=${device.id}`;
        });

        deviceList.appendChild(deviceItem);
    });
}

// ... (Restante do código handleCreateDevice e DOMContentLoaded igual ao anterior)

async function handleCreateDevice() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const nameInput = document.querySelector('input[placeholder="Nome do Dispositivo"]');
    const serialInput = document.querySelector('input[placeholder="Código de ID"]');
    const countrySelect = document.querySelector('select');
    const addressInput = document.querySelector('input[placeholder="Morada"]');
    const postalInput = document.querySelector('input[placeholder="Código Postal"]');
    const seedCheckbox = document.getElementById("seedReadings");

    const deviceData = {
        name: nameInput.value.trim(),
        serialNumber: serialInput.value.trim(),
        countryId: parseInt(countrySelect.value),
        address: addressInput.value.trim(),
        postalCode: postalInput.value.trim(),
        seedReadings: seedCheckbox.checked
    };

    if (!deviceData.name || !deviceData.serialNumber || !deviceData.countryId) {
        alert("Preencha os campos obrigatórios.");
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

        if (response.status === 201) {
            alert("Criado com sucesso!");
            location.reload();
        }
    } catch (error) {
        console.error(error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    fetchDevices();
    const btnAdicionar = document.querySelector(".primary-modal-btn");
    if (btnAdicionar) btnAdicionar.addEventListener("click", handleCreateDevice);
});

/**
 * Procura os países na base de dados e preenche o dropdown do modal
 */
async function fetchCountries() {
    try {
        const response = await fetch("http://localhost:8081/countries"); // Verifica se a tua rota é esta
        const data = await response.json();

        if (response.ok && data.success) {
            renderCountryOptions(data.countries);
        }
    } catch (error) {
        console.error("Erro ao carregar países:", error);
    }
}

/**
 * Renderiza as opções no elemento <select>
 */
function renderCountryOptions(countries) {
    const select = document.querySelector("#addDeviceModal select");
    if (!select) return;

    // Mantém apenas a primeira opção (instrução)
    select.innerHTML = '<option value="">Selecione o País</option>';

    countries.forEach(country => {
        const option = document.createElement("option");
        option.value = country.id; // O ID que o teu handler de criação espera
        option.textContent = country.name;
        select.appendChild(option);
    });
}

// No teu DOMContentLoaded, chama a função:
document.addEventListener("DOMContentLoaded", () => {
    fetchDevices();
    fetchCountries(); // Adiciona esta linha aqui
    
    // ... resto do teu código de clique do botão adicionar ...
});