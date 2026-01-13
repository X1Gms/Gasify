/**
 * Gestão Completa de Dispositivos (Listagem, Criação, Eliminação)
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Carregar lista inicial
    fetchManagementDevices();

    // 2. Configurar Submissão de Novo Dispositivo
    const addSubmitBtn = document.querySelector("#addDeviceModal .primary-modal-btn");
    if (addSubmitBtn) {
        addSubmitBtn.addEventListener("click", handleAddDevice);
    }
});

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
        console.error("Erro ao carregar dispositivos:", error);
    }
}

/**
 * Desenha os cartões na lista
 */
function renderManagementCards(devices) {
    const listContainer = document.querySelector(".device-list");
    listContainer.innerHTML = ""; // Limpa os estáticos

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
            
            ${device.has_active_alert 
                ? `<button class="cancel-btn" onclick="cancelAlarm(${device.id})">Cancelar Alarme</button>`
                : `<button class="dots-btn">⋮</button>`
            }

            <div class="device-menu" style="display: none;">
                <p class="opt" onclick="openEditModal(${JSON.stringify(device).replace(/"/g, '&quot;')})">Editar</p>
                <p class="opt delete" onclick="openDeleteModal(${device.id})">Eliminar</p>
            </div>
        `;

        listContainer.appendChild(card);
    });
}

/**
 * Lógica para Adicionar Dispositivo
 */
async function handleAddDevice() {
    const token = localStorage.getItem("token");
    const modal = document.getElementById("addDeviceModal");
    
    const payload = {
        name: modal.querySelector('input[placeholder="Nome do Dispositivo"]').value,
        serialNumber: modal.querySelector('input[placeholder="Código de ID"]').value,
        countryId: parseInt(modal.querySelector('select').value),
        address: modal.querySelector('input[placeholder="Morada"]').value,
        postalCode: modal.querySelector('input[placeholder="Código Postal"]').value
    };

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
            location.reload();
        } else {
            const err = await response.json();
            alert("Erro: " + err.message);
        }
    } catch (error) {
        console.error("Erro ao criar:", error);
    }
}

// Funções de auxílio para os Modais
let deviceIdToDelete = null;

function openDeleteModal(id) {
    deviceIdToDelete = id;
    // O teu script de UI já deve ter a lógica de mostrar o modalOverlay
    document.getElementById("modalOverlay").classList.add("show");
    document.getElementById("deleteDeviceModal").classList.add("show");
}

// Adiciona o evento ao botão de confirmar eliminar
document.querySelector(".confirm-btn-modal")?.addEventListener("click", async () => {
    if (!deviceIdToDelete) return;
    const token = localStorage.getItem("token");
    
    try {
        const response = await fetch(`http://localhost:8081/users/me/devices/${deviceIdToDelete}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) location.reload();
    } catch (error) {
        console.error("Erro ao eliminar:", error);
    }
});