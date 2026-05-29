const ToastService = {
    container: null,

    init() {
        if (document.getElementById('toast-container')) return;
        
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-5 right-5 z-[100] flex flex-col gap-3';
        document.body.appendChild(container);
        this.container = container;
    },

    show(message, type = 'info', duration = 4000) {
        if (!this.container) {
            this.init();
        }

        const toast = document.createElement('div');
        
        const icons = {
            success: 'check-circle',
            danger: 'alert-circle',
            warning: 'alert-triangle',
            info: 'info'
        };

        const colors = {
            success: 'bg-success text-white',
            danger: 'bg-danger text-white',
            warning: 'bg-warning text-white',
            info: 'bg-primary text-white'
        };

        toast.className = `toast flex items-center p-4 min-w-[300px] max-w-xs rounded-lg shadow-lg ${colors[type] || colors['info']}`;
        
        toast.innerHTML = `
            <div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8">
                <i data-lucide="${icons[type] || icons['info']}" class="w-6 h-6"></i>
            </div>
            <div class="ml-3 text-sm font-normal">${message}</div>
            <button type="button" class="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 hover:bg-white/20 focus:ring-2 focus:ring-gray-300" aria-label="Close">
                <span class="sr-only">Close</span>
                <i data-lucide="x" class="w-5 h-5"></i>
            </button>
        `;

        this.container.appendChild(toast);
        lucide.createIcons({ nodes: [toast] });

        setTimeout(() => toast.classList.add('show'), 10);

        const removeToast = () => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, { once: true });
        };
        
        toast.querySelector('button').addEventListener('click', removeToast);

        setTimeout(removeToast, duration);
    },

    // Convenience methods
    success(message, duration) {
        this.show(message, 'success', duration);
    },

    error(message, duration) {
        this.show(message, 'danger', duration);
    },

    warning(message, duration) {
        this.show(message, 'warning', duration);
    },

    info(message, duration) {
        this.show(message, 'info', duration);
    }
};

export { ToastService };