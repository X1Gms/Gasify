/**
 * login.js - Lógica de Autenticação com Toasts e Remember Me
 */

const API_BASE = "http://localhost:8081"; 

async function loginPage() {
    const email = document.getElementById("login_email").value.trim();
    const password = document.getElementById("login_pass").value;
    const rememberMe = document.getElementById("rememberMe").checked; // Captura o estado da checkbox

    // 1. Validação simples
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

        // 3. Verificação de Erro
        if (!res.ok) {
            showToast('error', 'Falha no Login', data.message || 'Email ou password incorretos.');
            return;
        }

        // 4. SUCESSO: Gestão de Sessão (Remember Me)
        // Se Remember Me estiver ativo, usamos localStorage (permanente)
        // Se não, usamos sessionStorage (apaga ao fechar a aba/navegador)
        const storage = rememberMe ? localStorage : sessionStorage;

        // Limpar possíveis dados antigos de ambos para evitar conflitos
        localStorage.clear();
        sessionStorage.clear();

        storage.setItem("token", data.token);
        storage.setItem("userId", data.user.id);
        storage.setItem("userName", data.user.fullName);
        // Guardamos também se o utilizador queria ser lembrado para o sessions.js saber onde procurar
        storage.setItem("remembered", rememberMe);

        // 5. Toast de Sucesso
        showToast('success', 'Bem-vindo!', `Login efetuado com sucesso. A entrar no sistema...`);

        // 6. Redirecionar
        setTimeout(() => {
            window.location.href = "home.html";
        }, 1500);

    } catch (err) {
        console.error("Erro na ligação:", err);
        showToast('error', 'Erro de Servidor', 'Não foi possível ligar ao servidor. Tente mais tarde.');
    }
}