/**
 * Lógica de Recuperação de Palavra-Passe
 */

document.addEventListener("DOMContentLoaded", () => {
    const recoverBtn = document.getElementById("recoverButton");
    
    if (recoverBtn) {
        recoverBtn.onclick = handleRecoverPassword;
    }
});

async function handleRecoverPassword() {
    const emailInput = document.getElementById("recover_email");
    const errorDiv = document.getElementById("recover_error");
    const email = emailInput.value.trim();

    // Reset de mensagens
    errorDiv.textContent = "";
    errorDiv.style.display = "none";
    errorDiv.style.color = "red";

    if (!email) {
        showError("Por favor, insira o seu e-mail.");
        return;
    }

    try {
        // Bloquear o botão para evitar múltiplos cliques
        const btn = document.getElementById("recoverButton");
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
            // Sucesso (Mensagem Neutra conforme o teu Handler)
            alert("Se a conta existir, um código foi enviado para o seu e-mail.");
            
            // Opcional: Guardar o email em sessionStorage para usar na próxima página
            sessionStorage.setItem("recovery_email", email);
            
            // Redirecionar para a página de inserção de código
            window.location.href = "insertcode.html"; 
        } else {
            showError(data.message || "Erro ao processar o pedido.");
            btn.disabled = false;
            btn.textContent = "Enviar";
        }
    } catch (error) {
        console.error("Erro na recuperação:", error);
        showError("Erro de ligação ao servidor.");
        document.getElementById("recoverButton").disabled = false;
    }
}

function showError(msg) {
    const err = document.getElementById("recover_error");
    err.textContent = msg;
    err.style.display = "block";
}