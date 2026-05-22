import { AppLayout } from '../components/AppLayout.js';
import { router, updateActiveLink } from './router.js';
import { ToastService } from '../components/Toast.js';

const appElement = document.getElementById('app');

// Render the main app layout
appElement.innerHTML = AppLayout();

// Initialize the router to load the initial page
router();

// Initialize Toast Service
ToastService.init();

// Initialize Lucide icons
lucide.createIcons();

// Dark Mode Toggle Logic
const darkModeToggle = document.getElementById('dark-mode-toggle');
const html = document.documentElement;

darkModeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    const icon = darkModeToggle.querySelector('i');
    if (html.classList.contains('dark')) {
        icon.setAttribute('data-lucide', 'sun');
    } else {
        icon.setAttribute('data-lucide', 'moon');
    }
    lucide.createIcons();
});

// Update active sidebar link on hash change
window.addEventListener('hashchange', updateActiveLink);
// Update on initial load
updateActiveLink();