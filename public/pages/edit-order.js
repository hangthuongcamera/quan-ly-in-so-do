import { ToastService } from '../components/Toast.js';
import { LoadingSpinnerService } from '../components/LoadingSpinner.js';
import { apiService } from '../services/api.js';
import { FormInput, FormSelect } from '../components/Form.js';
import { renderOrdersPage } from './orders.js';

let currentOrder = null;
let availableCustomers = [];
let priceSettings = {};

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const renderOrderItemsTable = () => {
    const container = document.getElementById('edit-order-items-container');
    const totalDisplay = document.getElementById('edit-total-amount');
    
    if (!container) return;

    if (!currentOrder.items || currentOrder.items.length === 0) {
        container.innerHTML = `<p class="text-center text-muted py-4">Đơn hàng hiện không có dịch vụ nào.</p>`;
        if (totalDisplay) totalDisplay.textContent = formatCurrency(0);
        return;
    }

    container.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full text-sm text-left text-muted">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" class="px-4 py-3">Dịch Vụ / Chi Tiết</th>
                        <th scope="col" class="px-4 py-3 text-center">Số bản</th>
                        <th scope="col" class="px-4 py-3 text-right">Số Lượng</th>
                        <th scope="col" class="px-4 py-3 text-right">Đơn Giá</th>
                        <th scope="col" class="px-4 py-3 text-right">Thành Tiền</th>
                        <th scope="col" class="px-4 py-3 text-center">Xóa</th>
                    </tr>
                </thead>
                <tbody>
                    ${currentOrder.items.map((item, index) => {
                        const isMarker = item.serviceType === 'marker' || currentOrder.serviceType === 'marker' || (item.description && item.description.toLowerCase().includes('in sơ đồ'));
                        return `
                        <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                            <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                <div class="font-semibold">${item.serviceTypeLabel || item.serviceType}</div>
                                <div class="text-xs text-muted">${item.description || item.fileName || ''}</div>
                                ${item.hasCreationFee ? `<span class="text-[10px] bg-accent bg-opacity-20 text-accent px-2 py-0.5 rounded mt-1 inline-block">Đã kèm phí chạy sơ đồ</span>` : ''}
                            </td>
                            <td class="px-4 py-3 text-center">
                                ${isMarker ? `
                                    <input type="number" min="1" class="update-item-copies w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-center" data-index="${index}" value="${item.copies || 1}">
                                ` : '-'}
                            </td>
                            <td class="px-4 py-3 text-right">
                                <input type="number" min="0" step="0.01" class="update-item-qty w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-right" data-index="${index}" value="${item.quantity || 1}">
                            </td>
                            <td class="px-4 py-3 text-right">
                                <input type="number" min="0" class="update-item-price w-28 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-right" data-index="${index}" value="${item.unitPrice || 0}">
                            </td>
                            <td class="px-4 py-3 text-right font-semibold text-accent item-amount-display">${formatCurrency(item.amount || 0)}</td>
                            <td class="px-4 py-3 text-center">
                                <button type="button" class="remove-item-btn text-danger hover:text-opacity-80 p-1 transition-transform hover:scale-110" data-index="${index}" title="Xóa dịch vụ này">
                                    <i data-lucide="trash-2" class="w-4 h-4 mx-auto"></i>
                                </button>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    currentOrder.totalAmount = currentOrder.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    if (totalDisplay) {
        totalDisplay.textContent = formatCurrency(currentOrder.totalAmount);
    }
    lucide.createIcons();
};

// Logic Dropdown tìm kiếm khách hàng
const setupEditCustomerDropdown = () => {
    const input = document.getElementById('edit-customer-search-input');
    const hiddenSelect = document.getElementById('edit-customerId');
    const list = document.getElementById('edit-customer-dropdown-list');
    const clearBtn = document.getElementById('edit-clear-customer-btn');

    if (!input || !hiddenSelect || !list) return;

    const toggleClearBtn = () => {
        if (input.value.trim() !== '') {
            clearBtn?.classList.remove('hidden');
        } else {
            clearBtn?.classList.add('hidden');
        }
    };

    const renderList = (filterText = '') => {
        const filtered = availableCustomers.filter(c => 
            `${c.companyName} ${c.customerCode} ${c.phone || ''}`.toLowerCase().includes(filterText.toLowerCase())
        );
        
        if (filtered.length === 0) {
            list.innerHTML = `<li class="px-3 py-2 text-sm text-gray-500 text-center">Không tìm thấy khách hàng</li>`;
            return;
        }

        list.innerHTML = filtered.map(c => `
            <li class="px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 text-sm border-b border-gray-100 last:border-0" data-id="${c.id}" data-name="${c.companyName} (${c.customerCode})">
                <div class="font-medium">${c.companyName}</div>
                <div class="text-xs text-muted">Mã: ${c.customerCode} ${c.phone ? `- SĐT: ${c.phone}` : ''}</div>
            </li>
        `).join('');
    };

    input.addEventListener('click', () => { list.classList.remove('hidden'); renderList(input.value); });
    input.addEventListener('input', (e) => { list.classList.remove('hidden'); hiddenSelect.value = ''; toggleClearBtn(); renderList(e.target.value); });
    list.addEventListener('click', (e) => {
        const li = e.target.closest('li[data-id]');
        if (li) {
            hiddenSelect.value = li.dataset.id;
            input.value = li.dataset.name;
            list.classList.add('hidden');
            toggleClearBtn();
        }
    });
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !list.contains(e.target) && !clearBtn?.contains(e.target)) {
            list.classList.add('hidden');
            const selectedCustomer = availableCustomers.find(c => c.id === hiddenSelect.value);
            if (selectedCustomer) input.value = `${selectedCustomer.companyName} (${selectedCustomer.customerCode})`;
            else input.value = '';
            toggleClearBtn();
        }
    });
    clearBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        input.value = ''; hiddenSelect.value = ''; toggleClearBtn();
        list.classList.remove('hidden'); renderList(''); input.focus();
    });
};

const attachEditEventListeners = (orderId) => {
    const itemsContainer = document.getElementById('edit-order-items-container');

    // Lắng nghe sự kiện thay đổi số bản, số lượng hoặc giá để tính lại thành tiền tức thì
    itemsContainer.addEventListener('input', (e) => {
        if (
            e.target.classList.contains('update-item-qty') || 
            e.target.classList.contains('update-item-price') || 
            e.target.classList.contains('update-item-copies')
        ) {
            const index = parseInt(e.target.dataset.index, 10);
            const item = currentOrder.items[index];
            const tr = e.target.closest('tr');
            
            const newPrice = parseFloat(tr.querySelector('.update-item-price').value) || 0;
            
            if (e.target.classList.contains('update-item-copies')) {
                let newCopies = parseInt(tr.querySelector('.update-item-copies').value, 10) || 1;
                if (newCopies < 1) newCopies = 1;
                
                item.copies = newCopies;
                // Nếu có chiều dài gốc, tự động tính lại tổng số mét (quantity)
                if (item.length) {
                    item.quantity = parseFloat((item.length * newCopies).toFixed(2));
                    const qtyInput = tr.querySelector('.update-item-qty');
                    if (qtyInput) qtyInput.value = item.quantity;
                }
            } else if (e.target.classList.contains('update-item-qty')) {
                item.quantity = parseFloat(tr.querySelector('.update-item-qty').value) || 0;
            }
            
            item.unitPrice = newPrice;
            item.amount = (item.quantity * newPrice) + (item.hasCreationFee ? (priceSettings.markerCreationFee || 0) : 0);
            
            // Cập nhật mô tả hiển thị nếu có tên file và số bản
            if (item.fileName && item.copies) {
                item.description = `In sơ đồ: ${item.fileName} (${item.copies} bản)${item.hasCreationFee ? ' + Phí chạy' : ''}`;
                const descDiv = tr.querySelector('.text-xs.text-muted');
                if (descDiv) descDiv.textContent = item.description;
            }
            
            // Cập nhật DOM trực tiếp để không bị mất Focus của thẻ input
            const amountCell = tr.querySelector('.item-amount-display');
            if (amountCell) amountCell.textContent = formatCurrency(item.amount);
            
            // Cập nhật tổng số tiền
            currentOrder.totalAmount = currentOrder.items.reduce((sum, i) => sum + (i.amount || 0), 0);
            document.getElementById('edit-total-amount').textContent = formatCurrency(currentOrder.totalAmount);
        }
    });

    // Xóa dịch vụ
    itemsContainer.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-item-btn');
        if (removeBtn) {
            const index = parseInt(removeBtn.dataset.index, 10);
            currentOrder.items.splice(index, 1);
            renderOrderItemsTable(); 
            ToastService.show('Đã xóa dịch vụ khỏi đơn hàng.', 'info');
        }
    });

    // Quay lại
    document.getElementById('back-to-orders-btn').addEventListener('click', renderOrdersPage);

    // Lưu cập nhật
    document.getElementById('save-edited-order-btn').addEventListener('click', async () => {
        const customerId = document.getElementById('edit-customerId').value;
        const orderDate = document.getElementById('edit-orderDate').value;
        const status = document.getElementById('edit-status').value;
        const note = document.getElementById('edit-order-note').value;

        if (!customerId) { ToastService.show('Vui lòng chọn khách hàng.', 'warning'); return; }
        if (!currentOrder.items || currentOrder.items.length === 0) { ToastService.show('Đơn hàng cần có ít nhất 1 dịch vụ.', 'warning'); return; }

        const updatedOrderData = {
            customerId,
            orderDate,
            status,
            note,
            items: currentOrder.items,
            totalAmount: currentOrder.totalAmount
        };

        LoadingSpinnerService.show();
        try {
            await apiService.updateOrder(orderId, updatedOrderData);
            ToastService.show('Cập nhật đơn hàng thành công!', 'success');
            renderOrdersPage();
        } catch (error) {
            ToastService.show('Lỗi khi cập nhật đơn hàng: ' + error.message, 'danger');
        } finally {
            LoadingSpinnerService.hide();
        }
    });
};

export const renderEditOrderPage = async (orderId) => {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '';
    LoadingSpinnerService.show();

    try {
        [currentOrder, availableCustomers, priceSettings] = await Promise.all([
            apiService.getOrderById(orderId),
            apiService.getCustomers(),
            apiService.getPricingSettings()
        ]);
    } catch (error) {
        LoadingSpinnerService.hide();
        ToastService.show('Lỗi tải dữ liệu đơn hàng: ' + error.message, 'danger');
        renderOrdersPage();
        return;
    }
    LoadingSpinnerService.hide();

    const statusOptions = [
        { value: 'unpaid', label: 'Chưa thanh toán' },
        { value: 'paid', label: 'Đã thanh toán' }
    ];

    const orderDateStr = new Date(currentOrder.orderDate).toISOString().split('T')[0];

    const initCustomerId = typeof currentOrder.customerId === 'object' ? currentOrder.customerId._id : currentOrder.customerId;
    const initCustomerObj = availableCustomers.find(c => c.id === initCustomerId);
    const initCustomerName = initCustomerObj ? `${initCustomerObj.companyName} (${initCustomerObj.customerCode})` : '';

    mainContent.innerHTML = `
        <div class="p-8 pb-20">
            <div class="flex justify-between items-center mb-6">
                <div class="flex items-center gap-4">
                    <button id="back-to-orders-btn" class="p-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-full transition-colors text-muted" title="Quay lại danh sách">
                        <i data-lucide="arrow-left" class="w-5 h-5"></i>
                    </button>
                    <h1 class="text-3xl font-bold text-text dark:text-white">Sửa Đơn Hàng <span class="text-accent text-xl ml-2">#${orderId.slice(-6)}</span></h1>
                </div>
                <button id="save-edited-order-btn" class="bg-primary text-white hover:bg-opacity-90 font-semibold py-2 px-6 rounded-lg flex items-center shadow-md transition-transform hover:scale-105">
                    <i data-lucide="save" class="mr-2 h-5 w-5"></i> Lưu Thay Đổi
                </button>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div class="xl:col-span-2 space-y-6">
                    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
                        <h2 class="text-lg font-semibold text-text dark:text-white mb-4">Chi Tiết Dịch Vụ</h2>
                        <div id="edit-order-items-container"></div>
                        <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-between items-center border border-gray-100 dark:border-gray-700">
                            <span class="text-sm text-muted hidden sm:inline-block"><i data-lucide="info" class="w-4 h-4 inline mr-1"></i>Sửa số lượng, đơn giá trực tiếp tại bảng</span>
                            <div class="text-right flex-1 sm:flex-none">
                                <span class="text-xl font-medium text-muted mr-2">Tổng Cộng: </span>
                                <span id="edit-total-amount" class="text-2xl font-bold text-accent">0 VNĐ</span>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
                        <label class="block text-sm font-medium text-muted mb-2">Ghi chú đơn hàng</label>
                        <textarea id="edit-order-note" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Khách ghi chú...">${currentOrder.note || ''}</textarea>
                    </div>
                </div>
                <div class="space-y-6">
                    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 space-y-6">
                        <h2 class="text-lg font-semibold text-text dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3">Thông Tin Chung</h2>
                        <div>
                            <label class="block text-sm font-medium text-muted mb-1">Khách hàng</label>
                            <div class="relative w-full">
                                <input type="text" id="edit-customer-search-input" value="${initCustomerName}" class="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="--- Chọn KH ---" autocomplete="off">
                                <div class="absolute inset-y-0 right-0 flex items-center pr-2">
                                    <button id="edit-clear-customer-btn" type="button" class="${initCustomerName ? '' : 'hidden'} p-1 text-gray-400 hover:text-danger focus:outline-none"><i data-lucide="x" class="w-4 h-4"></i></button>
                                    <i data-lucide="chevron-down" class="w-4 h-4 ml-1 text-muted pointer-events-none"></i>
                                </div>
                                <input type="hidden" id="edit-customerId" value="${initCustomerId}">
                                <ul id="edit-customer-dropdown-list" class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg hidden max-h-60 overflow-y-auto"></ul>
                            </div>
                        </div>
                        ${FormInput({ id: 'edit-orderDate', label: 'Ngày tạo đơn', type: 'text', value: orderDateStr })}
                        ${FormSelect({ id: 'edit-status', label: 'Trạng thái', options: statusOptions })}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('edit-status').value = currentOrder.status || 'unpaid';
    lucide.createIcons();
    renderOrderItemsTable();
    setupEditCustomerDropdown();

    // Khởi tạo Flatpickr tiếng Việt cho Ngày tạo đơn
    const editOrderDateEl = document.getElementById('edit-orderDate');
    if (editOrderDateEl && typeof flatpickr !== 'undefined') {
        flatpickr(editOrderDateEl, {
            locale: 'vn',
            dateFormat: 'Y-m-d',
            altInput: true,
            altFormat: 'd/m/Y',
            allowInput: true
        });
    }

    attachEditEventListeners(orderId);
};