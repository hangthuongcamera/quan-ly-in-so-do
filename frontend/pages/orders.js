import { DataTable } from '../components/DataTable.js';
import { mockOrders, mockCustomers } from '../js/mockData.js';

// State for filters and pagination
const state = {
    filters: {
        customerId: '',
        serviceType: '',
        status: '',
        startDate: '',
        endDate: '',
    },
    currentPage: 1,
    itemsPerPage: 10,
    get filteredOrders() {
        let orders = mockOrders;

        if (this.filters.customerId) {
            orders = orders.filter(o => o.customerId == this.filters.customerId);
        }
        if (this.filters.serviceType) {
            orders = orders.filter(o => o.serviceType === this.filters.serviceType);
        }
        if (this.filters.status) {
            orders = orders.filter(o => o.status === this.filters.status);
        }
        // Date filtering would be more complex, skipping for this mock-up
        
        return orders;
    }
};

// Render the table and pagination
const renderOrdersTable = () => {
    const tableContainer = document.getElementById('orders-table-container');
    if (!tableContainer) return;

    const orders = state.filteredOrders;
    // For now, we won't implement pagination on this page to keep it simple,
    // but the structure is ready for it.
    
    const orderColumns = [
        { key: 'orderCode', label: 'Mã ĐH' },
        { key: 'customerName', label: 'Khách Hàng' },
        { key: 'serviceLabel', label: 'Loại Dịch Vụ' },
        { key: 'description', label: 'Mô Tả' },
        { key: 'amount', label: 'Thành Tiền' },
        { key: 'orderDate', label: 'Ngày Tạo' },
        { key: 'statusLabel', label: 'Trạng Thái' },
    ];

    const formattedData = orders.map(order => ({
        ...order,
        amount: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.amount),
    }));

    // We'll reuse the DataTable but won't show actions for now
    tableContainer.innerHTML = DataTable({ columns: orderColumns, data: formattedData, showActions: false });
    lucide.createIcons();
};

// Attach event listeners for filters
const attachFilterEventListeners = () => {
    const customerFilter = document.getElementById('customer-filter');
    const serviceFilter = document.getElementById('service-filter');
    const statusFilter = document.getElementById('status-filter');

    const applyFilters = () => {
        state.filters.customerId = customerFilter.value;
        state.filters.serviceType = serviceFilter.value;
        state.filters.status = statusFilter.value;
        renderOrdersTable();
    };

    customerFilter.addEventListener('change', applyFilters);
    serviceFilter.addEventListener('change', applyFilters);
    statusFilter.addEventListener('change', applyFilters);
};

// Main render function for the page
export const renderOrdersPage = () => {
    const mainContent = document.getElementById('main-content');

    const customerOptions = [
        { value: '', label: 'Tất cả khách hàng' },
        ...mockCustomers.map(c => ({ value: c.id, label: c.companyName }))
    ].map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');

    const serviceOptions = [
        { value: '', label: 'Tất cả dịch vụ' },
        { value: 'marker', label: 'Chạy sơ đồ' },
        { value: 'grading', label: 'Nhảy size' },
        { value: 'design', label: 'Thiết kế rập' },
        { value: 'digitizing', label: 'Nhập rập' },
    ].map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');

    const statusOptions = [
        { value: '', label: 'Tất cả trạng thái' },
        { value: 'pending', label: 'Đang xử lý' },
        { value: 'completed', label: 'Hoàn thành' },
        { value: 'invoiced', label: 'Đã xuất HĐ' },
        { value: 'paid', label: 'Đã thanh toán' },
    ].map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');

    mainContent.innerHTML = `
        <div class="p-8">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold text-text dark:text-white">Quản lý Đơn hàng</h1>
            </div>

            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 mb-6">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label for="customer-filter" class="text-sm font-medium text-muted">Khách hàng</label>
                        <select id="customer-filter" class="mt-1 block w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-accent focus:border-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white">${customerOptions}</select>
                    </div>
                    <div>
                        <label for="service-filter" class="text-sm font-medium text-muted">Loại dịch vụ</label>
                        <select id="service-filter" class="mt-1 block w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-accent focus:border-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white">${serviceOptions}</select>
                    </div>
                    <div>
                        <label for="status-filter" class="text-sm font-medium text-muted">Trạng thái</label>
                        <select id="status-filter" class="mt-1 block w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-accent focus:border-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white">${statusOptions}</select>
                    </div>
                    <div>
                        <label class="text-sm font-medium text-muted">Khoảng thời gian</label>
                        <div class="mt-1 flex items-center justify-center p-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white">(Chưa triển khai)</div>
                    </div>
                </div>
            </div>
            
            <div id="orders-table-container"></div>
        </div>
    `;

    attachFilterEventListeners();
    renderOrdersTable(); // Initial render
};