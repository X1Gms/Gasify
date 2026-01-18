// ===============================================================
// GET HEADER
// ===============================================================

document.addEventListener("DOMContentLoaded", () => {
    const includeTarget = document.querySelector("[data-include-header]");

    if (includeTarget) {
        fetch("components/header.html")
            .then(res => res.text())
            .then(html => {
                includeTarget.innerHTML = html;

                // ⚠️ Só depois do HTML ser inserido é que carregamos os eventos
                setupHeaderEvents();
                setupNotifications();
                setupThemeToggle();
            });
    }
});

function setupHeaderEvents() {
    const menuBtn = document.getElementById("menuBtn");
    const sidebar = document.getElementById("sidebar");

    if (!menuBtn || !sidebar) return;

    menuBtn.onclick = (e) => {
        e.stopPropagation();
        sidebar.classList.toggle("open");
    };

    document.addEventListener("click", (e) => {
        const inside = sidebar.contains(e.target) || menuBtn.contains(e.target);
        if (!inside) sidebar.classList.remove("open");
    });
}

function setupNotifications() {
    const notifBtn = document.getElementById("inboxBtn");
    const notifSidebar = document.getElementById("notifSidebar");
    const notifClose = document.getElementById("notifClose");

    if (!notifBtn || !notifSidebar) return;

    // Abrir Sidebar
    notifBtn.onclick = (e) => {
        e.stopPropagation();
        notifSidebar.classList.add("open");
        fetchNotifications(); // Refresh ao abrir
    };

    // Fechar Sidebar
    if (notifClose) {
        notifClose.onclick = () => {
            notifSidebar.classList.remove("open");
        };
    }

    // Clique fora fecha a sidebar
    document.addEventListener("click", (e) => {
        if (!notifSidebar.contains(e.target) && e.target !== notifBtn) {
            notifSidebar.classList.remove("open");
        }
    });
}

// ===============================================================
// THEME CODE   
// ===============================================================
function setupThemeToggle() {
    const toggleBtn = document.getElementById("themeToggle");
    if (!toggleBtn) return;

    const root = document.documentElement;
    const authImg = document.getElementById("auth-img");

    toggleBtn.onclick = () => {
        const isDark = root.getAttribute("data-theme") === "dark";
        const newTheme = isDark ? "light" : "dark";

        root.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);

        if (authImg) {
            authImg.src = newTheme === "dark"
                ? "img/authimage2.png"
                : "img/authimage.png";
        }
    };
}

// ===============================================================
// LÓGICA DE NOTIFICAÇÕES 
// ===============================================================

const convCO = (v) => (v * 106.0) / 4095.0;
const convGas = (v) => (v * 6363.0) / 4095.0;

async function fetchNotifications() {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch("http://localhost:8081/users/me/notifications", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            renderNotifications(data.notifications);
            updateNotificationBadge(data.unread_count);
        }
    } catch (error) {
        console.error("Erro ao carregar notificações:", error);
    }
}

function renderNotifications(notifications) {
    const listContainer = document.querySelector(".notif-list");
    if (!listContainer) return;

    if (notifications.length === 0) {
        listContainer.innerHTML = '<p class="muted" style="text-align:center; padding:20px;">Sem alertas registados.</p>';
        return;
    }

    listContainer.innerHTML = ""; 

    notifications.forEach(n => {
        const date = new Date(n.created_at).toLocaleString('pt-PT', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const coPpm = convCO(n.reading.co);
        const gasPpm = convGas(n.reading.gas);
        const coStatus = coPpm <= 34 ? "Baixa" : (coPpm <= 69 ? "Média" : "Elevada");
        const gasStatus = gasPpm <= 2100 ? "Baixo" : (gasPpm <= 4199 ? "Médio" : "Elevado");
        const isRead = n.read_at !== null;

        const notifItem = document.createElement("div");
        notifItem.className = `notif-item ${isRead ? '' : 'unread'}`;
        notifItem.dataset.id = n.id;
        notifItem.dataset.isRead = isRead; // Guarda estado local

        notifItem.innerHTML = `
            <div class="notif-icon">
                <svg viewBox="0 0 30 24"><path d="M3 24C2.175 24 1.46875 23.7063 0.88125 23.1188C0.29375 22.5312 0 21.825 0 21V3C0 2.175 0.29375 1.46875 0.88125 0.88125C1.46875 0.29375 2.175 0 3 0H27C27.825 0 28.5312 0.29375 29.1188 0.88125C29.7063 1.46875 30 2.175 30 3V21C30 21.825 29.7063 22.5312 29.1188 23.1188C28.5312 23.7063 27.825 24 27 24H3ZM15 13.5L3 6V21H27V6L15 13.5ZM15 10.5L27 3H3L15 10.5Z" /></svg>
            </div>
            <div class="notif-info">
            <div class="notif-title">
                <strong>Alarme Acionado</strong>
                <span class="notif-date">${date}</span>
                </div>
                <div class="notif-devices">
                    <div>
                        <p class="device-name">${n.device.name}</p>
                        <p class="muted">Dispositivo</p>
                    </div>
                    <div class="text-right">
                        <p class="device-name">${n.device.serial_number}</p>
                        <p class="muted">Série</p>
                    </div>
                </div>
                <div class="notif-extra" style="display: none;">
                    <div class="extra-grid">
                        <div>
                            <p class="device-name ${coStatus === 'Elevada' ? 'danger-text' : ''}">${coStatus}</p>
                            <p class="muted">Monóxido de Carbono</p>
                        </div>
                        <div class="text-right">
                            <p class="device-name ${gasStatus === 'Elevado' ? 'danger-text' : ''}">${gasStatus}</p>
                            <p class="muted">Gás</p>
                        </div>
                    </div>
                    <div class="extra-footer">
                        <p class="device-name">${n.detection.canceled ? 'Resolvido' : 'Ativo'}</p>
                        <p class="muted">Estado do Alarme</p>
                    </div>
                </div>
            </div>
            <button class="notif-expand">▼</button>
        `;

        const expandBtn = notifItem.querySelector(".notif-expand");
        expandBtn.onclick = (e) => {
            e.stopPropagation();
            toggleNotifExtra(notifItem, n.id, notifItem.dataset.isRead === "true");
        };

        listContainer.appendChild(notifItem);
    });
}

async function toggleNotifExtra(element, notifId, alreadyRead) {
    const extra = element.querySelector(".notif-extra");
    const btn = element.querySelector(".notif-expand");
    const isOpening = extra.style.display === "none";

    extra.style.display = isOpening ? "block" : "none";
    btn.style.transform = isOpening ? "rotate(180deg)" : "rotate(0deg)";

    if (isOpening && !alreadyRead) {
        markAsRead(notifId, element);
    }
}

async function markAsRead(id, element) {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    try {
        const response = await fetch(`http://localhost:8081/users/me/notifications/${id}`, {
            method: "PATCH",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
            element.classList.remove("unread");
            element.dataset.isRead = "true"; // Atualiza estado local para não repetir PATCH
        }
    } catch (e) { console.error(e); }
}

function updateNotificationBadge(count) {
    if (count > 0) {
        console.log(`Tens ${count} notificações não lidas`);
    }
}