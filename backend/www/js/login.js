/**
 * login.js - Lógica de Autenticação com Toasts
 */

const API_BASE = "http://localhost:8081"; 

async function loginPage() {
    const email = document.getElementById("login_email").value.trim();
    const password = document.getElementById("login_pass").value;

    // 1. Validação simples (Toast de Erro à Direita)
    if (!email || !password) {
        showToast('error', 'Campos em Falta', 'Por favor, introduza o seu email e palavra-passe.');
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

        // 3. Verificação de Erro (Canto Direito)
        if (!res.ok) {
            showToast('error', 'Falha no Login', data.message || 'Email ou password incorretos.');
            return;
        }

        // 4. SUCESSO: Guardar Token e dados do utilizador
        // Importante: Guardamos o fullName para o sessions.js injetar o nome no header sem delay
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("userName", data.user.fullName);

        // 5. Toast de Sucesso (Canto Esquerdo)
        showToast('success', 'Bem-vindo!', `Login efetuado com sucesso. A entrar no sistema...`);

        // 6. Redirecionar após o utilizador ver a mensagem
        setTimeout(() => {
            window.location.href = "home.html";
        }, 1500);

    } catch (err) {
        console.error("Erro na ligação:", err);
        showToast('error', 'Erro de Servidor', 'Não foi possível ligar ao servidor. Tente mais tarde.');
    }
}