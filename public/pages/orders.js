import { DataTable } from '../components/DataTable.js';
import { LoadingSpinnerService } from '../components/LoadingSpinner.js';
import { ToastService } from '../components/Toast.js';
import { apiService } from '../services/api.js';
import { ModalService } from '../components/ModalService.js';
import { ConfirmDialogService } from '../components/ConfirmDialog.js';
import { renderEditOrderPage } from './edit-order.js';
import { renderOrderDetailsPage } from './order-details.js';

// State management for the page
let currentPage = 1;
let itemsPerPage = 10;

const state = {
    allOrders: [],
    filters: {
        customerId: '',
        serviceType: '',
        status: '',
        startDate: '',
        endDate: '',
    }
};

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

// Helper map trạng thái sang tiếng Việt và màu sắc
const getStatusBadge = (status) => {
    const statusMap = {
        'unpaid': { label: 'Chưa thanh toán', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
        'paid': { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    };
    
    const mappedStatus = statusMap[status] || statusMap['unpaid'];
    
    return `<span class="px-2.5 py-1 text-xs font-semibold rounded-full ${mappedStatus.color}">
                ${mappedStatus.label}
            </span>`;
};

const getFilteredOrders = () => {
    return state.allOrders.filter(order => {
        // Lọc khách hàng
        if (state.filters.customerId && (!order.customerId || order.customerId._id !== state.filters.customerId)) {
            return false;
        }

        // Lọc dịch vụ
        if (state.filters.serviceType) {
            const hasService = order.items && order.items.some(item => item.serviceType === state.filters.serviceType);
            if (!hasService) return false;
        }

        // Lọc trạng thái
        if (state.filters.status && order.status !== state.filters.status) {
            return false;
        }

        // Lọc thời gian (từ ngày - đến ngày)
        if (state.filters.startDate || state.filters.endDate) {
            if (!order.rawOrderDate) return false;
            const orderDate = new Date(order.rawOrderDate);
            orderDate.setHours(0, 0, 0, 0); // Reset giờ

            if (state.filters.startDate) {
                const start = new Date(state.filters.startDate);
                start.setHours(0, 0, 0, 0);
                if (orderDate < start) return false;
            }

            if (state.filters.endDate) {
                const end = new Date(state.filters.endDate);
                end.setHours(23, 59, 59, 999);
                if (orderDate > end) return false;
            }
        }

        return true;
    });
};

const renderOrdersTable = () => {
    const tableContainer = document.getElementById('orders-table-container');
    const paginationContainer = document.getElementById('pagination-container');
    if (!tableContainer || !paginationContainer) return;

    const orderColumns = [
        { key: 'orderDate', label: 'Ngày Đơn Hàng', hiddenMobile: true },
        { key: 'customerName', label: 'Khách Hàng' },
        { key: 'totalAmount', label: 'Tổng Tiền' },
        { key: 'status', label: 'Trạng Thái' },
        { key: 'note', label: 'Ghi Chú', hiddenMobile: true },
        { key: 'actions', label: 'Thao Tác' },
    ];

    const filtered = getFilteredOrders();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    currentPage = Math.max(1, Math.min(currentPage, totalPages || 1));

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedOrders = filtered.slice(startIndex, startIndex + itemsPerPage);

    // Chèn HTML badge trạng thái và các nút Action trực tiếp (Có khóa sửa nếu đã thanh toán)
    const formattedOrders = paginatedOrders.map(order => {
        const isLocked = (order.paidAmount || 0) > 0 || order.status === 'paid';
        
        return {
            ...order,
            status: getStatusBadge(order.status),
            actions: `
                <div class="flex items-center justify-end space-x-3">
                    <button class="view-btn text-blue-500 hover:text-blue-700 p-1 transition-transform hover:scale-110" data-id="${order.id}" title="Xem chi tiết"><i data-lucide="eye" class="w-4 h-4"></i></button>
                    ${isLocked ? `
                        <button class="text-gray-400 dark:text-gray-600 cursor-not-allowed p-1" title="Đơn đã được thanh toán (Khóa sửa)"><i data-lucide="lock" class="w-4 h-4"></i></button>
                    ` : `
                        <button class="edit-btn text-yellow-500 hover:text-yellow-700 p-1 transition-transform hover:scale-110" data-id="${order.id}" title="Sửa đơn hàng"><i data-lucide="edit" class="w-4 h-4"></i></button>
                    `}
                    <button class="delete-btn text-red-500 hover:text-red-700 p-1 transition-transform hover:scale-110" data-id="${order.id}" title="Xóa"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            `
        };
    });

    // showActions: false để DataTable không sinh ra nút mặc định, thay vào đó ta dùng cột 'actions' tự tạo ở trên
    tableContainer.innerHTML = DataTable({ columns: orderColumns, data: formattedOrders, showActions: false });

    // Render pagination
    let paginationHTML = '';
    paginationHTML += `<nav class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4" aria-label="Table navigation">`;
    paginationHTML += `
        <span class="text-sm font-normal text-muted">
            Hiển thị 
            <select id="change-items-per-page" class="mx-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-1.5 py-0.5 text-xs text-text dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-accent font-semibold cursor-pointer">
                <option value="10" ${itemsPerPage === 10 ? 'selected' : ''}>10</option>
                <option value="50" ${itemsPerPage === 50 ? 'selected' : ''}>50</option>
                <option value="100" ${itemsPerPage === 100 ? 'selected' : ''}>100</option>
            </select> 
            từ <span class="font-semibold text-text dark:text-white">${filtered.length > 0 ? startIndex + 1 : 0}-${startIndex + paginatedOrders.length}</span> 
            trên <span class="font-semibold text-text dark:text-white">${filtered.length}</span>
        </span>
    `;

    if (totalPages > 1) {
        paginationHTML += `<ul class="inline-flex items-center -space-x-px">`;

        // Previous button
        paginationHTML += `
            <li>
                <button data-page="${currentPage - 1}" class="page-link px-3 py-2 leading-tight bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 rounded-l-lg ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}">
                    Trước
                </button>
            </li>
        `;

        for (let i = 1; i <= totalPages; i++) {
            const isActive = i === currentPage ? 'bg-accent text-white font-semibold' : 'bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700';
            paginationHTML += `<li><button data-page="${i}" class="page-link px-3 py-2 leading-tight ${isActive} border border-gray-300">${i}</button></li>`;
        }

        // Next button
        paginationHTML += `
            <li>
                <button data-page="${currentPage + 1}" class="page-link px-3 py-2 leading-tight bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 rounded-r-lg ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}">
                    Sau
                </button>
            </li>
        `;

        paginationHTML += `</ul>`;
    }
    paginationHTML += `</nav>`;
    paginationContainer.innerHTML = paginationHTML;

    lucide.createIcons();
};

const attachOrdersEventListeners = () => {
    const container = document.getElementById('orders-page-container');
    if (!container) return;

    container.addEventListener('click', async (e) => {
        // Nút "Xem chi tiết" sẽ mở ra chi tiết đơn hàng
        const viewBtn = e.target.closest('.view-btn');
        if (viewBtn) {
            const orderId = viewBtn.getAttribute('data-id');
            renderOrderDetailsPage(orderId);
            return;
        }

        // Nút "Sửa đơn hàng" sẽ chuyển hướng trang
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
            const orderId = editBtn.getAttribute('data-id');
            renderEditOrderPage(orderId);
            return;
        }

        // Nút "Xóa"
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            const orderId = deleteBtn.getAttribute('data-id');
            const confirmed = await ConfirmDialogService.show({
                title: 'Xác nhận Xóa',
                message: 'Bạn có chắc chắn muốn xóa đơn hàng này? Hành động này không thể hoàn tác.',
                confirmText: 'Xóa',
                confirmButtonClass: 'bg-danger text-white hover:bg-opacity-90'
            });

            if (confirmed) {
                LoadingSpinnerService.show();
                try {
                    await apiService.deleteOrder(orderId);
                    ToastService.show('Đã xóa đơn hàng thành công.', 'info');
                    // Tải lại danh sách và render lại bảng
                    state.allOrders = await apiService.getOrders();
                    renderOrdersTable();
                } catch (error) {
                    ToastService.show('Lỗi khi xóa đơn hàng: ' + error.message, 'danger');
                } finally {
                    LoadingSpinnerService.hide();
                }
            }
            return;
        }

        // Xử lý chuyển trang phân trang
        const pageLink = e.target.closest('.page-link');
        if (pageLink) {
            currentPage = parseInt(pageLink.getAttribute('data-page'));
            renderOrdersTable();
            return;
        }
    });

    // Lắng nghe sự kiện thay đổi số bản ghi hiển thị trên mỗi trang
    container.addEventListener('change', (e) => {
        const select = e.target.closest('#change-items-per-page');
        if (select) {
            itemsPerPage = parseInt(select.value, 10);
            currentPage = 1; // Reset về trang 1
            renderOrdersTable();
        }
    });
};

const clearAllFilters = () => {
    state.filters = {
        customerId: '',
        serviceType: '',
        status: '',
        startDate: '',
        endDate: '',
    };
    currentPage = 1;

    // Reset customer search dropdown
    const customerInput = document.getElementById('filter-customer-search-input');
    const customerIdInput = document.getElementById('filter-customer-id');
    const customerClearBtn = document.getElementById('filter-clear-customer-btn');
    if (customerInput) customerInput.value = '';
    if (customerIdInput) customerIdInput.value = '';
    if (customerClearBtn) customerClearBtn.classList.add('hidden');

    // Reset standard filters
    const serviceSelect = document.getElementById('filter-service');
    const statusSelect = document.getElementById('filter-status');
    const startDateInput = document.getElementById('filter-start-date');
    const endDateInput = document.getElementById('filter-end-date');

    if (serviceSelect) serviceSelect.value = '';
    if (statusSelect) statusSelect.value = '';
    
    if (startDateInput) {
        if (startDateInput._flatpickr) startDateInput._flatpickr.clear();
        else startDateInput.value = '';
    }
    if (endDateInput) {
        if (endDateInput._flatpickr) endDateInput._flatpickr.clear();
        else endDateInput.value = '';
    }

    renderOrdersTable();
};

const attachFilterListeners = () => {
    const bindFilter = (id, stateKey) => {
        const el = document.getElementById(id);
        if (el) {
            if (typeof flatpickr !== 'undefined' && (id === 'filter-start-date' || id === 'filter-end-date')) {
                flatpickr(el, {
                    locale: 'vn',
                    dateFormat: 'Y-m-d',
                    altInput: true,
                    altFormat: 'd/m/Y',
                    allowInput: true,
                    defaultDate: state.filters[stateKey] || '',
                    onChange: (selectedDates, dateStr) => {
                        state.filters[stateKey] = dateStr;
                        currentPage = 1;
                        renderOrdersTable();
                    }
                });
            } else {
                el.addEventListener('change', (e) => {
                    state.filters[stateKey] = e.target.value;
                    currentPage = 1;
                    renderOrdersTable();
                });
                if (el.tagName === 'INPUT') {
                    el.addEventListener('input', (e) => {
                        state.filters[stateKey] = e.target.value;
                        currentPage = 1;
                        renderOrdersTable();
                    });
                }
            }
        }
    };

    bindFilter('filter-service', 'serviceType');
    bindFilter('filter-status', 'status');
    bindFilter('filter-start-date', 'startDate');
    bindFilter('filter-end-date', 'endDate');

    const clearBtn = document.getElementById('clear-all-filters-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllFilters);
    }
};

const setupFilterCustomerDropdown = (customers) => {
    const input = document.getElementById('filter-customer-search-input');
    const hiddenSelect = document.getElementById('filter-customer-id');
    const list = document.getElementById('filter-customer-dropdown-list');
    const clearBtn = document.getElementById('filter-clear-customer-btn');

    if (!input || !hiddenSelect || !list) return;

    const toggleClearBtn = () => {
        if (input.value.trim() !== '') {
            clearBtn?.classList.remove('hidden');
        } else {
            clearBtn?.classList.add('hidden');
        }
    };

    const renderList = (filterText = '') => {
        const filtered = customers.filter(c => 
            `${c.companyName || c.contactPerson || ''} ${c.customerCode} ${c.phone || ''}`.toLowerCase().includes(filterText.toLowerCase())
        );
        
        if (filtered.length === 0) {
            list.innerHTML = `<li class="px-3 py-2 text-sm text-gray-500 text-center">Không tìm thấy khách hàng</li>`;
            return;
        }

        let listHTML = '';
        if (filterText === '') {
            listHTML += `
                <li class="px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 text-sm border-b border-gray-100 last:border-0 font-semibold" data-id="" data-name="Tất cả khách hàng">
                    <div class="font-medium text-primary">Tất cả khách hàng</div>
                </li>
            `;
        }

        listHTML += filtered.map(c => `
            <li class="px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 text-sm border-b border-gray-100 last:border-0" data-id="${c.id}" data-name="${c.companyName || c.contactPerson} (${c.customerCode})">
                <div class="font-medium">${c.companyName || c.contactPerson}</div>
                <div class="text-xs text-muted">Mã: ${c.customerCode} ${c.phone ? `- SĐT: ${c.phone}` : ''}</div>
            </li>
        `).join('');

        list.innerHTML = listHTML;
    };

    // Set initial value if state already has a selected customerId
    if (state.filters.customerId) {
        const selectedCustomer = customers.find(c => c.id === state.filters.customerId);
        if (selectedCustomer) {
            input.value = `${selectedCustomer.companyName || selectedCustomer.contactPerson} (${selectedCustomer.customerCode})`;
            hiddenSelect.value = state.filters.customerId;
            clearBtn?.classList.remove('hidden');
        }
    }

    input.addEventListener('click', () => { 
        list.classList.remove('hidden'); 
        renderList(input.value); 
    });
    
    input.addEventListener('input', (e) => { 
        list.classList.remove('hidden'); 
        toggleClearBtn(); 
        renderList(e.target.value); 
    });

    list.addEventListener('click', (e) => {
        const li = e.target.closest('li[data-id]');
        if (li) {
            const id = li.dataset.id;
            hiddenSelect.value = id;
            input.value = li.dataset.name === "Tất cả khách hàng" ? "" : li.dataset.name;
            list.classList.add('hidden');
            toggleClearBtn();
            
            state.filters.customerId = id;
            currentPage = 1;
            renderOrdersTable();
        }
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !list.contains(e.target) && !clearBtn?.contains(e.target)) {
            list.classList.add('hidden');
            const selectedCustomer = customers.find(c => c.id === hiddenSelect.value);
            if (selectedCustomer) {
                input.value = `${selectedCustomer.companyName || selectedCustomer.contactPerson} (${selectedCustomer.customerCode})`;
            } else {
                input.value = '';
            }
            toggleClearBtn();
        }
    });

    clearBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        input.value = ''; 
        hiddenSelect.value = ''; 
        toggleClearBtn();
        list.classList.add('hidden');
        
        state.filters.customerId = '';
        currentPage = 1;
        renderOrdersTable();
    });

    lucide.createIcons();
};

export const renderOrdersPage = async () => {
    currentPage = 1;
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div id="orders-page-container" class="p-8">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h1 class="text-3xl font-bold text-text dark:text-white">Quản lý Đơn hàng</h1>
            </div>

            <!-- Bộ lọc đơn hàng -->
            <div class="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm mb-6 border border-gray-100 dark:border-gray-800">
                <div class="flex justify-between items-center mb-4 pb-2 border-b border-gray-50 dark:border-gray-800">
                    <h2 class="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1"><i data-lucide="sliders-horizontal" class="w-3.5 h-3.5"></i> Bộ lọc tìm kiếm</h2>
                    <button id="clear-all-filters-btn" class="text-xs font-semibold text-danger hover:text-opacity-80 flex items-center gap-1 transition-colors hover:scale-105 active:scale-95 duration-150">
                        <i data-lucide="filter-x" class="w-3.5 h-3.5"></i> Xóa bộ lọc
                    </button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <!-- Lọc Khách Hàng -->
                    <div>
                        <label class="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Khách hàng</label>
                        <div class="relative w-full">
                            <input type="text" id="filter-customer-search-input" class="w-full text-sm bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg p-2.5 pr-8 text-text dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Nhập tên/mã KH..." autocomplete="off">
                            <div class="absolute inset-y-0 right-0 flex items-center pr-2">
                                <button id="filter-clear-customer-btn" type="button" class="hidden p-1 text-gray-400 hover:text-danger focus:outline-none"><i data-lucide="x" class="w-4 h-4"></i></button>
                                <i data-lucide="chevron-down" class="w-4 h-4 ml-1 text-muted pointer-events-none"></i>
                            </div>
                            <input type="hidden" id="filter-customer-id" value="">
                            <ul id="filter-customer-dropdown-list" class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg hidden max-h-60 overflow-y-auto"></ul>
                        </div>
                    </div>

                    <!-- Lọc Dịch Vụ -->
                    <div>
                        <label class="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Dịch vụ</label>
                        <select id="filter-service" class="w-full text-sm bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg p-2.5 text-text dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-accent">
                            <option value="">Tất cả dịch vụ</option>
                            <option value="marker">Chạy sơ đồ (Auto Marker)</option>
                            <option value="grading">Nhảy size (Grading)</option>
                            <option value="design">Thiết kế rập (Pattern Design)</option>
                            <option value="digitizing">Nhập rập (Pattern Digitizing)</option>
                        </select>
                    </div>

                    <!-- Lọc Trạng Thái -->
                    <div>
                        <label class="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Trạng thái</label>
                        <select id="filter-status" class="w-full text-sm bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg p-2.5 text-text dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-accent">
                            <option value="">Tất cả trạng thái</option>
                            <option value="unpaid">Chưa thanh toán</option>
                            <option value="paid">Đã thanh toán</option>
                        </select>
                    </div>

                    <!-- Lọc Từ Ngày -->
                    <div>
                        <label class="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Từ ngày</label>
                        <div class="relative">
                            <input type="text" id="filter-start-date" class="w-full text-sm bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg p-2.5 pr-10 text-text dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer" placeholder="Chọn ngày..." readonly />
                            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted">
                                <i data-lucide="calendar" class="w-4 h-4"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Lọc Đến Ngày -->
                    <div>
                        <label class="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Đến ngày</label>
                        <div class="relative">
                            <input type="text" id="filter-end-date" class="w-full text-sm bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg p-2.5 pr-10 text-text dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer" placeholder="Chọn ngày..." readonly />
                            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted">
                                <i data-lucide="calendar" class="w-4 h-4"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="orders-table-container"></div>
            <div id="pagination-container" class="mt-4"></div>
        </div>
    `;

    attachOrdersEventListeners();
    attachFilterListeners();

    LoadingSpinnerService.show();
    try {
        state.allOrders = await apiService.getOrders();
        renderOrdersTable();

        // Nạp danh sách khách hàng vào bộ lọc
        const customers = await apiService.getCustomers();
        setupFilterCustomerDropdown(customers);
    } catch (error) {
        ToastService.show('Không thể tải danh sách đơn hàng: ' + error.message, 'danger');
    } finally {
        LoadingSpinnerService.hide();
    }
};