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
                <table id="marker-pricing-table" class="w-full text-sm text-left text-muted">
                    <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" class="px-6 py-3">ID</th>
                            <th scope="col" class="px-6 py-3">Khổ tính tiền (cm)</th>
                            <th scope="col" class="px-6 py-3">Chiều rộng tối đa (cm)</th>
                            <th scope="col" class="px-6 py-3">Đơn giá (VNĐ/mét)</th>
                            <th scope="col" class="px-6 py-3 text-center">Hoạt động</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${markerPricing.map(price => `
                            <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">${price.id}</td>
                                <td class="px-6 py-4">
                                    <input type="number" data-field="chargeWidth" data-id="${price.id}" value="${price.chargeWidth}" 
                                           class="w-24 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                </td>
                                <td class="px-6 py-4">
                                    <input type="number" data-field="maxWidth" data-id="${price.id}" value="${price.maxWidth}" 
                                           class="w-24 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                </td>
                                <td class="px-6 py-4">
                                    <input type="number" data-field="unitPrice" data-id="${price.id}" id="marker-price-${price.id}" name="marker-price-${price.id}" value="${price.unitPrice}" 
                                           class="w-32 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                </td>
                                <td class="px-6 py-4 text-center">
                                    <label class="relative inline-flex items-center cursor-pointer">
                                      <input type="checkbox" id="marker-active-${price.id}" value="" class="sr-only peer" ${price.isActive ? 'checked' : ''}>
                                      <div class="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-accent"></div>
                                    </label>
                                </td>
                                <td class="px-6 py-4 text-center">
                                    <button class="delete-price-row-btn text-danger hover:text-opacity-80" data-id="${price.id}" title="Xóa mức giá">
                                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="6" class="pt-4 text-right">
                                <button id="add-price-row-btn" class="text-sm bg-accent text-white hover:bg-opacity-90 font-semibold py-2 px-3 rounded-lg flex items-center shadow-md transition-transform hover:scale-105">
                                    <i data-lucide="plus" class="mr-1 h-4 w-4"></i> Thêm Mức giá
                                </button>
                            </td>
                        </tr>
                    </tfoot>
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
                    <label for="markerCreationFee" class="block text-sm font-medium text-muted mb-1">Phí dịch vụ chạy sơ đồ (VNĐ/lần)</label>
                    <input type="number" id="markerCreationFee" name="markerCreationFee" value="${settings.markerCreationFee || 0}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                </div>
                <div>
                    <label for="gradingRate" class="block text-sm font-medium text-muted mb-1">Nhảy size (VNĐ/chi tiết)</label>
                    <input type="number" id="gradingRate" name="gradingRate" value="${settings.gradingRate || 0}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                </div>
                <div>
                    <label for="designRate" class="block text-sm font-medium text-muted mb-1">Thiết kế rập (VNĐ/lần)</label>
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

// Component render form cấu hình thông tin mẫu in PDF
const renderPdfSettingsForm = (settings = {}) => {
    return `
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-semibold text-text dark:text-white mb-4">Cấu hình mẫu in công nợ (PDF)</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="md:col-span-2">
                    <label for="pdfTitle" class="block text-sm font-medium text-muted mb-1">Tên dịch vụ / Tên thương hiệu</label>
                    <input type="text" id="pdfTitle" name="pdfTitle" value="${settings.pdfTitle || ''}" placeholder="Ví dụ: DỊCH VỤ THIẾT KẾ & IN SƠ ĐỒ MAY MẶC" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                </div>
                <div>
                    <label for="pdfAddress" class="block text-sm font-medium text-muted mb-1">Địa chỉ</label>
                    <input type="text" id="pdfAddress" name="pdfAddress" value="${settings.pdfAddress || ''}" placeholder="Ví dụ: KP.Bình Ý, P.Tân Triều, TP.Đồng Nai" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                </div>
                <div>
                    <label for="pdfPhone" class="block text-sm font-medium text-muted mb-1">Điện thoại</label>
                    <input type="text" id="pdfPhone" name="pdfPhone" value="${settings.pdfPhone || ''}" placeholder="Ví dụ: 0938.117.848" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                </div>
                <div>
                    <label for="pdfEmail" class="block text-sm font-medium text-muted mb-1">Email</label>
                    <input type="text" id="pdfEmail" name="pdfEmail" value="${settings.pdfEmail || ''}" placeholder="Ví dụ: thuongcoder@gmail.com" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                </div>
                <div>
                    <label for="pdfCreator" class="block text-sm font-medium text-muted mb-1">Người lập bảng kê</label>
                    <input type="text" id="pdfCreator" name="pdfCreator" value="${settings.pdfCreator || ''}" placeholder="Ví dụ: Nguyễn Ngọc Thương" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                </div>
            </div>
        </div>
    `;
};


// Hàm để render lại chỉ bảng giá sơ đồ
const rerenderMarkerTable = () => {
    const container = document.getElementById('marker-pricing-container');
    if (container) {
        container.innerHTML = renderMarkerPricingTable(currentPriceSettings.markerPricing);
        lucide.createIcons(); // Phải gọi lại để render các icon mới (thêm/xóa)
    }
};

// Gắn sự kiện cho trang
const attachSettingsEventListeners = () => {
    const pageContainer = document.getElementById('settings-form');
    if (!pageContainer) return;

    // Sử dụng event delegation cho các hành động trên bảng giá
    pageContainer.addEventListener('click', (e) => {
        const addBtn = e.target.closest('#add-price-row-btn');
        if (addBtn) {
            const newId = currentPriceSettings.markerPricing.length > 0 
                ? Math.max(...currentPriceSettings.markerPricing.map(p => p.id)) + 1 
                : 1;
            
            currentPriceSettings.markerPricing.push({
                id: newId,
                chargeWidth: 0,
                maxWidth: 0,
                unitPrice: 0,
                isActive: true
            });
            rerenderMarkerTable();
            ToastService.show('Đã thêm dòng mới. Vui lòng nhập thông tin và lưu lại.', 'info');
        }

        const deleteBtn = e.target.closest('.delete-price-row-btn');
        if (deleteBtn) {
            const idToDelete = parseInt(deleteBtn.dataset.id);
            currentPriceSettings.markerPricing = currentPriceSettings.markerPricing.filter(p => p.id !== idToDelete);
            rerenderMarkerTable();
            ToastService.show('Đã xóa mức giá. Thay đổi sẽ được áp dụng sau khi lưu.', 'warning');
        }
    });

    document.getElementById('save-settings-btn')?.addEventListener('click', async () => {
        // Lấy dữ liệu từ form và tạo object settings mới
        const markerPricingData = currentPriceSettings.markerPricing.map(p => {
            const row = document.querySelector(`#marker-pricing-table tr button.delete-price-row-btn[data-id="${p.id}"]`)?.closest('tr');
            if (!row) return p; // Row might not be in DOM if just deleted, but state not updated. Should not happen with current logic.

            return {
                id: p.id,
                chargeWidth: parseFloat(row.querySelector('input[data-field="chargeWidth"]').value) || 0,
                maxWidth: parseFloat(row.querySelector('input[data-field="maxWidth"]').value) || 0,
                unitPrice: parseFloat(row.querySelector('input[data-field="unitPrice"]').value) || 0,
                isActive: row.querySelector('input[type="checkbox"]').checked
            };
        });

        const newSettings = {
            markerPricing: markerPricingData,
            gradingRate: parseFloat(document.getElementById('gradingRate').value) || 0,
            markerCreationFee: parseFloat(document.getElementById('markerCreationFee').value) || 0,
            designRate: parseFloat(document.getElementById('designRate').value) || 0,
            digitizingRate: parseFloat(document.getElementById('digitizingRate').value) || 0,
            pdfTitle: document.getElementById('pdfTitle').value.trim(),
            pdfAddress: document.getElementById('pdfAddress').value.trim(),
            pdfPhone: document.getElementById('pdfPhone').value.trim(),
            pdfEmail: document.getElementById('pdfEmail').value.trim(),
            pdfCreator: document.getElementById('pdfCreator').value.trim(),
        };

        LoadingSpinnerService.show();
        try {
            await apiService.savePricingSettings(newSettings);
            // Cập nhật state cục bộ sau khi lưu thành công
            currentPriceSettings = newSettings;
            rerenderMarkerTable(); // Render lại bảng với dữ liệu đã được chuẩn hóa từ server (nếu có)
            ToastService.show('Đã lưu cài đặt bảng giá thành công!', 'success');
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
                <div id="marker-pricing-container">
                    ${renderMarkerPricingTable(currentPriceSettings.markerPricing)}
                </div>
                ${renderOtherServicesForm(currentPriceSettings)}
                ${renderPdfSettingsForm(currentPriceSettings)}
            </div>
        </div>
    `;

    lucide.createIcons();
    LoadingSpinnerService.hide();
    attachSettingsEventListeners();
};