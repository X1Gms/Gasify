/**
 * Verifica se o utilizador tem sessão ativa
 */
function checkSession() {
    const token = localStorage.getItem("token");
    const path = window.location.pathname;
    const isAuthPage = path.includes("login.html") || path.includes("register.html");

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
 * Função de Logout
 */
function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}

/**
 * Insere o nome no HTML (com insistência)
 */
/**
 * Injeta o nome imediatamente para evitar o "User"
 */
function fastInjectName() {
    const cachedName = localStorage.getItem("userName");
    if (!cachedName) return;

    // Função que tenta encontrar o span e injetar o nome
    const tryInject = () => {
        const nameSpan = document.getElementById("userName");
        if (nameSpan) {
            nameSpan.textContent = cachedName;
            return true;
        }
        return false;
    };

    // 1. Tenta injetar logo
    if (!tryInject()) {
        // 2. Se não conseguiu, tenta a cada 10ms (super rápido) até o HTML aparecer
        const fastInterval = setInterval(() => {
            if (tryInject()) clearInterval(fastInterval);
        }, 10);

        // Para não ficar a correr infinitamente se o elemento não existir
        setTimeout(() => clearInterval(fastInterval), 2000);
    }
}

/**
 * Carrega os dados da API
 */
async function loadUserData() {
    const token = localStorage.getItem("token");
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
            localStorage.setItem("userName", data.user.fullName);
            injectNameToHeader(); // Tenta injetar o nome novo
        }
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

// 1. Executa verificação de sessão
checkSession();

// 2. Tenta injetar o nome que já temos guardado mal o script corre
fastInjectName();

// 3. Vai buscar dados frescos e tenta injetar de novo
document.addEventListener("DOMContentLoaded", loadUserData);