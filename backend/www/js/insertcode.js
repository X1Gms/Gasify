/**
 * js/insertcode.js - Validação do código de recuperação
 */

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("codeButton");
    const email = sessionStorage.getItem("recovery_email");

    // Se não houver email na sessão, volta para o início da recuperação
    if (!email) {
        window.location.href = "recoverpass.html";
        return;
    }

    btn.onclick = async () => {
        const code = document.getElementById("recover_code").value.trim();
        const err = document.getElementById("code_error");

        // Reset de erros
        err.textContent = "";
        err.style.display = "none";

        // Validação local simples
        if (!code || code.length !== 6 || !/^[0-9]+$/.test(code)) {
            err.textContent = "O código deve ter 6 dígitos.";
            err.style.display = "block";
            return;
        }

        try {
            btn.disabled = true;
            btn.textContent = "A verificar...";

            const response = await fetch("http://localhost:8081/auth/verify-password-reset-code", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, code })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // SUCESSO: Código válido!
                // Guardamos o código na sessão para a página de nova password o poder usar
                sessionStorage.setItem("recovery_code", code);
                window.location.href = "newpassword.html";
            } else {
                // ERRO: Código inválido ou expirado
                err.textContent = data.message || "Código inválido ou expirado.";
                err.style.display = "block";
                btn.disabled = false;
                btn.textContent = "Autenticar";
            }
        } catch (error) {
            console.error("Erro ao verificar código:", error);
            err.textContent = "Erro de ligação ao servidor.";
            err.style.display = "block";
            btn.disabled = false;
            btn.textContent = "Autenticar";
        }
    };
});