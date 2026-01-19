/**
 * js/devices.js
 * Gestão Completa + Auto-Refresh + Modais
 */

// --- Variáveis Globais ---
let deviceIdToDelete = null;
let alarmIdToCancel = null;
let currentEditId = null;
let lastDevicesJson = ""; // Smart Update

// =======================================================
// 1. INICIALIZAÇÃO
// =======================================================
document.addEventListener("DOMContentLoaded", () => {
    fetchManagementDevices();
    fetchCountriesForManagement();

    // Auto-Refresh (2s)
    setInterval(fetchManagementDevices, 2000);

    // --- Listeners de Abertura de Modais ---
    
    // Botão Adicionar Dispositivo (O grande)
    const openAddBtn = document.querySelector(".add-device-btn");
    if (openAddBtn) {
        openAddBtn.addEventListener("click", () => openModal("addDeviceModal"));
    }

    // --- Listeners de Ação nos Modais ---

    // Confirmar Adição
    const addSubmitBtn = document.querySelector("#addDeviceModal .primary-modal-btn");
    if (addSubmitBtn) addSubmitBtn.addEventListener("click", handleAddDevice);

    // Confirmar Edição
    const editSubmitBtn = document.querySelector("#editDeviceModal .primary-modal-btn");
    if (editSubmitBtn) editSubmitBtn.addEventListener("click", handleEditDevice);

    // Confirmar Eliminação
    const confirmDeleteBtn = document.querySelector("#deleteDeviceModal .confirm-btn-modal");
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener("click", confirmDeleteDevice);

    // Confirmar Cancelamento de Alarme
    const confirmCancelAlarmBtn = document.querySelector("#cancelAlarmModal .confirm-btn-modal");
    if (confirmCancelAlarmBtn) {
        const newBtn = confirmCancelAlarmBtn.cloneNode(true);
        confirmCancelAlarmBtn.parentNode.replaceChild(newBtn, confirmCancelAlarmBtn);
        newBtn.addEventListener("click", confirmAlarmCancellation);
    }

    // --- Gestão Genérica de Fecho de Modais ---
    
    // Botões X e Cancelar/Voltar
    document.querySelectorAll("[data-close]").forEach(btn => {
        btn.addEventListener("click", closeModal);
    });

    // Clicar fora do modal (Overlay)
    const overlay = document.getElementById("modalOverlay");
    if (overlay) {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) closeModal();
        });
    }
});

// =======================================================
// FUNÇÕES AUXILIARES DE MODAL
// =======================================================

function openModal(modalId) {
    const overlay = document.getElementById("modalOverlay");
    const modal = document.getElementById(modalId);
    if (overlay && modal) {
        // Fecha outros abertos
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
        overlay.classList.add("show");
        modal.classList.add("show");
    }
}

function closeModal() {
    const overlay = document.getElementById("modalOverlay");
    if (overlay) overlay.classList.remove("show");
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
}

/* ==========================================================
   2. FETCH COM SMART UPDATE
   ========================================================== */

async function fetchManagementDevices() {
    // Pausa se houver menu aberto
    if (document.querySelector(".device-menu[style='display: block;']")) return;

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
            const currentJson = JSON.stringify(data.devices);

            if (currentJson !== lastDevicesJson) {
                lastDevicesJson = currentJson;
                renderManagementCards(data.devices);
            }
        }
    } catch (error) {
        // Silencioso
    }
}

function renderManagementCards(devices) {
    const listContainer = document.querySelector(".device-list");
    if (!listContainer) return;
    listContainer.innerHTML = ""; 

    devices.forEach(device => {
        const card = document.createElement("div");
        card.className = `device-card ${device.has_active_alert ? 'alarm' : ''}`;
        
        card.innerHTML = `
            <div class="device-left">
                <div class="device-icon ${device.has_active_alert ? 'red' : ''}">
                    <svg class="icon"><use href="#icon-device"></use></svg>
                </div>
                <div>
                    <strong>${device.name}</strong>
                    <p class="serial">Número de Série : ${device.serial_number}</p>
                </div>
            </div>
            
            <div class="device-actions">
                ${device.has_active_alert 
                    ? `<button class="cancel-btn" onclick="prepareCancelAlarm(${device.id})">Cancelar Alarme</button>`
                    : `<button class="dots-btn" onclick="toggleDeviceMenu(event, this)">⋮</button>`
                }

                <div class="device-menu" style="display: none;">
                    <p class="opt" onclick='event.stopPropagation(); prepareEditDevice(${JSON.stringify(device).replace(/'/g, "&apos;")})'>Editar</p>
                    <p class="opt delete" onclick="event.stopPropagation(); prepareDeleteDevice(${device.id})">Eliminar</p>
                </div>
            </div>
        `;

        card.onclick = (e) => {
            if (e.target.closest('.device-actions')) return;
            window.location.href = `device.html?id=${device.id}`;
        };

        listContainer.appendChild(card);
    });
}

/* ==========================================================
   3. LÓGICA DE CANCELAMENTO
   ========================================================== */

// Chamado pelo botão HTML
window.prepareCancelAlarm = function(id) {
    // Stop propagation não é necessário aqui pq o onclick está no botão, 
    // mas precisamos garantir que o clique não navegue para o detalhe (tratado no onclick do card)
    event.stopPropagation(); 
    alarmIdToCancel = id;
    openModal("cancelAlarmModal");
};

async function confirmAlarmCancellation() {
    if (!alarmIdToCancel) return;

    const token = localStorage.getItem("token");
    const btn = document.querySelector("#cancelAlarmModal .confirm-btn-modal");
    
    const originalText = btn.innerText;
    btn.innerText = "A cancelar...";
    btn.disabled = true;

    try {
        const response = await fetch(`http://localhost:8081/users/me/devices/${alarmIdToCancel}/alert`, {
            method: "DELETE",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json" 
            }
        });

        if (response.ok) {
            openModal("cancelSuccessModal");
            lastDevicesJson = ""; // Força atualização
            fetchManagementDevices();
        } else {
            const data = await response.json();
            showToast('error', 'Erro', data.message || 'Falha ao cancelar.');
            closeModal();
        }
    } catch (error) {
        showToast('error', 'Rede', 'Erro de comunicação.');
        closeModal();
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
        alarmIdToCancel = null;
    }
}

/* ==========================================================
   4. CRUD (ADD, EDIT, DELETE)
   ========================================================== */

// --- PAÍSES ---
async function fetchCountriesForManagement() {
    try {
        const response = await fetch("http://localhost:8081/countries");
        const data = await response.json();
        if (response.ok && data.success) {
            const optionsHTML = data.countries.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            const placeholder = '<option value="">Selecione o País</option>';
            
            const addSelect = document.querySelector("#addDeviceModal select");
            const editSelect = document.querySelector("#editDeviceModal select");
            
            if (addSelect) addSelect.innerHTML = placeholder + optionsHTML;
            if (editSelect) editSelect.innerHTML = placeholder + optionsHTML;
        }
    } catch (e) { console.error(e); }
}

// --- ADD ---
async function handleAddDevice() {
    const token = localStorage.getItem("token");
    const modal = document.getElementById("addDeviceModal");
    
    const payload = {
        name: modal.querySelector('input[placeholder="Nome do Dispositivo"]').value.trim(),
        serialNumber: modal.querySelector('input[placeholder="Código de ID"]').value.trim(),
        countryId: parseInt(modal.querySelector('select').value),
        address: modal.querySelector('input[placeholder="Morada"]').value.trim(),
        postalCode: modal.querySelector('input[placeholder="Código Postal"]').value.trim(),
        seedReadings: false
    };

    if (!payload.name || !payload.serialNumber || !payload.countryId) {
        showToast('error', 'Campos', 'Preencha Nome, ID e País.');
        return;
    }

    try {
        const res = await fetch("http://localhost:8081/users/me/devices", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            showToast('success', 'Sucesso', 'Dispositivo criado.');
            closeModal();
            lastDevicesJson = "";
            fetchManagementDevices();
        } else {
            const err = await res.json();
            showToast('error', 'Erro', err.message);
        }
    } catch (e) { showToast('error', 'Rede', 'Falha ao criar.'); }
}

// --- EDIT ---
window.prepareEditDevice = function(device) {
    currentEditId = device.id;
    const modal = document.getElementById("editDeviceModal");
    modal.querySelector('input[placeholder="Nome do Dispositivo"]').value = device.name;
    modal.querySelector('input[disabled]').value = device.serial_number;
    modal.querySelector('select').value = device.country_id;
    modal.querySelector('input[placeholder="Morada"]').value = device.address;
    modal.querySelector('input[placeholder="Código Postal"]').value = device.postal_code;
    openModal("editDeviceModal");
};

async function handleEditDevice() {
    const token = localStorage.getItem("token");
    const modal = document.getElementById("editDeviceModal");
    const payload = {
        name: modal.querySelector('input[placeholder="Nome do Dispositivo"]').value.trim(),
        countryId: parseInt(modal.querySelector('select').value),
        address: modal.querySelector('input[placeholder="Morada"]').value.trim(),
        postalCode: modal.querySelector('input[placeholder="Código Postal"]').value.trim()
    };

    try {
        const res = await fetch(`http://localhost:8081/users/me/devices/${currentEditId}`, {
            method: "PATCH",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            showToast('success', 'Sucesso', 'Atualizado.');
            closeModal();
            lastDevicesJson = "";
            fetchManagementDevices();
        } else showToast('error', 'Erro', 'Falha ao editar.');
    } catch (e) { showToast('error', 'Rede', 'Falha ao editar.'); }
}

// --- DELETE ---
window.prepareDeleteDevice = function(id) {
    deviceIdToDelete = id;
    openModal("deleteDeviceModal");
};

async function confirmDeleteDevice() {
    if (!deviceIdToDelete) return;
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`http://localhost:8081/users/me/devices/${deviceIdToDelete}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
            showToast('success', 'Sucesso', 'Eliminado.');
            closeModal();
            lastDevicesJson = "";
            fetchManagementDevices();
        } else showToast('error', 'Erro', 'Falha ao eliminar.');
    } catch (e) { showToast('error', 'Rede', 'Falha ao eliminar.'); }
}

/* ==========================================================
   5. MENU DE OPÇÕES (3 PONTOS)
   ========================================================== */

window.toggleDeviceMenu = function(event, btn) {
    event.stopPropagation();
    const card = btn.closest(".device-card");
    const menu = btn.nextElementSibling;
    const isVisible = menu.style.display === "block";

    document.querySelectorAll(".device-menu").forEach(m => m.style.display = "none");
    document.querySelectorAll(".device-card").forEach(c => c.classList.remove("active"));
    
    if (!isVisible) {
        menu.style.display = "block";
        card.classList.add("active"); 
    }
};

document.addEventListener("click", () => {
    document.querySelectorAll(".device-menu").forEach(m => m.style.display = "none");
    document.querySelectorAll(".device-card").forEach(c => c.classList.remove("active"));
});