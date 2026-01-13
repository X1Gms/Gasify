/**
 * js/newpassword.js - Definição da nova palavra-passe
 */

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("resetButton");
    
    // Recuperamos os dados guardados nos passos anteriores
    const email = sessionStorage.getItem("recovery_email");
    const code = sessionStorage.getItem("recovery_code");

    // Se faltarem dados, redireciona para o início do processo por segurança
    if (!email || !code) {
        window.location.href = "recoverpass.html";
        return;
    }

    btn.onclick = async () => {
        const password = document.getElementById("new_pass").value;
        const passwordConfirmation = document.getElementById("new_pass2").value;
        const err = document.getElementById("reset_error");
        const ok = document.getElementById("reset_success");

        // Reset de mensagens
        err.textContent = "";
        ok.textContent = "";
        err.style.display = "none";
        ok.style.display = "none";

        // Validações locais básicas
        if (!password || !passwordConfirmation) {
            showError("Preencha ambos os campos.");
            return;
        }

        if (password !== passwordConfirmation) {
            showError("As passwords não coincidem.");
            return;
        }

        if (password.length < 8) {
            showError("A password deve ter pelo menos 8 caracteres.");
            return;
        }

        try {
            btn.disabled = true;
            btn.textContent = "A processar...";

            const response = await fetch("http://localhost:8081/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    email, 
                    code, 
                    password, 
                    passwordConfirmation 
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Sucesso absoluto
                ok.textContent = "Palavra-passe atualizada com sucesso!";
                ok.style.display = "block";
                
                // Limpar a sessão
                sessionStorage.removeItem("recovery_email");
                sessionStorage.removeItem("recovery_code");

                // Redirecionar para o login após 2 segundos
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2000);
            } else {
                // Erro do servidor (ex: password fraca ou erro no código)
                showError(data.message || "Erro ao atualizar a password.");
                btn.disabled = false;
                btn.textContent = "Confirmar";
            }
        } catch (error) {
            console.error("Erro no reset:", error);
            showError("Erro de ligação ao servidor.");
            btn.disabled = false;
            btn.textContent = "Confirmar";
        }
    };

    function showError(msg) {
        const errDiv = document.getElementById("reset_error");
        errDiv.textContent = msg;
        errDiv.style.display = "block";
    }
});