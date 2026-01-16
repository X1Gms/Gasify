/**
 * js/recoverpass.js - Lógica de Recuperação de Palavra-Passe com Toasts
 */

document.addEventListener("DOMContentLoaded", () => {
    const recoverBtn = document.getElementById("recoverButton");
    
    if (recoverBtn) {
        recoverBtn.onclick = handleRecoverPassword;
    }
});

async function handleRecoverPassword() {
    const emailInput = document.getElementById("recover_email");
    const email = emailInput.value.trim();
    const btn = document.getElementById("recoverButton");

    // 1. Validação simples (Toast de Erro à Direita)
    if (!email) {
        showToast('error', 'Campo Vazio', 'Por favor, insira o seu e-mail para continuar.');
        return;
    }

    try {
        // Bloquear o botão para evitar múltiplos cliques
        btn.disabled = true;
        btn.textContent = "A enviar...";

        const response = await fetch("http://localhost:8081/auth/forgot-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            // Sucesso (Toast à Esquerda)
            showToast('success', 'E-mail Enviado', 'Se a conta existir, enviámos um código para o seu e-mail.');
            
            // Guardar o email em sessionStorage para usar na página de validação do código
            sessionStorage.setItem("recovery_email", email);
            
            // Redirecionar para a página de inserção de código após o utilizador ver o toast
            setTimeout(() => {
                window.location.href = "insertcode.html"; 
            }, 2500);

        } else {
            // Erro do servidor (Canto Direito)
            showToast('error', 'Erro no Pedido', data.message || "Não foi possível processar o pedido.");
            btn.disabled = false;
            btn.textContent = "Enviar";
        }
    } catch (error) {
        console.error("Erro na recuperação:", error);
        showToast('error', 'Erro de Ligação', 'Ocorreu um problema ao ligar ao servidor.');
        btn.disabled = false;
        btn.textContent = "Enviar";
    }
}