/**
 * js/home.js - Lógica da Página Home com Toasts
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
            // 1. Atualiza os quadradinhos de status
            renderStatusCards(data.cards, data.devices.length);
            
            // 2. Renderiza a lista de dispositivos
            renderDevices(data.devices);
            
            // Opcional: Toast silencioso de sucesso ao carregar
            // showToast('success', 'Dados Atualizados', 'As leituras dos seus dispositivos foram carregadas.');
        } else {
            showToast('error', 'Erro de Dados', 'Não foi possível sincronizar os seus dispositivos.');
        }
    } catch (error) {
        console.error("Erro ao carregar dispositivos:", error);
        showToast('error', 'Erro de Rede', 'Falha ao ligar ao servidor para obter dispositivos.');
    }
}

/**
 * Preenche os blocos de status com lógica de níveis
 */
function renderStatusCards(cards, totalDevices) {
    const statusValues = document.querySelectorAll(".status-box .big-text");

    if (statusValues.length >= 4 && cards) {
        statusValues[0].textContent = cards.total_devices ?? totalDevices ?? 0;

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

        statusValues[3].textContent = cards.active_alerts || 0;
        
        // Se houver alertas ativos, avisa o utilizador no canto direito (Erro/Perigo)
        if (cards.active_alerts > 0) {
            showToast('error', 'Emergência Ativa', `Existem ${cards.active_alerts} dispositivos com fugas detetadas!`);
        }
    }
}

function renderDevices(devices) {
    const deviceList = document.querySelector(".device-list");
    if (!deviceList) return;
    deviceList.innerHTML = "";

    devices.forEach(device => {
        const deviceItem = document.createElement("div");
        
        // Verifica se tem alerta ativo
        if (device.has_active_alert) {
            // Adiciona a classe que criámos no CSS global para brilhar e pulsar
            deviceItem.className = "device-item alert-active";
        } else {
            deviceItem.className = "device-item";
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

async function handleCreateDevice() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const nameInput = document.querySelector('input[placeholder="Nome do Dispositivo"]');
    const serialInput = document.querySelector('input[placeholder="Código de ID"]');
    const countrySelect = document.querySelector('#addDeviceModal select');
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
        showToast('error', 'Campos Incompletos', 'O nome, ID e país são obrigatórios.');
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
            showToast('success', 'Dispositivo Criado', 'O seu novo dispositivo foi registado com sucesso.');
            
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            const data = await response.json();
            showToast('error', 'Erro ao Criar', data.message || "Não foi possível registar o dispositivo.");
        }
    } catch (error) {
        console.error(error);
        showToast('error', 'Erro de Sistema', 'Falha ao comunicar com o servidor.');
    }
}

async function fetchCountries() {
    try {
        const response = await fetch("http://localhost:8081/countries");
        const data = await response.json();

        if (response.ok && data.success) {
            renderCountryOptions(data.countries);
        }
    } catch (error) {
        console.error("Erro ao carregar países:", error);
    }
}

function renderCountryOptions(countries) {
    const select = document.querySelector("#addDeviceModal select");
    if (!select) return;

    select.innerHTML = '<option value="">Selecione o País</option>';

    countries.forEach(country => {
        const option = document.createElement("option");
        option.value = country.id;
        option.textContent = country.name;
        select.appendChild(option);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    fetchDevices();
    fetchCountries();
    
    const btnAdicionar = document.querySelector(".primary-modal-btn");
    if (btnAdicionar) btnAdicionar.addEventListener("click", handleCreateDevice);
});