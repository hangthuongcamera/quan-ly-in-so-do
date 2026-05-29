import { AuthService } from '../services/auth.js';

const menuItems = [
    { path: '#/dashboard', icon: 'layout-dashboard', label: 'Dashboard' },
    { path: '#/customers', icon: 'users', label: 'Khách hàng' },
    { path: '#/marker', icon: 'file-scan', label: 'Chạy sơ đồ' },
    { path: '#/manual-services', icon: 'wrench', label: 'Dịch vụ thủ công' },
    { path: '#/orders', icon: 'package', label: 'Đơn hàng' },
    { path: '#/debt', icon: 'dollar-sign', label: 'Công nợ' },
    { path: '#/debt-settlement', icon: 'clipboard-check', label: 'Chốt công nợ' },
    { path: '#/settings', icon: 'settings', label: 'Cài đặt' },
    { path: '#/user-management', icon: 'user-cog', label: 'Quản lý người dùng' }, // Admin only
];

export const Sidebar = () => {
    const user = AuthService.getUser() || {};
    
    // Filter links based on user permissions
    const filteredItems = menuItems.filter(item => AuthService.canAccess(item.path));

    const links = filteredItems.map(item => {
        const isMarker = item.path === '#/marker';
        return `
            <li class="${isMarker ? 'hidden md:block' : ''}">
                <a href="${item.path}" 
                   class="sidebar-link flex items-center p-3 my-1 rounded-lg text-muted hover:bg-primary hover:text-white transition-colors duration-200"
                   data-path="${item.path}">
                    <i data-lucide="${item.icon}" class="mr-3 h-5 w-5"></i>
                    ${item.label}
                </a>
            </li>
        `;
    }).join('');

    return `
        <!-- Backdrop cho mobile -->
        <div id="sidebar-backdrop" class="fixed inset-0 bg-black/50 z-40 hidden transition-opacity duration-300"></div>

        <aside id="app-sidebar" class="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-lg flex flex-col h-screen transform -translate-x-full md:translate-x-0 md:static transition-transform duration-300 ease-in-out">
            <div class="p-4 flex-1 overflow-y-auto">
                <div class="flex items-center justify-between mb-8">
                    <div class="text-primary dark:text-white text-2xl font-bold text-center flex-1">
                        APP MAY MẶC
                    </div>
                    <!-- Nút đóng sidebar trên mobile -->
                    <button id="close-sidebar-btn" class="md:hidden text-muted hover:text-primary p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>
                <nav><ul>${links}</ul></nav>
            </div>
        </aside>
    `;
};