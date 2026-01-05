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

    const errDiv = document.getElementById("reg_error");
    const okDiv = document.getElementById("reg_success");

    // reset mensagens
    errDiv.textContent = "";
    okDiv.textContent = "";
    errDiv.style.display = "none";
    okDiv.style.display = "none";

    // ======================
    // VALIDAÇÕES FRONTEND
    // ======================
    if (!fullName || !email || !password || !passwordConfirmation) {
        showError("Preencha todos os campos.");
        return;
    }

    if (fullName.length < 3) {
        showError("O nome deve ter pelo menos 3 caracteres.");
        return;
    }

    if (!emailRegex.test(email)) {
        showError("O email introduzido não é válido.");
        return;
    }

    if (password !== passwordConfirmation) {
        showError("As passwords não coincidem.");
        return;
    }

    if (
        !passwordRules.length.test(password) ||
        !passwordRules.upper.test(password) ||
        !passwordRules.lower.test(password) ||
        !passwordRules.number.test(password) ||
        !passwordRules.special.test(password)
    ) {
        showError(
            "A password deve ter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula, um número e um símbolo."
        );
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

        // ERRO
        if (!res.ok) {
            showError(data.message || "Erro ao criar conta.");
            return;
        }

        // SUCESSO (201 ou 200)
        okDiv.textContent = data.message || "Conta criada com sucesso!";
        okDiv.style.display = "block";

        // redirecionar para login
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1200);

    } catch (err) {
        console.error(err);
        showError("Erro de ligação ao servidor.");
    }

    function showError(msg) {
        errDiv.textContent = msg;
        errDiv.style.display = "block";
    }
}