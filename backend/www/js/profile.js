/**
 * profile.js - Gestão de Perfil do Utilizador com Toasts
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Carregar dados atuais do utilizador ao abrir a página
    fetchUserProfile();

    // 2. Evento para o botão de Guardar (dentro do modal de Edição)
    const finalConfirmEdit = document.getElementById("finalConfirmEdit");
    if (finalConfirmEdit) {
        finalConfirmEdit.addEventListener("click", handleUpdateProfile);
    }

    // 3. Evento para o botão de Confirmar Eliminação (dentro do modal de Eliminar)
    const confirmDeleteBtn = document.querySelector(".confirm-btn-modal");
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", handleDeleteAccount);
    }
});

/**
 * Procura os dados do utilizador e preenche os campos do formulário
 */
async function fetchUserProfile() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch("http://localhost:8081/users/me", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Preenche os inputs do HTML com os dados vindos da BD
            document.getElementById("name").value = data.user.fullName || "";
            document.getElementById("email").value = data.user.email || "";
        } else {
            console.error("Erro ao carregar perfil:", data.message);
            showToast('error', 'Erro de Perfil', 'Não foi possível carregar os teus dados.');
        }
    } catch (error) {
        console.error("Erro de rede ao carregar perfil:", error);
        showToast('error', 'Erro de Rede', 'Sem ligação ao servidor para carregar o perfil.');
    }
}

/**
 * Envia os dados atualizados para o servidor após confirmação no modal
 */
async function handleUpdateProfile() {
    const token = localStorage.getItem("token");
    const fullName = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const passwordConfirmation = document.getElementById("password2").value;
    
    // Campo do modal de confirmação
    const currentPasswordInput = document.getElementById("confirmEditPassword");
    const currentPassword = currentPasswordInput.value;

    if (!currentPassword) {
        showToast('error', 'Confirmação Necessária', 'Introduz a tua password atual para autorizar as alterações.');
        return;
    }

    const payload = {
        fullName: fullName,
        email: email,
        currentPassword: currentPassword // Enviado sempre
    };

    // Se o utilizador preencheu o campo de nova password
    if (password) {
        if (password !== passwordConfirmation) {
            showToast('error', 'Erro de Validação', 'A nova password e a confirmação não coincidem.');
            return;
        }
        payload.password = password;
        payload.passwordConfirmation = passwordConfirmation;
    }

    try {
        const response = await fetch("http://localhost:8081/users/me", {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            showToast('success', 'Sucesso', 'Perfil atualizado com sucesso!');
            if (payload.fullName) localStorage.setItem("userName", payload.fullName);
            
            setTimeout(() => window.location.reload(), 1500);
        } else {
            // Caso a password atual esteja errada, o backend devolve 401
            showToast('error', 'Erro', data.message || 'Não foi possível guardar.');
            currentPasswordInput.value = ""; // Limpa para nova tentativa
        }
    } catch (error) {
        showToast('error', 'Erro de Rede', 'Servidor offline.');
    }
}

/**
 * Elimina a conta do utilizador após confirmação da password no modal de eliminação
 */
async function handleDeleteAccount() {
    const token = localStorage.getItem("token");
    const password = document.getElementById("deletePassword").value;

    if (!password) {
        showToast('error', 'Confirmação Necessária', 'Deves introduzir a password para eliminar a conta.');
        return;
    }

    try {
        const response = await fetch("http://localhost:8081/users/me", {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('success', 'Conta Eliminada', 'A tua conta foi removida. A redirecionar...');
            
            setTimeout(() => {
                localStorage.clear();
                window.location.href = "login.html";
            }, 2000);
        } else {
            showToast('error', 'Erro ao Eliminar', data.message || 'Palavra-passe incorreta.');
        }
    } catch (error) {
        console.error("Erro ao eliminar conta:", error);
        showToast('error', 'Erro de Servidor', 'Ocorreu um erro ao tentar eliminar a conta.');
    }
}