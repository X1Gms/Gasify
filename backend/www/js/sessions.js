/**
 * Verifica se o utilizador tem sessão ativa
 */
function checkSession() {
    const token = localStorage.getItem("token");
    const path = window.location.pathname;
    const isAuthPage = path.includes("login.html") || path.includes("register.html") || path.includes("recoverpass.html") || path.includes("insertcode.html") || path.includes("newpassword.html");

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
 * Injeta o nome imediatamente. 
 * Ajustado para esperar tanto pelo HTML quanto pelo dado no localStorage.
 */
function fastInjectName() {
    // Tenta injetar a cada 50ms para ser mais eficiente
    const fastInterval = setInterval(() => {
        const cachedName = localStorage.getItem("userName");
        const nameSpan = document.getElementById("userName");

        // Se encontrou o elemento no HTML e já existe o nome no cache
        if (nameSpan && cachedName) {
            nameSpan.textContent = cachedName;
            clearInterval(fastInterval); // Para o loop pois teve sucesso
        }
    }, 50);

    // Para de tentar após 5 segundos para não consumir recursos
    setTimeout(() => clearInterval(fastInterval), 5000);
}

/**
 * Carrega os dados da API e atualiza o Header imediatamente
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
            // Guarda o nome atualizado no cache
            localStorage.setItem("userName", data.user.fullName);
            
            // Injeta logo sem esperar pelo próximo ciclo do intervalo
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

// 2. Inicia o monitoramento para injeção do nome (vai esperar pelo fetch e pelo HTML)
fastInjectName();

// 3. Dispara a atualização dos dados assim que a estrutura base carrega
document.addEventListener("DOMContentLoaded", loadUserData);