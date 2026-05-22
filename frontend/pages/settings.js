import { apiService } from '../services/api.js';
import { LoadingSpinnerService } from '../components/LoadingSpinner.js';
import { ToastService } from '../components/Toast.js';

let currentPriceSettings = {}; // State to hold settings from API

// Component render bảng giá chạy sơ đồ
const renderMarkerPricingTable = (markerPricing = []) => {
    return `
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-semibold text-text dark:text-white mb-4">Bảng giá chạy sơ đồ (.plt)</h2>
            <div class="overflow-x-auto">
                <table class="w-full text-sm text-left text-muted">
                    <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" class="px-6 py-3">Khổ tính tiền (cm)</th>
                            <th scope="col" class="px-6 py-3">Chiều rộng tối đa (cm)</th>
                            <th scope="col" class="px-6 py-3">Đơn giá (VNĐ/mét)</th>
                            <th scope="col" class="px-6 py-3 text-center">Hoạt động</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${markerPricing.map(price => `
                            <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">${price.chargeWidth}</td>
                                <td class="px-6 py-4">${price.maxWidth}</td>
                                <td class="px-6 py-4">
                                    <input type="number" id="marker-price-${price.id}" name="marker-price-${price.id}" value="${price.unitPrice}" 
                                           class="w-32 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                </td>
                                <td class="px-6 py-4 text-center">
                                    <label class="relative inline-flex items-center cursor-pointer">
                                      <input type="checkbox" value="" class="sr-only peer" ${price.isActive ? 'checked' : ''}>
                                      <div class="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-accent"></div>
                                    </label>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
};

// Component render form cho các dịch vụ khác
const renderOtherServicesForm = (settings = {}) => {
    return `
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-semibold text-text dark:text-white mb-4">Đơn giá dịch vụ khác</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label for="gradingRate" class="block text-sm font-medium text-muted mb-1">Nhảy size (VNĐ/chi tiết)</label>
                    <input type="number" id="gradingRate" name="gradingRate" value="${settings.gradingRate || 0}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                </div>
                <div>
                    <label for="designRate" class="block text-sm font-medium text-muted mb-1">Thiết kế rập (VNĐ/giờ)</label>
                    <input type="number" id="designRate" name="designRate" value="${settings.designRate || 0}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                </div>
                <div>
                    <label for="digitizingRate" class="block text-sm font-medium text-muted mb-1">Nhập rập (VNĐ/chi tiết)</label>
                    <input type="number" id="digitizingRate" name="digitizingRate" value="${settings.digitizingRate || 0}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                </div>
            </div>
        </div>
    `;
};

// Gắn sự kiện cho trang
const attachSettingsEventListeners = () => {
    document.getElementById('save-settings-btn')?.addEventListener('click', async () => {
        // Lấy dữ liệu từ form và tạo object settings mới
        const newSettings = {
            markerPricing: currentPriceSettings.markerPricing.map(p => ({
                ...p,
                unitPrice: parseFloat(document.getElementById(`marker-price-${p.id}`).value) || 0
            })),
            gradingRate: parseFloat(document.getElementById('gradingRate').value) || 0,
            designRate: parseFloat(document.getElementById('designRate').value) || 0,
            digitizingRate: parseFloat(document.getElementById('digitizingRate').value) || 0,
        };

        LoadingSpinnerService.show();
        try {
            await apiService.savePricingSettings(newSettings);
            ToastService.show('Đã lưu cài đặt bảng giá thành công!', 'success');
            // Cập nhật state cục bộ sau khi lưu thành công
            currentPriceSettings = newSettings;
        } catch (error) {
            ToastService.show('Lỗi khi lưu cài đặt: ' + error.message, 'danger');
        } finally {
            LoadingSpinnerService.hide();
        }
    });
};

export const renderSettingsPage = async () => {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = ''; // Clear content
    LoadingSpinnerService.show();

    try {
        currentPriceSettings = await apiService.getPricingSettings();
    } catch (error) {
        ToastService.show('Lỗi khi tải cài đặt: ' + error.message, 'danger');
        LoadingSpinnerService.hide();
        mainContent.innerHTML = `<p class="p-8 text-danger">Không thể tải dữ liệu cài đặt.</p>`;
        return;
    }

    mainContent.innerHTML = `
        <div class="p-8">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold text-text dark:text-white">Cài đặt Bảng giá</h1>
                <button id="save-settings-btn" class="bg-primary text-white hover:bg-opacity-90 font-semibold py-2 px-4 rounded-lg flex items-center shadow-md transition-transform hover:scale-105">
                    <i data-lucide="save" class="mr-2 h-5 w-5"></i>
                    Lưu thay đổi
                </button>
            </div>
            <div id="settings-form" class="space-y-8">
                ${renderMarkerPricingTable(currentPriceSettings.markerPricing)}
                ${renderOtherServicesForm(currentPriceSettings)}
            </div>
        </div>
    `;

    lucide.createIcons();
    LoadingSpinnerService.hide();
    attachSettingsEventListeners();
};