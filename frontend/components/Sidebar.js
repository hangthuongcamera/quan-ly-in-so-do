const menuItems = [
    { path: '#/dashboard', icon: 'layout-dashboard', label: 'Dashboard' },
    { path: '#/customers', icon: 'users', label: 'Khách hàng' },
    { path: '#/marker', icon: 'file-scan', label: 'Chạy sơ đồ' },
    { path: '#/manual-services', icon: 'wrench', label: 'Dịch vụ thủ công' },
    { path: '#/orders', icon: 'package', label: 'Đơn hàng' },
    { path: '#/debt', icon: 'dollar-sign', label: 'Công nợ' },
    { path: '#/invoices', icon: 'file-text', label: 'Hóa đơn' },
    { path: '#/reports', icon: 'bar-chart-2', label: 'Báo cáo' },
    { path: '#/settings', icon: 'settings', label: 'Cài đặt' },
];

export const Sidebar = () => {
    const links = menuItems.map(item => `
        <li>
            <a href="${item.path}" 
               class="sidebar-link flex items-center p-3 my-1 rounded-lg text-muted hover:bg-primary hover:text-white transition-colors duration-200"
               data-path="${item.path}">
                <i data-lucide="${item.icon}" class="mr-3 h-5 w-5"></i>
                ${item.label}
            </a>
        </li>
    `).join('');

    return `
        <aside class="w-64 flex-shrink-0 bg-white dark:bg-gray-900 p-4 shadow-lg overflow-y-auto">
            <div class="text-primary dark:text-white text-2xl font-bold mb-8 text-center">
                APP MAY MẶC
            </div>
            <nav><ul>${links}</ul></nav>
        </aside>
    `;
};