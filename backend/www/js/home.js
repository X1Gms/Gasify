/**
 * js/home.js - Lógica da Página Home
 * Dashboard com Auto-Refresh e Cancelamento de Alarme com Logs
 */

let homeAlarmIdToCancel = null;
let lastHomeJson = ""; 

// Conversões
const convertCO = (v) => (v * 106.0) / 4095.0;
const convertGas = (v) => (v * 6363.0) / 4095.0;

document.addEventListener("DOMContentLoaded", () => {
    fetchDevices();
    fetchCountries();

    // Auto-Refresh (Polling) a cada 2 segundos
    setInterval(fetchDevices, 2000);

    // Listener Modal Adicionar
    const btnAdicionar = document.querySelector("#addDeviceModal .primary-modal-btn");
    if (btnAdicionar) {
        btnAdicionar.addEventListener("click", handleCreateDevice);
    }

    // Listener Botão "Sim, cancelar"
    const btnConfirmCancel = document.querySelector("#cancelAlarmModal .confirm-btn-modal");
    if (btnConfirmCancel) {
        const newBtn = btnConfirmCancel.cloneNode(true);
        btnConfirmCancel.parentNode.replaceChild(newBtn, btnConfirmCancel);
        newBtn.addEventListener("click", confirmHomeAlarmCancellation);
    }

    // Listener Botão "OK" Sucesso
    const btnSuccessOk = document.querySelector("#cancelSuccessModal .primary-modal-btn");
    if (btnSuccessOk) {
        btnSuccessOk.addEventListener("click", () => {
            if (window.closeModal) window.closeModal();
            lastHomeJson = ""; 
            fetchDevices();
        });
    }
});

/* ==========================================================
   2. FETCH E RENDERIZAÇÃO
   ========================================================== */

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
            const currentJson = JSON.stringify({ cards: data.cards, devices: data.devices });

            // Só atualiza se houver diferenças para evitar piscar
            if (currentJson !== lastHomeJson) {
                lastHomeJson = currentJson;
                renderStatusCards(data.cards, data.devices.length);
                renderDevices(data.devices);
            }
        }
    } catch (error) {
        // Silencioso
    }
}

function renderStatusCards(cards, totalDevices) {
    const statusValues = document.querySelectorAll(".status-box .big-text");

    if (statusValues.length >= 4 && cards) {
        statusValues[0].textContent = cards.total_devices ?? totalDevices ?? 0;

        // Gás
        const gasPpm = cards.avg_gas !== null ? convertGas(cards.avg_gas) : null;
        statusValues[1].textContent = getStatusText(gasPpm, 2100, 4199);

        // CO
        const coPpm = cards.avg_co !== null ? convertCO(cards.avg_co) : null;
        statusValues[2].textContent = getStatusText(coPpm, 34, 69);

        // ALERTAS ATIVOS (Bubble que deve subir)
        const activeAlertsElem = statusValues[3];
        const currentVal = parseInt(activeAlertsElem.textContent) || 0;
        
        // Aqui usamos o valor vindo do backend (cards.active_alerts ou devices_with_active_alert)
        // Garante que o backend retorna "active_alerts" ou "devices_with_active_alert"
        const newVal = cards.active_alerts ?? cards.devices_with_active_alert ?? 0;

        if (currentVal !== newVal) {
            animateValue(activeAlertsElem, currentVal, newVal, 1000);
            activeAlertsElem.style.color = newVal > 0 ? "var(--danger)" : "";
        }
    }
}

function getStatusText(val, lowLimit, mediumLimit) {
    if (val === null) return "---";
    if (val <= lowLimit) return "Baixa";
    if (val <= mediumLimit) return "Média";
    return "Alta";
}

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
                    ? `<button class="cancel-btn" onclick="prepareCancel(${device.id})">Cancelar Alarme</button>` 
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

/* ==========================================================
   3. CANCELAMENTO DE ALARME
   ========================================================== */

// Função chamada pelo botão HTML
window.prepareCancel = function(id) {
    homeAlarmIdToCancel = id;
    console.log("Preparar cancelamento para Device ID:", id); // DEBUG
    if (window.openModal) window.openModal("cancelAlarmModal");
};

async function confirmHomeAlarmCancellation() {
    if (!homeAlarmIdToCancel) {
        console.error("Nenhum ID de alarme selecionado para cancelar.");
        return;
    }
    
    const token = localStorage.getItem("token");
    console.log("A tentar cancelar alarme. ID:", homeAlarmIdToCancel, "Token:", token ? "OK" : "MISSING");

    const btn = document.querySelector("#cancelAlarmModal .confirm-btn-modal");
    const originalText = btn.innerText;
    btn.innerText = "A processar...";
    btn.disabled = true;

    try {
        const res = await fetch(`http://localhost:8081/users/me/devices/${homeAlarmIdToCancel}/alert`, {
            method: "DELETE",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        console.log("Resposta API Cancelamento:", res.status); // DEBUG

        if (res.ok) {
            if (window.openModal) window.openModal("cancelSuccessModal");
            lastHomeJson = ""; // Limpa cache para atualizar
            fetchDevices();    // Atualiza imediatamente
        } else {
            const err = await res.json();
            console.error("Erro API:", err);
            showToast('error', 'Erro', err.message || 'Falha ao cancelar.');
            if (window.closeModal) window.closeModal();
        }
    } catch (e) {
        console.error("Erro Fetch:", e);
        showToast('error', 'Rede', 'Erro de comunicação.');
        if (window.closeModal) window.closeModal();
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
        homeAlarmIdToCancel = null;
    }
}

/* ==========================================================
   4. CRIAÇÃO DE DISPOSITIVO
   ========================================================== */

async function handleCreateDevice() {
    const token = localStorage.getItem("token");
    const modal = document.getElementById("addDeviceModal");
    
    const deviceData = {
        name: modal.querySelector('input[placeholder="Nome do Dispositivo"]').value.trim(),
        serialNumber: modal.querySelector('input[placeholder="Código de ID"]').value.trim(),
        countryId: parseInt(modal.querySelector('select').value),
        address: modal.querySelector('input[placeholder="Morada"]').value.trim(),
        postalCode: modal.querySelector('input[placeholder="Código Postal"]').value.trim(),
        seedReadings: document.getElementById("seedReadings") ? document.getElementById("seedReadings").checked : false
    };

    if (!deviceData.name || !deviceData.serialNumber || !deviceData.countryId) {
        showToast('error', 'Campos', 'Preencha os dados obrigatórios.');
        return;
    }

    try {
        const res = await fetch("http://localhost:8081/users/me/devices", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(deviceData)
        });

        if (res.status === 201) {
            showToast('success', 'Criado', 'Dispositivo adicionado!');
            if (window.closeModal) window.closeModal();
            lastHomeJson = "";
            fetchDevices();
        } else {
            const data = await res.json();
            showToast('error', 'Erro', data.message);
        }
    } catch (e) {
        showToast('error', 'Rede', 'Falha na comunicação.');
    }
}

async function fetchCountries() {
    try {
        const response = await fetch("http://localhost:8081/countries");
        const data = await response.json();
        if (response.ok && data.success) {
            const select = document.querySelector("#addDeviceModal select");
            if (select) {
                const options = data.countries.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
                select.innerHTML = '<option value="">Selecione o País</option>' + options;
            }
        }
    } catch (e) { console.error(e); }
}

/* ==========================================================
   5. ANIMAÇÃO DE NÚMEROS
   ========================================================== */
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end;
        }
    };
    window.requestAnimationFrame(step);
}