import { renderRevenueChart } from '../components/RevenueChart.js';
import { apiService } from '../services/api.js';
import { LoadingSpinnerService } from '../components/LoadingSpinner.js';

export const renderReportsPage = async () => {
    const mainContent = document.getElementById('main-content');
    // Set a placeholder while loading
    mainContent.innerHTML = `<div class="p-8"><h1 class="text-3xl font-bold text-text dark:text-white mb-6">Báo cáo</h1></div>`;
    LoadingSpinnerService.show();
    const pageContent = `
        <div class="p-8">
            <h1 class="text-3xl font-bold text-text dark:text-white mb-6">Báo cáo</h1>
            
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
                <h2 class="text-xl font-semibold text-text dark:text-white mb-4">Doanh thu theo tháng (6 tháng gần nhất)</h2>
                <div class="h-96">
                    <canvas id="mainRevenueChart"></canvas>
                </div>
            </div>

            <!-- Placeholder for other reports -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
                    <h2 class="text-xl font-semibold text-text dark:text-white mb-4">Báo cáo theo Khách hàng</h2>
                    <p class="text-muted">Chức năng đang được phát triển.</p>
                </div>
                <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
                    <h2 class="text-xl font-semibold text-text dark:text-white mb-4">Báo cáo theo Dịch vụ</h2>
                    <p class="text-muted">Chức năng đang được phát triển.</p>
                </div>
            </div>
        </div>
    `;

    mainContent.innerHTML = pageContent;

    const chartData = await apiService.getRevenueChartData();
    LoadingSpinnerService.hide();

    // Use a timeout to ensure the canvas is ready before rendering the chart
    setTimeout(() => renderRevenueChart('mainRevenueChart', chartData), 0);
};