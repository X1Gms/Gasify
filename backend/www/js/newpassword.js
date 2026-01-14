/**
 * js/newpassword.js - Definição da nova palavra-passe com Toasts
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

        // Validações locais básicas (Toasts à Direita)
        if (!password || !passwordConfirmation) {
            showToast('error', 'Campos Vazios', 'Por favor, preencha ambos os campos de password.');
            return;
        }

        if (password !== passwordConfirmation) {
            showToast('error', 'Erro de Confirmação', 'As palavras-passe introduzidas não coincidem.');
            return;
        }

        if (password.length < 8) {
            showToast('error', 'Password Fraca', 'A nova palavra-passe deve ter pelo menos 8 caracteres.');
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
                // Sucesso absoluto (Toast à Esquerda)
                showToast('success', 'Password Alterada', 'A sua palavra-passe foi atualizada! A redirecionar para o login...');
                
                // Limpar a sessão de recuperação
                sessionStorage.removeItem("recovery_email");
                sessionStorage.removeItem("recovery_code");

                // Redirecionar para o login após 2.5 segundos
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2500);
            } else {
                // Erro do servidor (Canto Direito)
                showToast('error', 'Falha no Reset', data.message || 'Não foi possível atualizar a password.');
                btn.disabled = false;
                btn.textContent = "Confirmar";
            }
        } catch (error) {
            console.error("Erro no reset:", error);
            showToast('error', 'Erro de Conexão', 'Não foi possível ligar ao servidor.');
            btn.disabled = false;
            btn.textContent = "Confirmar";
        }
    };
});