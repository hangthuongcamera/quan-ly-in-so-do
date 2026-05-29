import { AppLayout } from '../components/AppLayout.js';
import { router, updateActiveLink } from './router.js';
import { ToastService } from '../components/Toast.js';
import { AuthService } from '../services/auth.js';
import { renderLoginPage } from '../pages/login.js';

const appElement = document.getElementById('app');

// Initialize Toast Service
ToastService.init();

// Function to setup dark mode toggle
const setupDarkMode = () => {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const html = document.documentElement;
    
    if (darkModeToggle) {
        const icon = darkModeToggle.querySelector('i');
        
        // Đồng bộ icon ban đầu dựa trên class dark đang áp dụng
        if (html.classList.contains('dark')) {
            if (icon) icon.setAttribute('data-lucide', 'sun');
        } else {
            if (icon) icon.setAttribute('data-lucide', 'moon');
        }
        lucide.createIcons();

        darkModeToggle.addEventListener('click', () => {
            html.classList.toggle('dark');
            const isDark = html.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            
            const currentIcon = darkModeToggle.querySelector('i');
            if (currentIcon) {
                currentIcon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
            }
            lucide.createIcons();
        });
    }
};

// Setup mobile sidebar sliding behavior
const setupMobileSidebar = () => {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const openBtn = document.getElementById('open-sidebar-btn');
    const closeBtn = document.getElementById('close-sidebar-btn');

    if (!sidebar || !backdrop) return;

    const openSidebar = () => {
        backdrop.classList.remove('hidden');
        setTimeout(() => {
            backdrop.classList.add('opacity-100');
            sidebar.classList.remove('-translate-x-full');
        }, 10);
    };

    const closeSidebar = () => {
        sidebar.classList.add('-translate-x-full');
        backdrop.classList.remove('opacity-100');
        setTimeout(() => {
            backdrop.classList.add('hidden');
        }, 300);
    };

    if (openBtn) openBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    backdrop.addEventListener('click', closeSidebar);

    // Auto close sidebar when a menu link is clicked on mobile view
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 768) {
                closeSidebar();
            }
        });
    });
};

// Global function to initialize the authenticated app (called from login page too)
window.initApp = async () => {
    // Set default hash if empty
    if (!window.location.hash || window.location.hash === '#') {
        window.location.hash = '#/dashboard';
    }

    // Render the main app layout
    appElement.innerHTML = AppLayout();

    // Initialize icons, dark mode, and router
    lucide.createIcons();
    setupDarkMode();
    setupMobileSidebar();
    await router();
    updateActiveLink();
};

// Expose logout function globally for Header button
window.appLogout = () => {
    AuthService.logout();
};

// Boot the app
if (!AuthService.isLoggedIn()) {
    renderLoginPage();
} else {
    window.initApp();
}

// Update active sidebar link on hash change
window.addEventListener('hashchange', () => {
    if (AuthService.isLoggedIn()) updateActiveLink();
});