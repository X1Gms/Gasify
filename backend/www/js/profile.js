/**
 * profile.js - Gestão de Perfil do Utilizador
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Carregar dados atuais do utilizador
    fetchUserProfile();

    // 2. Evento para o botão de Editar
    const editBtn = document.querySelector(".edit-btn");
    if (editBtn) {
        editBtn.addEventListener("click", handleUpdateProfile);
    }

    // 3. Evento para o botão de Confirmar Eliminação (dentro do modal)
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
            // Preenche os inputs do HTML
            document.getElementById("name").value = data.user.fullName;
            document.getElementById("email").value = data.user.email;
        } else {
            console.error("Erro ao carregar perfil:", data.message);
        }
    } catch (error) {
        console.error("Erro de rede:", error);
    }
}

/**
 * Envia os dados atualizados para o servidor
 */
async function handleUpdateProfile() {
    const token = localStorage.getItem("token");
    const fullName = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const passwordConfirmation = document.getElementById("password2").value;

    // Criar o payload apenas com o que foi preenchido
    const payload = {};
    if (fullName) payload.fullName = fullName;
    if (email) payload.email = email;
    
    // Só envia password se o utilizador escreveu algo
    if (password) {
        if (password !== passwordConfirmation) {
            alert("As palavras-passe não coincidem!");
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
            alert("Perfil atualizado com sucesso!");
            // Limpa os campos de password por segurança
            document.getElementById("password").value = "";
            document.getElementById("password2").value = "";
        } else {
            alert("Erro: " + data.message);
        }
    } catch (error) {
        console.error("Erro ao atualizar:", error);
        alert("Erro ao ligar ao servidor.");
    }
}

/**
 * Elimina a conta do utilizador após confirmação da password
 */
async function handleDeleteAccount() {
    const token = localStorage.getItem("token");
    const password = document.getElementById("deletePassword").value;

    if (!password) {
        alert("Por favor, introduza a sua palavra-passe para confirmar.");
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
            alert("Conta eliminada com sucesso. Até breve!");
            // Limpa o token e redireciona para o /login
            localStorage.removeItem("token");
            window.location.href = "login.html";
        } else {
            alert("Erro: " + data.message);
        }
    } catch (error) {
        console.error("Erro ao eliminar conta:", error);
    }
}