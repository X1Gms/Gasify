/**
 * js/home.js - Lógica da Página Home
 */

// Fórmulas de conversão fornecidas para PPM
const convertCO = (v) => (v * 106.0) / 4095.0;
const convertGas = (v) => (v * 6363.0) / 4095.0;

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
            renderStatusCards(data.cards, data.devices.length);
            renderDevices(data.devices);
        } else {
            showToast('error', 'Erro de Dados', 'Não foi possível sincronizar os dispositivos.');
        }
    } catch (error) {
        console.error("Erro ao carregar dispositivos:", error);
        showToast('error', 'Erro de Rede', 'Falha ao ligar ao servidor.');
    }
}

/**
 * Preenche os blocos de status com a lógica PPM e mapeamento Baixa/Média/Alta
 */
function renderStatusCards(cards, totalDevices) {
    const statusValues = document.querySelectorAll(".status-box .big-text");

    if (statusValues.length >= 4 && cards) {
        statusValues[0].textContent = cards.total_devices ?? totalDevices ?? 0;

        // Mapeamento de Gás (Médio) -> PPM
        const gasPpm = cards.avg_gas !== null ? convertGas(cards.avg_gas) : null;
        if (gasPpm === null) {
            statusValues[1].textContent = "---";
        } else {
            if (gasPpm <= 2100) statusValues[1].textContent = "Baixa";
            else if (gasPpm <= 4199) statusValues[1].textContent = "Média";
            else statusValues[1].textContent = "Alta";
        }

        // Mapeamento de CO (Médio) -> PPM
        const coPpm = cards.avg_co !== null ? convertCO(cards.avg_co) : null;
        if (coPpm === null) {
            statusValues[2].textContent = "---";
        } else {
            if (coPpm <= 34) statusValues[2].textContent = "Baixa";
            else if (coPpm <= 69) statusValues[2].textContent = "Média";
            else statusValues[2].textContent = "Alta";
        }

        statusValues[3].textContent = cards.active_alerts || 0;
    }
}

/**
 * Renderiza os cartões com estrutura para alinhar o botão à direita
 */
function renderDevices(devices) {
    const deviceList = document.querySelector(".device-list");
    if (!deviceList) return;
    deviceList.innerHTML = "";

    devices.forEach(device => {
        const deviceItem = document.createElement("div");
        deviceItem.className = device.has_active_alert ? "device-item alert-active" : "device-item";

        deviceItem.innerHTML = `
            <div class="device-left-group">
                <div class="device-icon">
                    <svg class="icon"><use href="#icon-device"></use></svg>
                </div>
                <div class="device-info">
                    <strong>${device.name}</strong>
                    <p>Serial: ${device.serial_number}</p>
                </div>
            </div>
            
            <div class="device-actions">
                ${device.has_active_alert 
                    ? `<button class="cancel-btn" onclick="handleCancelClick(event)">Cancelar Alarme</button>` 
                    : ''
                }
            </div>
        `;

        deviceItem.onclick = (e) => {
            if (e.target.closest('.device-actions')) return;
            window.location.href = `device.html?id=${device.id}`;
        };

        deviceList.appendChild(deviceItem);
    });
}

function handleCancelClick(event) {
    event.stopPropagation();
    const overlay = document.getElementById("modalOverlay");
    const cancelModal = document.getElementById("cancelAlarmModal");

    if (overlay && cancelModal) {
        overlay.classList.add("show");
        cancelModal.classList.add("show");
    }
}

async function handleCreateDevice() {
    const token = localStorage.getItem("token");
    const modal = document.getElementById("addDeviceModal");
    
    const deviceData = {
        name: modal.querySelector('input[placeholder="Nome do Dispositivo"]').value.trim(),
        serialNumber: modal.querySelector('input[placeholder="Código de ID"]').value.trim(),
        countryId: parseInt(modal.querySelector('select').value),
        address: modal.querySelector('input[placeholder="Morada"]').value.trim(),
        postalCode: modal.querySelector('input[placeholder="Código Postal"]').value.trim(),
        seedReadings: document.getElementById("seedReadings").checked
    };

    if (!deviceData.name || !deviceData.serialNumber || !deviceData.countryId) {
        showToast('error', 'Campos Incompletos', 'Nome, ID e País são obrigatórios.');
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
            showToast('success', 'Sucesso', 'Dispositivo criado!');
            setTimeout(() => location.reload(), 1500);
        } else {
            const data = await response.json();
            showToast('error', 'Erro', data.message);
        }
    } catch (error) {
        showToast('error', 'Erro', 'Falha na comunicação.');
    }
}

async function fetchCountries() {
    try {
        const response = await fetch("http://localhost:8081/countries");
        const data = await response.json();
        if (response.ok && data.success) {
            const select = document.querySelector("#addDeviceModal select");
            if (select) {
                select.innerHTML = '<option value="">Selecione o País</option>';
                data.countries.forEach(c => {
                    const opt = document.createElement("option");
                    opt.value = c.id;
                    opt.textContent = c.name;
                    select.appendChild(opt);
                });
            }
        }
    } catch (e) { console.error(e); }
}

document.addEventListener("DOMContentLoaded", () => {
    fetchDevices();
    fetchCountries();
    
    const btnAdicionar = document.querySelector("#addDeviceModal .primary-modal-btn");
    if (btnAdicionar) btnAdicionar.addEventListener("click", handleCreateDevice);
});