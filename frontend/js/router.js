import { renderDashboard } from '../pages/dashboard.js';
import { renderCustomersPage } from '../pages/customers.js';
import { renderMarkerPage } from '../pages/marker.js';
import { renderManualServicesPage } from '../pages/manualServices.js';
import { renderReceivablesPage } from '../pages/receivables.js';
import { renderOrdersPage } from '../pages/orders.js';
import { renderSettingsPage } from '../pages/settings.js';
import { renderReportsPage } from '../pages/reports.js';
import { renderInvoicesPage } from '../pages/invoices.js';

// A simple page component for placeholder
const renderPlaceholder = (title) => {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="p-8">
            <h1 class="text-3xl font-bold text-text dark:text-white">${title}</h1>
        </div>
    `;
}

const routes = {
    '/dashboard': renderDashboard,
    '/customers': renderCustomersPage,
    '/marker': renderMarkerPage,
    '/manual-services': renderManualServicesPage,
    '/orders': renderOrdersPage,
    '/debt': renderReceivablesPage,
    '/invoices': renderInvoicesPage,
    '/reports': renderReportsPage,
    '/settings': renderSettingsPage,
};

export const router = async () => {
    const path = window.location.hash.slice(1) || '/dashboard';
    const renderFunction = routes[path] || (() => renderPlaceholder('404 - Not Found'));
    await renderFunction();
    updateActiveLink();
};

export const updateActiveLink = () => {
    const path = window.location.hash || '#/dashboard';
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === path) {
            link.classList.add('active');
        }
    });
};

window.addEventListener('hashchange', router);