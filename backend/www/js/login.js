// ===============================================================
// LOGIN
// ===============================================================

const API_BASE = "http://localhost:8081"; 
async function loginPage() {
    const email = document.getElementById("login_email").value.trim();
    const password = document.getElementById("login_pass").value;
    const errorDiv = document.getElementById("login_error");

    // Reset de mensagens
    if (errorDiv) {
        errorDiv.textContent = "";
        errorDiv.style.display = "none";
    }

    // 1. Validação simples
    if (!email || !password) {
        showError("Preencha todos os campos.");
        return;
    }

    try {
        // 2. Pedido ao Backend
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        // 3. Verificação de Erro (401 Unauthorized ou 400 Bad Request)
        if (!res.ok) {
            showError(data.message || "Email ou password incorretos.");
            return;
        }

        // 4. SUCESSO: Guardar Token e ID do utilizador
        // Guardamos o token para usar em pedidos futuros (Authorization: Bearer <token>)
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user.id);

        // Se o teu sessions.js tiver uma função de inicialização, podes chamá-la aqui

        // 5. Redirecionar
        window.location.href = "home.html";

    } catch (err) {
        console.error("Erro na ligação:", err);
        showError("Erro de ligação ao servidor.");
    }

    // Função interna para mostrar erros na UI
    function showError(msg) {
        if (errorDiv) {
            errorDiv.textContent = msg;
            errorDiv.style.display = "block";
        } else {
            alert(msg);
        }
    }
}