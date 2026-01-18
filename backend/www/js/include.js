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
    };

    // Fechar Sidebar
    notifClose.onclick = () => {
        notifSidebar.classList.remove("open");
    };

    // Clique fora fecha a sidebar
    document.addEventListener("click", (e) => {
        if (!notifSidebar.contains(e.target) && e.target !== notifBtn) {
            notifSidebar.classList.remove("open");
        }
    });

    // Lógica de Expandir/Recolher Notificação
    const expandBtns = document.querySelectorAll(".notif-expand");
    
    expandBtns.forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation(); // Impede fechar a sidebar ao clicar no botão
            
            const item = btn.closest(".notif-item");
            const extra = item.querySelector(".notif-extra");
            const isOpen = extra.style.display === "block";

            // Fecha outros abertos (opcional, se quiseres apenas um aberto)
            // document.querySelectorAll(".notif-extra").forEach(el => el.style.display = "none");

            extra.style.display = isOpen ? "none" : "block";
            btn.textContent = isOpen ? "▼" : "▲";
            
            // Rotação visual opcional da seta
            btn.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg)";
        };
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

        // aplicar tema
        root.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);

        // atualizar imagem auth
        if (authImg) {
            authImg.src = newTheme === "dark"
                ? "img/authimage2.png"
                : "img/authimage.png";
        }
    };
}



