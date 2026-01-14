/**
 * Gestão Completa de Dispositivos (Listagem, Criação, Eliminação) com Toasts
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Carregar lista de dispositivos e países inicial
    fetchManagementDevices();
    fetchCountriesForManagement();

    // 2. Configurar Submissão de Novo Dispositivo
    const addSubmitBtn = document.querySelector("#addDeviceModal .primary-modal-btn");
    if (addSubmitBtn) {
        addSubmitBtn.addEventListener("click", handleAddDevice);
    }

    // 3. Configurar Submissão de Edição
    const editSubmitBtn = document.querySelector("#editDeviceModal .primary-modal-btn");
    if (editSubmitBtn) {
        editSubmitBtn.addEventListener("click", handleEditDevice);
    }
});

/**
 * Procura os países na API e preenche os selects (Add e Edit)
 */
async function fetchCountriesForManagement() {
    try {
        const response = await fetch("http://localhost:8081/countries");
        const data = await response.json();

        if (response.ok && data.success) {
            const addSelect = document.querySelector("#addDeviceModal select");
            const editSelect = document.querySelector("#editDeviceModal select");
            
            const optionsHTML = data.countries.map(c => 
                `<option value="${c.id}">${c.name}</option>`
            ).join('');

            const placeholder = '<option value="">Selecione o País</option>';
            if (addSelect) addSelect.innerHTML = placeholder + optionsHTML;
            if (editSelect) editSelect.innerHTML = placeholder + optionsHTML;
        }
    } catch (error) {
        showToast('error', 'Erro de Países', 'Não foi possível carregar a lista de países.');
    }
}

/**
 * Procura os dispositivos e renderiza no formato de cartões
 */
async function fetchManagementDevices() {
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
            renderManagementCards(data.devices);
        }
    } catch (error) {
        showToast('error', 'Erro de Ligação', 'Não conseguimos obter a sua lista de dispositivos.');
    }
}


/**
 * Desenha os cartões na lista
 */
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
                    ? `<button class="cancel-btn" onclick="handleCancelClick(event)">Cancelar Alarme</button>`
                    : `<button class="dots-btn" onclick="toggleDeviceMenu(event, this)">⋮</button>`
                }

                <div class="device-menu" style="display: none;">
                    <p class="opt" onclick='event.stopPropagation(); openEditModal(${JSON.stringify(device).replace(/'/g, "&apos;")})'>Editar</p>
                    <p class="opt delete" onclick="event.stopPropagation(); openDeleteModal(${device.id})">Eliminar</p>
                </div>
            </div>
        `;

        card.onclick = () => {
            window.location.href = `device.html?id=${device.id}`;
        };

        listContainer.appendChild(card);
    });
}

function toggleDeviceMenu(event, btn) {
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
}

document.addEventListener("click", () => {
    document.querySelectorAll(".device-menu").forEach(m => m.style.display = "none");
    document.querySelectorAll(".device-card").forEach(c => c.classList.remove("active"));
});

function handleCancelClick(event) {
    event.stopPropagation();
    const cancelModal = document.getElementById("cancelAlarmModal");
    const overlay = document.getElementById("modalOverlay");
    if(cancelModal && overlay) {
        overlay.classList.add("show");
        cancelModal.classList.add("show");
    }
}

/**
 * Lógica para Adicionar Dispositivo
 */
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
        showToast('error', 'Campos Obrigatórios', 'Preencha o Nome, ID e País.');
        return;
    }

    try {
        const response = await fetch("http://localhost:8081/users/me/devices", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showToast('success', 'Dispositivo Adicionado', 'O novo dispositivo foi registado com sucesso.');
            setTimeout(() => location.reload(), 1500);
        } else {
            const err = await response.json();
            showToast('error', 'Falha ao Criar', err.message || "Erro no servidor.");
        }
    } catch (error) {
        showToast('error', 'Erro de Rede', 'Não foi possível ligar ao servidor.');
    }
}

/**
 * Lógica para Editar Dispositivo
 */
let currentEditId = null;

function openEditModal(device) {
    currentEditId = device.id;
    const modal = document.getElementById("editDeviceModal");
    
    modal.querySelector('input[placeholder="Nome do Dispositivo"]').value = device.name;
    modal.querySelector('input[disabled]').value = device.serial_number;
    modal.querySelector('select').value = device.country_id;
    modal.querySelector('input[placeholder="Morada"]').value = device.address;
    modal.querySelector('input[placeholder="Código Postal"]').value = device.postal_code;

    document.getElementById("modalOverlay").classList.add("show");
    modal.classList.add("show");
}

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
        const response = await fetch(`http://localhost:8081/users/me/devices/${currentEditId}`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showToast('success', 'Dispositivo Atualizado', 'As alterações foram guardadas.');
            setTimeout(() => location.reload(), 1500);
        } else {
            showToast('error', 'Erro na Edição', 'Não foi possível atualizar o dispositivo.');
        }
    } catch (error) {
        showToast('error', 'Erro de Rede', 'Ligação perdida com o servidor.');
    }
}

/**
 * Lógica para Eliminar
 */
let deviceIdToDelete = null;

function openDeleteModal(id) {
    deviceIdToDelete = id;
    document.getElementById("modalOverlay").classList.add("show");
    document.getElementById("deleteDeviceModal").classList.add("show");
}

document.querySelector(".confirm-btn-modal")?.addEventListener("click", async () => {
    if (!deviceIdToDelete) return;
    const token = localStorage.getItem("token");
    
    try {
        const response = await fetch(`http://localhost:8081/users/me/devices/${deviceIdToDelete}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            showToast('success', 'Dispositivo Removido', 'O dispositivo foi apagado com sucesso.');
            setTimeout(() => location.reload(), 1500);
        } else {
            showToast('error', 'Erro ao Eliminar', 'Não foi possível remover o dispositivo.');
        }
    } catch (error) {
        showToast('error', 'Erro Crítico', 'Falha ao processar a eliminação.');
    }
});