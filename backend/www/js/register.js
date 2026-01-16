/**
 * register.js - Lógica de Registo de Utilizadores com Toasts
 */

const API_BASE = "http://localhost:8081";

// Regex iguais ao backend
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const passwordRules = {
    length: /^.{8,}$/,
    upper: /[A-Z]/,
    lower: /[a-z]/,
    number: /[0-9]/,
    special: /[^A-Za-z0-9]/
};

async function registerPage() {
    const fullName = document.getElementById("reg_name").value.trim();
    const email = document.getElementById("reg_email").value.trim();
    const password = document.getElementById("reg_pass").value;
    const passwordConfirmation = document.getElementById("reg_pass2").value;

    // ======================
    // VALIDAÇÕES FRONTEND (Toasts à Direita)
    // ======================
    if (!fullName || !email || !password || !passwordConfirmation) {
        showToast('error', 'Campos Vazios', 'Por favor, preencha todos os campos do formulário.');
        return;
    }

    if (fullName.length < 3) {
        showToast('error', 'Nome Inválido', 'O nome deve ter pelo menos 3 caracteres.');
        return;
    }

    if (!emailRegex.test(email)) {
        showToast('error', 'Email Inválido', 'O formato do email introduzido não é válido.');
        return;
    }

    if (password !== passwordConfirmation) {
        showToast('error', 'Passwords Diferentes', 'As passwords introduzidas não coincidem.');
        return;
    }

    if (
        !passwordRules.length.test(password) ||
        !passwordRules.upper.test(password) ||
        !passwordRules.lower.test(password) ||
        !passwordRules.number.test(password) ||
        !passwordRules.special.test(password)
    ) {
        showToast('error', 'Password Fraca', 'A password deve ter 8+ caracteres, maiúscula, minúscula, número e símbolo.');
        return;
    }

    // ======================
    // FETCH → /auth/register
    // ======================
    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName,
                email,
                password,
                passwordConfirmation
            })
        });

        const data = await res.json();

        // ERRO NO BACKEND (Canto Direito)
        if (!res.ok) {
            showToast('error', 'Erro no Registo', data.message || 'Não foi possível criar a conta.');
            return;
        }

        // SUCESSO (Canto Esquerdo)
        showToast('success', 'Conta Criada', 'Registo efetuado com sucesso! A redirecionar para o login...');

        // Redirecionar após o utilizador ver o toast
        setTimeout(() => {
            window.location.href = "login.html";
        }, 2500);

    } catch (err) {
        console.error(err);
        showToast('error', 'Erro de Ligação', 'Não foi possível estabelecer ligação com o servidor.');
    }
}