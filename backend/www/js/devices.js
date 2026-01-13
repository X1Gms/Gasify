/**
 * Gestão Completa de Dispositivos (Listagem, Criação, Eliminação)
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
        console.error("Erro ao carregar países:", error);
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
        console.error("Erro ao carregar dispositivos:", error);
    }
}


/**
 * Desenha os cartões na lista tornando quase todo o card clicável
 */
function renderManagementCards(devices) {
    const listContainer = document.querySelector(".device-list");
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

        // CLIQUE NO CARD TODO (Navegação)
        card.onclick = () => {
            window.location.href = `device.html?id=${device.id}`;
        };

        listContainer.appendChild(card);
    });
}

/**
 * Função para abrir o menu sem navegar para a página do dispositivo
 */
function toggleDeviceMenu(event, btn) {
    event.stopPropagation();
    
    const card = btn.closest(".device-card");
    const menu = btn.nextElementSibling;
    const isVisible = menu.style.display === "block";

    // 1. Esconde todos os menus e retira o topo de todos os cards
    document.querySelectorAll(".device-menu").forEach(m => m.style.display = "none");
    document.querySelectorAll(".device-card").forEach(c => c.classList.remove("active"));
    
    // 2. Se o menu ia abrir, mostra-o e coloca este card no topo absoluto
    if (!isVisible) {
        menu.style.display = "block";
        card.classList.add("active"); 
    }
}

// Fechar menu ao clicar fora
document.addEventListener("click", () => {
    document.querySelectorAll(".device-menu").forEach(m => m.style.display = "none");
    document.querySelectorAll(".device-card").forEach(c => c.classList.remove("active"));
});

/**
 * Impede navegação ao clicar no cancelar alarme
 */
function handleCancelClick(event) {
    event.stopPropagation();
    // Aqui podes abrir o modal de cancelamento que já tens no HTML
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
        name: modal.querySelector('input[placeholder="Nome do Dispositivo"]').value,
        serialNumber: modal.querySelector('input[placeholder="Código de ID"]').value,
        countryId: parseInt(modal.querySelector('select').value),
        address: modal.querySelector('input[placeholder="Morada"]').value,
        postalCode: modal.querySelector('input[placeholder="Código Postal"]').value,
        seedReadings: false // Forçado a false em gestão
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
            alert("Erro: " + (err.message || err.error));
        }
    } catch (error) {
        console.error("Erro ao criar:", error);
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
        name: modal.querySelector('input[placeholder="Nome do Dispositivo"]').value,
        countryId: parseInt(modal.querySelector('select').value),
        address: modal.querySelector('input[placeholder="Morada"]').value,
        postalCode: modal.querySelector('input[placeholder="Código Postal"]').value
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

        if (response.ok) location.reload();
    } catch (error) {
        console.error("Erro ao editar:", error);
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

        if (response.ok) location.reload();
    } catch (error) {
        console.error("Erro ao eliminar:", error);
    }
});