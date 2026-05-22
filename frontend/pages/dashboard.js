import { StatsCard } from '../components/StatsCard.js';
import { renderRevenueChart } from '../components/RevenueChart.js';
import { apiService } from '../services/api.js';
import { LoadingSpinnerService } from '../components/LoadingSpinner.js';

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export const renderDashboard = async () => {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = ''; // Clear previous content
    LoadingSpinnerService.show();

    // Fetch all necessary data in parallel
    const [stats, chartData] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getRevenueChartData()
    ]);

    LoadingSpinnerService.hide();

    // Dữ liệu mẫu cho các StatsCard
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
                <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
                    <h2 class="text-xl font-semibold text-text dark:text-white mb-4">Đơn hàng gần đây</h2>
                    <p class="text-muted text-center mt-12">Chức năng đang được phát triển.</p>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons(); // Đảm bảo các icon được render sau khi nội dung được thêm vào DOM

    // Render chart after the main content is in the DOM
    setTimeout(() => renderRevenueChart('dashboardRevenueChart', chartData), 0);
};