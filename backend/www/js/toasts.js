/**
 * toasts.js - Sistema de Notificações Global
 */

const Toast = {
    init() {
        // Cria os containers se não existirem
        if (!document.getElementById('toast-left')) {
            const leftContainer = document.createElement('div');
            leftContainer.id = 'toast-left';
            leftContainer.className = 'toast-container left';
            document.body.appendChild(leftContainer);
        }
        if (!document.getElementById('toast-right')) {
            const rightContainer = document.createElement('div');
            rightContainer.id = 'toast-right';
            rightContainer.className = 'toast-container right';
            document.body.appendChild(rightContainer);
        }
    },

    show(type, title, message) {
        this.init();
        
        const containerId = type === 'success' ? 'toast-left' : 'toast-right';
        const container = document.getElementById(containerId);
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? '✓' : '✕';
        
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <span class="toast-title">${title}</span>
                <span class="toast-desc">${message}</span>
            </div>
            <button class="toast-close">✖</button>
        `;

        container.appendChild(toast);

        // Evento para fechar no X
        toast.querySelector('.toast-close').onclick = () => this.hide(toast);

        // Auto-remover após 5 segundos
        setTimeout(() => this.hide(toast), 5000);
    },

    hide(toast) {
        toast.classList.add('hide');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }
};

// Tornar a função disponível globalmente
window.showToast = (type, title, message) => Toast.show(type, title, message);