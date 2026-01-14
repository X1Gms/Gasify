/**
 * js/insertcode.js - Validação do código de recuperação com Toasts
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

        // Validação local simples (Toast à Direita)
        if (!code || code.length !== 6) {
            showToast('error', 'Código Inválido', 'O código deve conter exatamente 6 dígitos numéricos.');
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
                
                // Redireciona imediatamente para a definição da nova password
                window.location.href = "newpassword.html";
            } else {
                // ERRO: Código inválido ou expirado (Toast à Direita)
                showToast('error', 'Verificação Falhou', data.message || "Código inválido ou expirado.");
                btn.disabled = false;
                btn.textContent = "Autenticar";
            }
        } catch (error) {
            console.error("Erro ao verificar código:", error);
            showToast('error', 'Erro de Ligação', 'Não foi possível contactar o servidor.');
            btn.disabled = false;
            btn.textContent = "Autenticar";
        }
    };
});