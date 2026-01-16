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

    // ⚠️ Se não existir, não faz nada (evita erros)
    if (!notifBtn || !notifSidebar) return;

    notifBtn.onclick = (e) => {
        e.stopPropagation();
        notifSidebar.classList.add("open");
    };

    notifClose.onclick = () => {
        notifSidebar.classList.remove("open");
    };

    document.addEventListener("click", (e) => {
        if (!notifSidebar.contains(e.target) && e.target !== notifBtn) {
            notifSidebar.classList.remove("open");
        }
    });

    // Expandir detalhes
    document.querySelectorAll(".notif-expand").forEach(btn => {
        btn.onclick = () => {
            const extra = btn.parentElement.querySelector(".notif-extra");
            const isOpen = extra.style.display === "block";

            extra.style.display = isOpen ? "none" : "block";
            btn.textContent = isOpen ? "▼" : "▲";
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



