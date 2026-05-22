import { ToastService } from '../components/Toast.js';
import { LoadingSpinnerService } from '../components/LoadingSpinner.js';
import { apiService } from '../services/api.js';
import { FormInput, FormSelect } from '../components/Form.js';

// State để lưu danh sách các dịch vụ được thêm vào đơn hàng hiện tại
let serviceItems = [];
let availableCustomers = []; // Để lưu danh sách khách hàng từ API

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

// Render bảng các dịch vụ đã thêm
const renderServiceItemsTable = () => {
    const container = document.getElementById('service-items-container');
    const totalAmountDisplay = document.getElementById('total-amount-display');

    if (!container) return;

    if (serviceItems.length === 0) {
        container.innerHTML = `<p class="text-center text-muted">Chưa có dịch vụ nào được thêm.</p>`;
    } else {
        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="w-full text-sm text-left text-muted">
                    <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" class="px-4 py-3">Loại Dịch Vụ</th>
                            <th scope="col" class="px-4 py-3">Mô Tả</th>
                            <th scope="col" class="px-4 py-3 text-right">Số Lượng</th>
                            <th scope="col" class="px-4 py-3 text-right">Đơn Giá</th>
                            <th scope="col" class="px-4 py-3 text-right">Thành Tiền</th>
                            <th scope="col" class="px-4 py-3 text-center"></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${serviceItems.map((item, index) => `
                            <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">${item.serviceTypeLabel}</td>
                                <td class="px-4 py-3">${item.description}</td>
                                <td class="px-4 py-3 text-right">${item.quantity}</td>
                                <td class="px-4 py-3 text-right">${formatCurrency(item.unitPrice)}</td>
                                <td class="px-4 py-3 text-right font-semibold">${formatCurrency(item.amount)}</td>
                                <td class="px-4 py-3 text-center">
                                    <button class="remove-item-btn text-danger hover:text-opacity-80" data-index="${index}" title="Xóa">
                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // Cập nhật tổng tiền
    const totalAmount = serviceItems.reduce((sum, item) => sum + item.amount, 0);
    if (totalAmountDisplay) {
        totalAmountDisplay.textContent = formatCurrency(totalAmount);
    }
    
    lucide.createIcons();
};

// Gắn các sự kiện cho trang
const attachManualServiceEventListeners = () => {
    const quantityInput = document.getElementById('quantity');
    const unitPriceInput = document.getElementById('unitPrice');
    const currentAmountDisplay = document.getElementById('current-amount-display');
    const addItemBtn = document.getElementById('add-service-item-btn');
    const saveOrderBtn = document.getElementById('save-manual-order-btn');
    const itemsContainer = document.getElementById('service-items-container');

    // Tính toán thành tiền trực tiếp trên form
    const calculateCurrentAmount = () => {
        if (!quantityInput || !unitPriceInput || !currentAmountDisplay) return;
        const quantity = parseFloat(quantityInput.value) || 0;
        const unitPrice = parseFloat(unitPriceInput.value) || 0;
        const amount = quantity * unitPrice;
        currentAmountDisplay.textContent = formatCurrency(amount);
    };

    quantityInput?.addEventListener('input', calculateCurrentAmount);
    unitPriceInput?.addEventListener('input', calculateCurrentAmount);

    // Thêm dịch vụ vào danh sách
    addItemBtn?.addEventListener('click', () => {
        const serviceTypeSelect = document.getElementById('serviceType');
        const descriptionInput = document.getElementById('description');
        
        const serviceType = serviceTypeSelect.value;
        const serviceTypeLabel = serviceTypeSelect.options[serviceTypeSelect.selectedIndex].text;
        const description = descriptionInput.value.trim();
        const quantity = parseFloat(quantityInput.value) || 0;
        const unitPrice = parseFloat(unitPriceInput.value) || 0;

        if (quantity <= 0 || unitPrice <= 0) {
            ToastService.show('Vui lòng nhập đầy đủ thông tin dịch vụ.', 'warning');
            return;
        }

        serviceItems.push({
            serviceType,
            serviceTypeLabel,
            description,
            quantity,
            unitPrice,
            amount: quantity * unitPrice
        });

        renderServiceItemsTable();
        ToastService.show('Đã thêm dịch vụ vào đơn hàng.', 'success');

        // Reset các ô nhập liệu (trừ loại dịch vụ)
        descriptionInput.value = '';
        quantityInput.value = '';
        unitPriceInput.value = '';
        currentAmountDisplay.textContent = formatCurrency(0);
        descriptionInput.focus();
    });

    // Xóa dịch vụ khỏi danh sách (sử dụng event delegation)
    itemsContainer?.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-item-btn');
        if (removeBtn) {
            const index = parseInt(removeBtn.getAttribute('data-index'));
            serviceItems.splice(index, 1);
            renderServiceItemsTable();
            ToastService.show('Đã xóa dịch vụ khỏi đơn hàng.', 'info');
        }
    });

    // Lưu toàn bộ đơn hàng
    saveOrderBtn?.addEventListener('click', async () => {
        const customerId = document.getElementById('customerId').value;
        const orderDate = document.getElementById('orderDate').value;

        if (!customerId) {
            ToastService.show('Vui lòng chọn khách hàng.', 'warning');
            return;
        }
        if (serviceItems.length === 0) {
            ToastService.show('Đơn hàng chưa có dịch vụ nào.', 'warning');
            return;
        }

        const totalAmount = serviceItems.reduce((sum, item) => sum + item.amount, 0);
        const finalOrder = {
            customerId,
            orderDate,
            items: serviceItems,
            totalAmount
        };

        LoadingSpinnerService.show();
        try {
            await apiService.saveManualOrder(finalOrder);
            ToastService.show('Đã lưu đơn hàng thành công!', 'success');

            // Reset lại trang sau khi lưu thành công
            serviceItems = [];
            document.getElementById('customerId').value = '';
            document.getElementById('orderDate').value = new Date().toISOString().split('T')[0]; // Reset ngày về hôm nay
            renderServiceItemsTable();
        } catch (error) {
            ToastService.show('Lỗi khi lưu đơn hàng: ' + error.message, 'danger');
        } finally {
            LoadingSpinnerService.hide();
        }
    });
};

export const renderManualServicesPage = async () => {
    const mainContent = document.getElementById('main-content');
    serviceItems = []; // Reset danh sách dịch vụ mỗi khi render lại trang
    mainContent.innerHTML = ''; // Clear previous content
    LoadingSpinnerService.show();

    // Lấy danh sách khách hàng từ API
    const serviceOptions = [
        { value: 'grading', label: 'Nhảy Size (Grading)' },
        { value: 'design', label: 'Thiết Kế Rập (Pattern Design)' },
        { value: 'digitizing', label: 'Nhập Rập (Pattern Digitizing)' },
    ];
    
    // Dữ liệu khách hàng mẫu
    try {
        availableCustomers = await apiService.getCustomers();
    } catch (error) {
        ToastService.show('Lỗi khi tải danh sách khách hàng: ' + error.message, 'danger');
        LoadingSpinnerService.hide();
        return;
    }
    const customerOptionsHtml = [
        { value: '', label: '--- Chọn khách hàng ---' },
        ...availableCustomers.map(c => ({ value: c.id, label: `${c.companyName} (${c.customerCode})` }))
    ];

    // Mặc định ngày tạo là hôm nay
    const defaultOrderDate = new Date().toISOString().split('T')[0];

    mainContent.innerHTML = `
        <div class="p-8">
            <h1 class="text-3xl font-bold text-text dark:text-white mb-6">Tạo Đơn Hàng Dịch Vụ</h1>
            
            <div class="max-w-4xl mx-auto space-y-8">
                <!-- Khu vực chọn khách hàng và ngày -->
                <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${FormSelect({ id: 'customerId', label: 'Khách hàng', options: customerOptionsHtml })}
                        ${FormInput({ id: 'orderDate', label: 'Ngày tạo đơn hàng', type: 'date', value: defaultOrderDate })}
                    </div>
                </div>

                <!-- Form nhập từng dịch vụ -->
                <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
                    <h2 class="text-lg font-semibold text-text dark:text-white mb-4">Thêm Dịch Vụ</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div class="lg:col-span-2">${FormSelect({ id: 'serviceType', label: 'Loại Dịch Vụ', options: serviceOptions })}</div>
                        <div class="lg:col-span-2">${FormInput({ id: 'description', label: 'Mô tả chi tiết', placeholder: 'Ví dụ: Nhảy size áo sơ mi' })}</div>
                        <div>${FormInput({ id: 'quantity', label: 'Số Lượng', type: 'number', placeholder: '0' })}</div>
                        <div>${FormInput({ id: 'unitPrice', label: 'Đơn Giá', type: 'number', placeholder: '0' })}</div>
                        <div class="text-right">
                            <p class="text-sm text-muted">Thành tiền</p>
                            <p id="current-amount-display" class="font-bold text-accent text-lg">0 VNĐ</p>
                        </div>
                        <div class="text-right">
                            <button id="add-service-item-btn" class="bg-accent text-white hover:bg-opacity-90 font-semibold py-2 px-4 rounded-lg flex items-center shadow-md transition-transform hover:scale-105">
                                <i data-lucide="plus" class="mr-2 h-5 w-5"></i>
                                Thêm
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Bảng chi tiết các dịch vụ đã thêm -->
                <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
                    <h2 class="text-lg font-semibold text-text dark:text-white mb-4">Chi Tiết Đơn Hàng</h2>
                    <div id="service-items-container"></div>
                    <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-right">
                        <span class="text-xl font-medium text-muted">Tổng Cộng: </span>
                        <span id="total-amount-display" class="text-2xl font-bold text-accent">0 VNĐ</span>
                    </div>
                </div>

                <!-- Nút lưu toàn bộ đơn hàng -->
                <div class="text-right">
                    <button id="save-manual-order-btn" class="bg-primary text-white hover:bg-opacity-90 font-semibold py-3 px-8 rounded-lg flex items-center shadow-lg transition-transform hover:scale-105">
                        <i data-lucide="save" class="mr-2 h-5 w-5"></i>
                        Lưu Đơn Hàng
                    </button>
                </div>
            </div>
        </div>
    `;

    lucide.createIcons();
    LoadingSpinnerService.hide();
    renderServiceItemsTable(); // Render bảng lần đầu (trống)
    attachManualServiceEventListeners();
};