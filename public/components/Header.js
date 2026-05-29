import { AuthService } from '../services/auth.js';

export const Header = () => {
    const user = AuthService.getUser() || {};

    return `
        <header class="bg-white dark:bg-gray-900 p-4 shadow-md flex justify-between items-center z-10">
            <div class="flex items-center">
                <!-- Nút Hamburger hiển thị trên mobile -->
                <button id="open-sidebar-btn" class="md:hidden text-muted hover:text-primary p-2 mr-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Mở menu">
                    <i data-lucide="menu" class="w-6 h-6"></i>
                </button>
                <div>
                    <!-- Search bar can go here -->
                </div>
            </div>
            <div class="flex items-center space-x-6">
                <button id="dark-mode-toggle" class="text-muted hover:text-accent flex items-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <i data-lucide="moon" class="dark-mode-icon w-5 h-5"></i>
                </button>
                
                <div class="h-8 border-l border-gray-300 dark:border-gray-700"></div>

                <div class="flex items-center">
                    <div class="text-right mr-3 hidden md:block">
                        <p class="text-sm font-medium text-gray-900 dark:text-white leading-none">${user.displayName || 'Khách'}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">${user.role === 'admin' ? 'Admin' : 'Nhân viên'}</p>
                    </div>
                    <div class="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold shadow-md select-none">
                        ${user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                </div>

                <button onclick="window.appLogout()" class="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" title="Đăng xuất">
                    <i data-lucide="log-out" class="h-5 w-5"></i>
                </button>
            </div>
        </header>
    `;
};