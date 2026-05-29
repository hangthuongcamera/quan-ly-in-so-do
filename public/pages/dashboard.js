import { StatsCard } from '../components/StatsCard.js';
import { renderRevenueChart } from '../components/RevenueChart.js';
import { apiService } from '../services/api.js';
import { LoadingSpinnerService } from '../components/LoadingSpinner.js';
import { ToastService } from '../components/Toast.js';

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const getStatusBadge = (status) => {
    const statusMap = {
        'unpaid': { label: 'Chưa thanh toán', color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
        'paid': { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
    };
    
    const mappedStatus = statusMap[status] || statusMap['unpaid'];
    
    return `<span class="px-2.5 py-1 text-xs font-semibold rounded-full ${mappedStatus.color}">
                ${mappedStatus.label}
            </span>`;
};

export const renderDashboard = async () => {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = ''; // Clear previous content
    LoadingSpinnerService.show();

    try {
        // Fetch all necessary data in parallel
        const [stats, chartData, orders] = await Promise.all([
            apiService.getDashboardStats(),
            apiService.getRevenueChartData(),
            apiService.getOrders()
        ]);

        LoadingSpinnerService.hide();

        // Sort orders descending by date and take top 5
        const recentOrders = [...orders]
            .sort((a, b) => new Date(b.rawOrderDate || 0) - new Date(a.rawOrderDate || 0))
            .slice(0, 5);

        // Dữ liệu cho các StatsCard
        const statsData = [
            { title: 'Tổng Khách Hàng', value: stats.totalCustomers, icon: 'users', color: 'primary' },
            { title: 'Doanh Thu Tháng', value: formatCurrency(stats.monthlyRevenue), icon: 'dollar-sign', color: 'success' },
            { title: 'Công Nợ Còn Lại', value: formatCurrency(stats.outstandingDebt), icon: 'wallet', color: 'danger' },
            { title: 'Đơn Hàng Đang Xử Lý', value: stats.processingOrders, icon: 'package', color: 'warning' },
        ];

        const statsCardsHTML = statsData.map(stat => StatsCard(stat)).join('');

        mainContent.innerHTML = `
            <div class="p-8">
                <h1 class="text-3xl font-bold text-text dark:text-white mb-6">Dashboard</h1>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    ${statsCardsHTML}
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
                        <h2 class="text-xl font-semibold text-text dark:text-white mb-4">Biểu đồ Doanh thu</h2>
                        <div class="h-80">
                            <canvas id="dashboardRevenueChart"></canvas>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 flex flex-col">
                        <h2 class="text-xl font-semibold text-text dark:text-white mb-4">Đơn hàng gần đây</h2>
                        <div class="overflow-x-auto flex-1">
                            <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                                    <tr>
                                        <th scope="col" class="px-4 py-3">Ngày đặt</th>
                                        <th scope="col" class="px-4 py-3">Khách hàng</th>
                                        <th scope="col" class="px-4 py-3">Tổng tiền</th>
                                        <th scope="col" class="px-4 py-3">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
                                    ${recentOrders.length === 0 ? `
                                        <tr>
                                            <td colspan="4" class="px-4 py-8 text-center text-muted">
                                                Không có đơn hàng nào gần đây.
                                            </td>
                                        </tr>
                                    ` : recentOrders.map(order => `
                                        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td class="px-4 py-3.5 font-medium text-gray-900 dark:text-white whitespace-nowrap">${order.orderDate}</td>
                                            <td class="px-4 py-3.5 max-w-[150px] truncate" title="${order.customerName}">${order.customerName}</td>
                                            <td class="px-4 py-3.5 font-semibold text-gray-900 dark:text-white">${order.totalAmount}</td>
                                            <td class="px-4 py-3.5">${getStatusBadge(order.status)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons(); // Đảm bảo các icon được render sau khi nội dung được thêm vào DOM

        // Render chart after the main content is in the DOM
        setTimeout(() => renderRevenueChart('dashboardRevenueChart', chartData), 0);

    } catch (error) {
        console.error('Lỗi khi tải dữ liệu dashboard:', error);
        LoadingSpinnerService.hide();
        ToastService.error('Không thể tải dữ liệu Dashboard. Vui lòng thử lại sau.');
        
        mainContent.innerHTML = `
            <div class="p-8 flex flex-col items-center justify-center min-h-[50vh]">
                <div class="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-6 rounded-2xl max-w-md text-center shadow-md">
                    <i data-lucide="alert-triangle" class="w-12 h-12 mx-auto mb-4 text-red-500"></i>
                    <h2 class="text-xl font-bold mb-2">Đã xảy ra lỗi</h2>
                    <p class="text-sm mb-4">${error.message || 'Lỗi kết nối đến máy chủ.'}</p>
                    <button id="retry-dashboard-btn" class="px-4 py-2 bg-primary hover:bg-gray-800 text-white rounded-lg text-sm font-semibold transition-colors duration-200">
                        Thử lại
                    </button>
                </div>
            </div>
        `;
        lucide.createIcons();
        
        document.getElementById('retry-dashboard-btn')?.addEventListener('click', () => {
            renderDashboard();
        });
    }
};