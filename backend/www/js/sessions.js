/**
 * Função auxiliar para buscar dados de qualquer um dos storages
 * (localStorage para Remember Me ativo, sessionStorage para sessão temporária)
 */
function getAuthItem(key) {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
}

/**
 * Função auxiliar para guardar dados no storage correto detetado
 */
function setAuthItem(key, value) {
    if (localStorage.getItem("token") || localStorage.getItem("remembered") === "true") {
        localStorage.setItem(key, value);
    } else {
        sessionStorage.setItem(key, value);
    }
}

/**
 * Verifica se o utilizador tem sessão ativa
 */
function checkSession() {
    const token = getAuthItem("token");
    const path = window.location.pathname;
    const isAuthPage = path.includes("login.html") || 
                       path.includes("register.html") || 
                       path.includes("recoverpass.html") || 
                       path.includes("insertcode.html") || 
                       path.includes("newpassword.html");

    if (!token && !isAuthPage) {
        if (path !== "/" && !path.includes("index.html")) {
            window.location.href = "login.html";
        }
        return;
    }

    if (token && isAuthPage) {
        window.location.href = "home.html";
        return;
    }
}

/**
 * Função de Logout - Limpa ambos os storages
 */
function logout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "login.html";
}

/**
 * Injeta o nome imediatamente. 
 */
function fastInjectName() {
    const fastInterval = setInterval(() => {
        const cachedName = getAuthItem("userName");
        const nameSpan = document.getElementById("userName");

        if (nameSpan && cachedName) {
            nameSpan.textContent = cachedName;
            clearInterval(fastInterval);
        }
    }, 50);

    setTimeout(() => clearInterval(fastInterval), 5000);
}

/**
 * Carrega os dados da API e atualiza o Header
 */
async function loadUserData() {
    const token = getAuthItem("token");
    if (!token) return;

    try {
        const response = await fetch("http://localhost:8081/users/me", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (response.ok && data.success && data.user) {
            // Guarda o nome atualizado no storage correto (auto-detect)
            setAuthItem("userName", data.user.fullName);
            
            const nameSpan = document.getElementById("userName");
            if (nameSpan) {
                nameSpan.textContent = data.user.fullName;
            }
        }
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

// 1. Executa verificação de sessão antes de tudo
checkSession();

// 2. Inicia o monitoramento para injeção do nome
fastInjectName();

// 3. Dispara a atualização dos dados assim que a estrutura base carrega
document.addEventListener("DOMContentLoaded", loadUserData);