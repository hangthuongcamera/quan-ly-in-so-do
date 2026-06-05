import { DataTable } from '../components/DataTable.js';
import { StatsCard } from '../components/StatsCard.js';
import { ModalService } from '../components/ModalService.js';
import { PaymentForm } from '../components/PaymentForm.js';
import { ToastService } from '../components/Toast.js';
import { LoadingSpinnerService } from '../components/LoadingSpinner.js';
import { apiService } from '../services/api.js';

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

// State management for the page
let summaryCurrentPage = 1;
let summaryItemsPerPage = 10;

let historyCurrentPage = 1;
let historyItemsPerPage = 10;

const state = {
    receivables: [],
    payments: [],
    filters: {
        summarySearch: '',
        summaryDebtStatus: '', // '' (all), 'hasDebt', 'noDebt'
        historyCustomerId: '',
        historyStartDate: '',
        historyEndDate: '',
    }
};

const openPaymentModal = async () => {
    LoadingSpinnerService.show();
    const customers = await apiService.getCustomers();
    LoadingSpinnerService.hide();
    const title = 'Ghi nhận Thanh toán';
    const formContent = PaymentForm({}, customers);
    const footerContent = `
        <button id="modal-cancel-btn" class="px-4 py-2 text-sm font-medium text-muted bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg">Hủy</button>
        <button id="modal-save-btn" class="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-opacity-90 rounded-lg ml-2">Lưu Thanh Toán</button>
    `;

    ModalService.open({
        title,
        content: formContent,
        footer: footerContent,
    });

    // --- Thiết lập tìm kiếm khách hàng trong Popup Ghi nhận Thanh toán ---
    const searchInput = document.getElementById('payment-customer-search-input');
    const hiddenSelect = document.getElementById('payment-customerId');
    const dropdownList = document.getElementById('payment-customer-dropdown-list');
    const clearCustomerBtn = document.getElementById('payment-clear-customer-btn');

    const clickOutsideHandler = (e) => {
        if (searchInput && dropdownList && !searchInput.contains(e.target) && !dropdownList.contains(e.target) && !clearCustomerBtn?.contains(e.target)) {
            dropdownList.classList.add('hidden');
            const selectedCustomer = customers.find(c => c.id === hiddenSelect.value);
            if (selectedCustomer) {
                searchInput.value = `${selectedCustomer.companyName || selectedCustomer.contactPerson || ''} (${selectedCustomer.customerCode})`;
            } else {
                searchInput.value = '';
                hiddenSelect.value = '';
            }
            toggleClearBtn();
        }
    };

    const toggleClearBtn = () => {
        if (searchInput && searchInput.value.trim() !== '') {
            clearCustomerBtn?.classList.remove('hidden');
        } else {
            clearCustomerBtn?.classList.add('hidden');
        }
    };

    if (searchInput && hiddenSelect && dropdownList) {
        const renderList = (filterText = '') => {
            const filtered = customers.filter(c => 
                `${c.companyName || c.contactPerson || ''} ${c.customerCode || ''} ${c.phone || ''}`.toLowerCase().includes(filterText.toLowerCase())
            );
            
            if (filtered.length === 0) {
                dropdownList.innerHTML = `<li class="px-3 py-2 text-sm text-gray-500 text-center">Không tìm thấy khách hàng</li>`;
                return;
            }

            dropdownList.innerHTML = filtered.map(c => `
                <li class="px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 text-sm border-b border-gray-100 last:border-0" data-id="${c.id}" data-name="${c.companyName || c.contactPerson || ''} (${c.customerCode})">
                    <div class="font-medium">${c.companyName || c.contactPerson || ''}</div>
                    <div class="text-xs text-muted">Mã: ${c.customerCode} ${c.phone ? `- SĐT: ${c.phone}` : ''}</div>
                </li>
            `).join('');
        };

        searchInput.addEventListener('click', () => { 
            dropdownList.classList.remove('hidden'); 
            renderList(searchInput.value); 
        });
        
        searchInput.addEventListener('input', (e) => { 
            dropdownList.classList.remove('hidden'); 
            hiddenSelect.value = ''; // Reset ID khi người dùng thay đổi chữ nhập
            toggleClearBtn(); 
            renderList(e.target.value); 
        });

        dropdownList.addEventListener('click', (e) => {
            const li = e.target.closest('li[data-id]');
            if (li) {
                hiddenSelect.value = li.dataset.id;
                searchInput.value = li.dataset.name;
                dropdownList.classList.add('hidden');
                toggleClearBtn();
            }
        });

        document.addEventListener('click', clickOutsideHandler);

        clearCustomerBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            searchInput.value = '';
            hiddenSelect.value = '';
            toggleClearBtn();
            dropdownList.classList.remove('hidden');
            renderList('');
            searchInput.focus();
        });

        // Ghi đè phương thức đóng modal để hủy sự kiện clickOutside
        const originalClose = ModalService.close;
        ModalService.close = (onCloseCallback) => {
            document.removeEventListener('click', clickOutsideHandler);
            ModalService.close = originalClose;
            originalClose(onCloseCallback);
        };
    }

    document.getElementById('modal-cancel-btn').addEventListener('click', () => ModalService.close());
    document.getElementById('modal-save-btn').addEventListener('click', async () => {
        const form = document.getElementById('payment-form');
        
        // Kiểm tra xem đã chọn khách hàng hợp lệ chưa
        if (!hiddenSelect || !hiddenSelect.value) {
            ToastService.show('Vui lòng chọn khách hàng từ danh sách gợi ý.', 'warning');
            return;
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        LoadingSpinnerService.show();
        try {
            await apiService.savePayment(data);
            ToastService.show('Đã ghi nhận thanh toán thành công!', 'success');
            ModalService.close();
            renderReceivablesPage(); // Tải lại trang để cập nhật số liệu
        } catch (error) {
            ToastService.show('Lỗi khi ghi nhận thanh toán: ' + error.message, 'danger');
        } finally {
            LoadingSpinnerService.hide();
        }
    });
};

const openRefundModal = async (customerId, refundAmount) => {
    LoadingSpinnerService.show();
    const customers = await apiService.getCustomers();
    LoadingSpinnerService.hide();
    
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const title = `Hoàn trả tiền thừa`;
    
    const formContent = `
        <form id="refund-form" class="space-y-4">
            <input type="hidden" name="customerId" value="${customerId}">
            <div>
                <label class="block text-sm font-medium text-muted mb-1">Khách hàng</label>
                <input type="text" class="w-full text-sm bg-gray-100 border border-gray-200 dark:bg-gray-700 dark:border-gray-600 rounded-lg p-2.5 text-text dark:text-gray-300 cursor-not-allowed" value="${customer.companyName || customer.contactPerson} (${customer.customerCode})" disabled>
            </div>
            <div>
                <label class="block text-sm font-medium text-muted mb-1">Số tiền hoàn trả (VNĐ)</label>
                <input type="number" id="refund-amount" name="amount" class="w-full text-sm bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg p-2.5 text-text dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-accent" value="${refundAmount}" required min="1">
            </div>
            <div>
                <label class="block text-sm font-medium text-muted mb-1">Ghi chú</label>
                <textarea id="refund-note" name="note" class="w-full text-sm bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg p-2.5 text-text dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Ghi chú hoàn tiền..." rows="3">Trả lại tiền thừa cho khách</textarea>
            </div>
        </form>
    `;

    const footerContent = `
        <button id="modal-cancel-btn" class="px-4 py-2 text-sm font-medium text-muted bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg">Hủy</button>
        <button id="modal-save-btn" class="px-4 py-2 text-sm font-medium text-white bg-success hover:bg-opacity-90 rounded-lg ml-2">Lưu Hoàn Tiền</button>
    `;

    ModalService.open({
        title,
        content: formContent,
        footer: footerContent,
    });

    document.getElementById('modal-cancel-btn').addEventListener('click', () => ModalService.close());
    document.getElementById('modal-save-btn').addEventListener('click', async () => {
        const amountVal = parseFloat(document.getElementById('refund-amount').value);
        const noteVal = document.getElementById('refund-note').value;

        if (isNaN(amountVal) || amountVal <= 0) {
            ToastService.show('Vui lòng nhập số tiền hoàn trả hợp lệ.', 'warning');
            return;
        }

        const data = {
            customerId,
            amount: -amountVal, // Đổi sang số âm trước khi lưu vào database
            note: noteVal
        };

        LoadingSpinnerService.show();
        try {
            await apiService.savePayment(data);
            ToastService.show('Đã ghi nhận hoàn trả tiền thừa thành công!', 'success');
            ModalService.close();
            renderReceivablesPage();
        } catch (error) {
            ToastService.show('Lỗi khi lưu hoàn trả tiền: ' + error.message, 'danger');
        } finally {
            LoadingSpinnerService.hide();
        }
    });
};

export const renderReceivablesPage = async () => {
    summaryCurrentPage = 1;
    historyCurrentPage = 1;
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = ''; // Clear previous content
    LoadingSpinnerService.show();

    try {
        state.receivables = await apiService.getReceivables();
    } catch (error) {
        ToastService.show('Không thể tải công nợ: ' + error.message, 'danger');
        LoadingSpinnerService.hide();
        return;
    }

    // Reset payments list on reload to trigger fetch when switching tab
    state.payments = [];

    // Tính toán tổng hợp dựa trên toàn bộ dữ liệu ban đầu
    const totalDebt = state.receivables.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const totalPaid = state.receivables.reduce((sum, item) => sum + (item.paidAmount || 0), 0);
    const totalRemaining = totalDebt - totalPaid;

    const statsData = [
        { title: 'Tổng Công Nợ', value: formatCurrency(totalDebt), icon: 'file-stack', color: 'primary' },
        { title: 'Đã Thanh Toán', value: formatCurrency(totalPaid), icon: 'check-circle', color: 'success' },
        { title: 'Còn Lại', value: formatCurrency(totalRemaining), icon: 'wallet', color: 'danger' },
    ];

    const statsCardsHTML = statsData.map(stat => StatsCard(stat)).join('');

    const pageContent = `
        <div class="p-8">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold text-text dark:text-white">Quản lý Công nợ</h1>
                <button id="record-payment-btn" class="bg-primary text-white hover:bg-opacity-90 font-semibold py-2 px-4 rounded-lg flex items-center shadow-md transition-transform hover:scale-105">
                    <i data-lucide="plus-circle" class="mr-2 h-5 w-5"></i>
                    Ghi nhận Thanh toán
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                ${statsCardsHTML}
            </div>

            <!-- Tab bar -->
            <div class="border-b border-gray-200 dark:border-gray-700 mb-6">
                <ul class="flex flex-wrap -mb-px text-sm font-medium text-center" id="receivables-tabs" role="tablist">
                    <li class="mr-2" role="presentation">
                        <button class="inline-block p-4 border-b-2 border-primary dark:border-white text-primary dark:text-white font-semibold rounded-t-lg active" id="tab-summary-btn" type="button" role="tab">
                            Tổng hợp Công nợ
                        </button>
                    </li>
                    <li class="mr-2" role="presentation">
                        <button class="inline-block p-4 border-b-2 border-transparent text-muted hover:text-text hover:border-gray-300 dark:hover:text-gray-300 rounded-t-lg" id="tab-history-btn" type="button" role="tab">
                            Lịch sử Giao dịch
                        </button>
                    </li>
                </ul>
            </div>
            
            <div id="tab-content-container">
                <div id="receivables-table-container"></div>
            </div>
        </div>
    `;

    mainContent.innerHTML = pageContent;

    const receivablesColumns = [
        { key: 'customerCode', label: 'Mã KH' },
        { key: 'companyName', label: 'Tên Công Ty' },
        { key: 'totalAmount', label: 'Tổng Nợ', hiddenMobile: true },
        { key: 'paidAmount', label: 'Đã Trả', hiddenMobile: true },
        { key: 'remainingAmount', label: 'Còn Lại' },
        { key: 'actions', label: 'Thao Tác' },
    ];

    const renderSummaryTab = () => {
        const container = document.getElementById('tab-content-container');
        if (!container) return;

        // Chỉ render khung bộ lọc 1 lần nếu nó chưa tồn tại
        if (!document.getElementById('summary-search')) {
            container.innerHTML = `
                <!-- Filter Bar for Summary -->
                <div class="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm mb-6 border border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Tìm kiếm khách hàng</label>
                        <input type="text" id="summary-search" placeholder="Nhập mã hoặc tên công ty..." value="${state.filters.summarySearch}" class="w-full text-sm bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg p-2.5 text-text dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-accent" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Tình trạng nợ</label>
                        <select id="summary-debt-status" class="w-full text-sm bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg p-2.5 text-text dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-accent">
                            <option value="" ${state.filters.summaryDebtStatus === '' ? 'selected' : ''}>Tất cả</option>
                            <option value="hasDebt" ${state.filters.summaryDebtStatus === 'hasDebt' ? 'selected' : ''}>Còn nợ</option>
                            <option value="noDebt" ${state.filters.summaryDebtStatus === 'noDebt' ? 'selected' : ''}>Hết nợ</option>
                        </select>
                    </div>
                </div>
                <div id="receivables-table-container"></div>
                <div id="summary-pagination-container" class="mt-4"></div>
            `;

            // Bắt sự kiện bộ lọc
            document.getElementById('summary-search').addEventListener('input', (e) => {
                state.filters.summarySearch = e.target.value;
                summaryCurrentPage = 1;
                renderSummaryTable(); // Chỉ render lại table
            });
            document.getElementById('summary-debt-status').addEventListener('change', (e) => {
                state.filters.summaryDebtStatus = e.target.value;
                summaryCurrentPage = 1;
                renderSummaryTable(); // Chỉ render lại table
            });
        }

        renderSummaryTable();
    };

    const renderSummaryTable = () => {
        const tableContainer = document.getElementById('receivables-table-container');
        const paginationContainer = document.getElementById('summary-pagination-container');
        if (!tableContainer || !paginationContainer) return;

        const filteredSummary = state.receivables.filter(item => {
            if (state.filters.summarySearch) {
                const term = state.filters.summarySearch.toLowerCase().trim();
                const code = (item.customerCode || '').toLowerCase();
                const name = (item.companyName || '').toLowerCase();
                if (!code.includes(term) && !name.includes(term)) return false;
            }

            if (state.filters.summaryDebtStatus) {
                if (state.filters.summaryDebtStatus === 'hasDebt' && item.remainingAmount <= 0) return false;
                if (state.filters.summaryDebtStatus === 'noDebt' && item.remainingAmount > 0) return false;
            }

            return true;
        });

        const totalPages = Math.ceil(filteredSummary.length / summaryItemsPerPage);
        summaryCurrentPage = Math.max(1, Math.min(summaryCurrentPage, totalPages || 1));

        const startIndex = (summaryCurrentPage - 1) * summaryItemsPerPage;
        const paginatedSummary = filteredSummary.slice(startIndex, startIndex + summaryItemsPerPage);

        const formattedData = paginatedSummary.map(item => {
            const hasOverpayment = item.remainingAmount < 0;
            const refundAmount = hasOverpayment ? Math.abs(item.remainingAmount) : 0;

            return {
                ...item,
                totalAmount: formatCurrency(item.totalAmount),
                paidAmount: formatCurrency(item.paidAmount),
                remainingAmount: `<span class="font-bold ${item.remainingAmount > 0 ? 'text-danger' : 'text-success'}">${formatCurrency(item.remainingAmount)}</span>`,
                actions: hasOverpayment ? `
                    <button class="refund-btn bg-success bg-opacity-10 text-success border border-success border-opacity-20 hover:bg-success hover:text-white transition-all text-xs font-semibold py-1 px-3 rounded flex items-center gap-1 mx-auto" data-id="${item.id}" data-amount="${refundAmount}" title="Trả lại tiền thừa cho khách">
                        <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> Hoàn tiền
                    </button>
                ` : `
                    <span class="text-xs text-muted">-</span>
                `
            };
        });

        tableContainer.innerHTML = DataTable({
            columns: receivablesColumns,
            data: formattedData,
            showActions: false
        });

        // Render pagination
        let paginationHTML = '';
        paginationHTML += `<nav class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4" aria-label="Table navigation">`;
        paginationHTML += `
            <span class="text-sm font-normal text-muted">
                Hiển thị 
                <select id="change-summary-items-per-page" class="mx-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-1.5 py-0.5 text-xs text-text dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-accent font-semibold cursor-pointer">
                    <option value="10" ${summaryItemsPerPage === 10 ? 'selected' : ''}>10</option>
                    <option value="50" ${summaryItemsPerPage === 50 ? 'selected' : ''}>50</option>
                    <option value="100" ${summaryItemsPerPage === 100 ? 'selected' : ''}>100</option>
                </select> 
                từ <span class="font-semibold text-text dark:text-white">${filteredSummary.length > 0 ? startIndex + 1 : 0}-${startIndex + paginatedSummary.length}</span> 
                trên <span class="font-semibold text-text dark:text-white">${filteredSummary.length}</span>
            </span>
        `;

        if (totalPages > 1) {
            paginationHTML += `<ul class="inline-flex items-center -space-x-px">`;

            // Previous button
            paginationHTML += `
                <li>
                    <button data-page="${summaryCurrentPage - 1}" class="summary-page-link px-3 py-2 leading-tight bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 rounded-l-lg ${summaryCurrentPage === 1 ? 'pointer-events-none opacity-50' : ''}">
                        Trước
                    </button>
                </li>
            `;

            for (let i = 1; i <= totalPages; i++) {
                const isActive = i === summaryCurrentPage ? 'bg-accent text-white font-semibold' : 'bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700';
                paginationHTML += `<li><button data-page="${i}" class="summary-page-link px-3 py-2 leading-tight ${isActive} border border-gray-300">${i}</button></li>`;
            }

            // Next button
            paginationHTML += `
                <li>
                    <button data-page="${summaryCurrentPage + 1}" class="summary-page-link px-3 py-2 leading-tight bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 rounded-r-lg ${summaryCurrentPage === totalPages ? 'pointer-events-none opacity-50' : ''}">
                        Sau
                    </button>
                </li>
            `;

            paginationHTML += `</ul>`;
        }
        paginationHTML += `</nav>`;
        paginationContainer.innerHTML = paginationHTML;

        // Bắt sự kiện hoàn tiền
        tableContainer.querySelectorAll('.refund-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const customerId = btn.getAttribute('data-id');
                const refundAmount = parseFloat(btn.getAttribute('data-amount')) || 0;
                openRefundModal(customerId, refundAmount);
            });
        });

        // Bắt sự kiện chuyển trang
        paginationContainer.querySelectorAll('.summary-page-link').forEach(link => {
            link.addEventListener('click', () => {
                summaryCurrentPage = parseInt(link.getAttribute('data-page'));
                renderSummaryTable();
            });
        });

        // Bắt sự kiện đổi itemsPerPage
        const select = document.getElementById('change-summary-items-per-page');
        if (select) {
            select.addEventListener('change', (e) => {
                summaryItemsPerPage = parseInt(e.target.value, 10);
                summaryCurrentPage = 1;
                renderSummaryTable();
            });
        }

        lucide.createIcons();
    };

    const renderHistoryTab = async (forceFetch = false) => {
        if (forceFetch || state.payments.length === 0) {
            LoadingSpinnerService.show();
            try {
                state.payments = await apiService.getPayments();
            } catch (error) {
                console.error('Error fetching payments:', error);
                ToastService.show('Không thể tải lịch sử thanh toán.', 'danger');
            } finally {
                LoadingSpinnerService.hide();
            }
        }

        const container = document.getElementById('tab-content-container');
        if (!container) return;

        // Chỉ render khung bộ lọc 1 lần nếu nó chưa tồn tại
        if (!document.getElementById('payments-history-table-container')) {
            container.innerHTML = `
                <!-- Filter Bar for History -->
                <div class="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm mb-6 border border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Khách hàng</label>
                        <select id="history-filter-customer" class="w-full text-sm bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg p-2.5 text-text dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-accent">
                            <option value="">Tất cả khách hàng</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Từ ngày</label>
                        <div class="relative">
                            <input type="text" id="history-filter-start" class="w-full text-sm bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg p-2.5 pr-10 text-text dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer" placeholder="Chọn ngày..." readonly />
                            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted">
                                <i data-lucide="calendar" class="w-4 h-4"></i>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Đến ngày</label>
                        <div class="relative">
                            <input type="text" id="history-filter-end" class="w-full text-sm bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg p-2.5 pr-10 text-text dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer" placeholder="Chọn ngày..." readonly />
                            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted">
                                <i data-lucide="calendar" class="w-4 h-4"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="payments-history-table-container"></div>
                <div id="history-pagination-container" class="mt-4"></div>
            `;

            // Đổ danh sách khách hàng vào bộ lọc lịch sử
            const customerSelect = document.getElementById('history-filter-customer');
            if (customerSelect) {
                try {
                    const customers = await apiService.getCustomers();
                    customers.forEach(c => {
                        const opt = document.createElement('option');
                        opt.value = c.id;
                        opt.textContent = `${c.companyName || c.contactPerson} (${c.customerCode})`;
                        if (c.id === state.filters.historyCustomerId) {
                            opt.selected = true;
                        }
                        customerSelect.appendChild(opt);
                    });
                } catch (err) {
                    console.error(err);
                }
            }

            // Bắt sự kiện bộ lọc lịch sử
            document.getElementById('history-filter-customer').addEventListener('change', (e) => {
                state.filters.historyCustomerId = e.target.value;
                historyCurrentPage = 1;
                renderHistoryTable();
            });

            const startInput = document.getElementById('history-filter-start');
            const endInput = document.getElementById('history-filter-end');

            if (typeof flatpickr !== 'undefined') {
                flatpickr(startInput, {
                    locale: 'vn',
                    dateFormat: 'Y-m-d',
                    altInput: true,
                    altFormat: 'd/m/Y',
                    allowInput: true,
                    defaultDate: state.filters.historyStartDate || '',
                    onChange: (selectedDates, dateStr) => {
                        state.filters.historyStartDate = dateStr;
                        historyCurrentPage = 1;
                        renderHistoryTable();
                    }
                });
                flatpickr(endInput, {
                    locale: 'vn',
                    dateFormat: 'Y-m-d',
                    altInput: true,
                    altFormat: 'd/m/Y',
                    allowInput: true,
                    defaultDate: state.filters.historyEndDate || '',
                    onChange: (selectedDates, dateStr) => {
                        state.filters.historyEndDate = dateStr;
                        historyCurrentPage = 1;
                        renderHistoryTable();
                    }
                });
            } else {
                startInput.addEventListener('input', (e) => {
                    state.filters.historyStartDate = e.target.value;
                    historyCurrentPage = 1;
                    renderHistoryTable();
                });
                endInput.addEventListener('input', (e) => {
                    state.filters.historyEndDate = e.target.value;
                    historyCurrentPage = 1;
                    renderHistoryTable();
                });
            }
        }

        renderHistoryTable();
    };

    const renderHistoryTable = () => {
        const tableContainer = document.getElementById('payments-history-table-container');
        const paginationContainer = document.getElementById('history-pagination-container');
        if (!tableContainer || !paginationContainer) return;

        const filteredHistory = state.payments.filter(payment => {
            if (state.filters.historyCustomerId && (!payment.customerId || payment.customerId._id !== state.filters.historyCustomerId)) {
                return false;
            }

            if (state.filters.historyStartDate || state.filters.historyEndDate) {
                if (!payment.rawPaymentDate) return false;
                const payDate = new Date(payment.rawPaymentDate);
                payDate.setHours(0, 0, 0, 0);

                if (state.filters.historyStartDate) {
                    const start = new Date(state.filters.historyStartDate);
                    start.setHours(0, 0, 0, 0);
                    if (payDate < start) return false;
                }

                if (state.filters.historyEndDate) {
                    const end = new Date(state.filters.historyEndDate);
                    end.setHours(23, 59, 59, 999);
                    if (payDate > end) return false;
                }
            }

            return true;
        });

        const totalPages = Math.ceil(filteredHistory.length / historyItemsPerPage);
        historyCurrentPage = Math.max(1, Math.min(historyCurrentPage, totalPages || 1));

        const startIndex = (historyCurrentPage - 1) * historyItemsPerPage;
        const paginatedHistory = filteredHistory.slice(startIndex, startIndex + historyItemsPerPage);

        const historyColumns = [
            { key: 'customerName', label: 'Khách Hàng' },
            { key: 'paymentDate', label: 'Ngày Thanh Toán' },
            { key: 'amount', label: 'Số Tiền' },
            { key: 'note', label: 'Ghi Chú', hiddenMobile: true }
        ];

        tableContainer.innerHTML = DataTable({
            columns: historyColumns,
            data: paginatedHistory,
            showActions: false
        });

        // Render pagination
        let paginationHTML = '';
        paginationHTML += `<nav class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4" aria-label="Table navigation">`;
        paginationHTML += `
            <span class="text-sm font-normal text-muted">
                Hiển thị 
                <select id="change-history-items-per-page" class="mx-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-1.5 py-0.5 text-xs text-text dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-accent font-semibold cursor-pointer">
                    <option value="10" ${historyItemsPerPage === 10 ? 'selected' : ''}>10</option>
                    <option value="50" ${historyItemsPerPage === 50 ? 'selected' : ''}>50</option>
                    <option value="100" ${historyItemsPerPage === 100 ? 'selected' : ''}>100</option>
                </select> 
                từ <span class="font-semibold text-text dark:text-white">${filteredHistory.length > 0 ? startIndex + 1 : 0}-${startIndex + paginatedHistory.length}</span> 
                trên <span class="font-semibold text-text dark:text-white">${filteredHistory.length}</span>
            </span>
        `;

        if (totalPages > 1) {
            paginationHTML += `<ul class="inline-flex items-center -space-x-px">`;

            // Previous button
            paginationHTML += `
                <li>
                    <button data-page="${historyCurrentPage - 1}" class="history-page-link px-3 py-2 leading-tight bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 rounded-l-lg ${historyCurrentPage === 1 ? 'pointer-events-none opacity-50' : ''}">
                        Trước
                    </button>
                </li>
            `;

            for (let i = 1; i <= totalPages; i++) {
                const isActive = i === historyCurrentPage ? 'bg-accent text-white font-semibold' : 'bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700';
                paginationHTML += `<li><button data-page="${i}" class="history-page-link px-3 py-2 leading-tight ${isActive} border border-gray-300">${i}</button></li>`;
            }

            // Next button
            paginationHTML += `
                <li>
                    <button data-page="${historyCurrentPage + 1}" class="history-page-link px-3 py-2 leading-tight bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 rounded-r-lg ${historyCurrentPage === totalPages ? 'pointer-events-none opacity-50' : ''}">
                        Sau
                    </button>
                </li>
            `;

            paginationHTML += `</ul>`;
        }
        paginationHTML += `</nav>`;
        paginationContainer.innerHTML = paginationHTML;

        // Bắt sự kiện chuyển trang
        paginationContainer.querySelectorAll('.history-page-link').forEach(link => {
            link.addEventListener('click', () => {
                historyCurrentPage = parseInt(link.getAttribute('data-page'));
                renderHistoryTable();
            });
        });

        // Bắt sự kiện đổi itemsPerPage
        const select = document.getElementById('change-history-items-per-page');
        if (select) {
            select.addEventListener('change', (e) => {
                historyItemsPerPage = parseInt(e.target.value, 10);
                historyCurrentPage = 1;
                renderHistoryTable();
            });
        }

        lucide.createIcons();
    };

    LoadingSpinnerService.hide();
    
    // Mặc định render tab Tổng hợp
    renderSummaryTab();

    // Sự kiện chuyển tab
    const tabSummaryBtn = document.getElementById('tab-summary-btn');
    const tabHistoryBtn = document.getElementById('tab-history-btn');

    tabSummaryBtn.addEventListener('click', () => {
        tabSummaryBtn.className = "inline-block p-4 border-b-2 border-primary dark:border-white text-primary dark:text-white font-semibold rounded-t-lg active";
        tabHistoryBtn.className = "inline-block p-4 border-b-2 border-transparent text-muted hover:text-text hover:border-gray-300 dark:hover:text-gray-300 rounded-t-lg";
        
        summaryCurrentPage = 1;
        // Reset container tab trước khi chuyển để vẽ lại layout bộ lọc của tab đó
        const container = document.getElementById('tab-content-container');
        if (container) container.innerHTML = '';

        renderSummaryTab();
    });

    tabHistoryBtn.addEventListener('click', () => {
        tabHistoryBtn.className = "inline-block p-4 border-b-2 border-primary dark:border-white text-primary dark:text-white font-semibold rounded-t-lg active";
        tabSummaryBtn.className = "inline-block p-4 border-b-2 border-transparent text-muted hover:text-text hover:border-gray-300 dark:hover:text-gray-300 rounded-t-lg";
        
        historyCurrentPage = 1;
        // Reset container tab trước khi chuyển để vẽ lại layout bộ lọc của tab đó
        const container = document.getElementById('tab-content-container');
        if (container) container.innerHTML = '';

        renderHistoryTab();
    });

    document.getElementById('record-payment-btn').addEventListener('click', openPaymentModal);
};