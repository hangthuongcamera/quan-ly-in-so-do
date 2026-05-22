import { DataTable } from '../components/DataTable.js';
import { ModalService } from '../components/ModalService.js';
import { CustomerForm } from '../components/CustomerForm.js';
import { ToastService } from '../components/Toast.js';
import { ConfirmDialogService } from '../components/ConfirmDialog.js';
import { LoadingSpinnerService } from '../components/LoadingSpinner.js';
import { apiService } from '../services/api.js';
import { mockCustomers } from '../js/mockData.js'; // Keep for form dropdowns for now

let currentPage = 1;
const ITEMS_PER_PAGE = 5; // Số khách hàng trên mỗi trang

// Quản lý trạng thái tìm kiếm và dữ liệu đã lọc
const state = {
    searchQuery: '',
    allCustomers: [], // Store all customers fetched from API
    get filteredCustomers() {
        if (!this.searchQuery) {
            return this.allCustomers;
        }
        return this.allCustomers.filter(customer =>
            Object.values(customer).some(val =>
                String(val).toLowerCase().includes(this.searchQuery.toLowerCase())
            )
        );
    }
};

const openCustomerModal = (customerId) => {
    const isEdit = customerId !== undefined;
    const customer = isEdit ? state.allCustomers.find(c => c.id === customerId) : {};
    const title = isEdit ? 'Chỉnh sửa Khách hàng' : 'Thêm Khách hàng mới';

    const formContent = CustomerForm(customer);
    const footerContent = `
        <button id="modal-cancel-btn" class="px-4 py-2 text-sm font-medium text-muted bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg">Hủy</button>
        <button id="modal-save-btn" class="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-opacity-90 rounded-lg ml-2">Lưu</button>
    `;

    ModalService.open({
        title,
        content: formContent,
        footer: footerContent,
    });

    // Gắn sự kiện cho các nút trong modal
    document.getElementById('modal-cancel-btn').addEventListener('click', () => ModalService.close());
    document.getElementById('modal-save-btn').addEventListener('click', async () => {
        const form = document.getElementById('customer-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        LoadingSpinnerService.show();
        await apiService.saveCustomer(data); // Call the API
        LoadingSpinnerService.hide();

        ToastService.show(isEdit ? 'Cập nhật khách hàng thành công!' : 'Đã thêm khách hàng mới!', 'success');
        ModalService.close();
        
        // Re-fetch and re-render the page to show changes
        renderCustomersPage();
    });
};

// Gắn sự kiện cho các nút Sửa/Xóa trong bảng
const attachTableEventListeners = () => {
    // Sự kiện cho tất cả các nút "Sửa" trong bảng
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const customerId = parseInt(e.currentTarget.getAttribute('data-id'));
            openCustomerModal(customerId);
        });
    });
    
    // Sự kiện cho các nút "Xóa"
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            const customerId = parseInt(e.currentTarget.getAttribute('data-id'));
            const confirmed = await ConfirmDialogService.show({
                title: 'Xác nhận Xóa',
                message: `Bạn có chắc chắn muốn xóa khách hàng có ID ${customerId}? Hành động này không thể hoàn tác.`,
                confirmText: 'Xóa',
                confirmButtonClass: 'bg-danger text-white hover:bg-opacity-90'
            });

            if (confirmed) {
                LoadingSpinnerService.show();
                await apiService.deleteCustomer(customerId);
                LoadingSpinnerService.hide();

                ToastService.show(`Đã xóa khách hàng ID ${customerId}.`, 'info');
                // Re-fetch and re-render the page to show changes
                renderCustomersPage();
            }
        });
    });
};

// Hàm render lại bảng và phân trang
const renderCustomerTable = () => {
    const tableContainer = document.getElementById('customer-table-container');
    const paginationContainer = document.getElementById('pagination-container');
    if (!tableContainer || !paginationContainer) return;

    const customers = state.filteredCustomers;
    const totalPages = Math.ceil(customers.length / ITEMS_PER_PAGE);
    currentPage = Math.max(1, Math.min(currentPage, totalPages || 1));

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedCustomers = customers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const customerColumns = [
        { key: 'customerCode', label: 'Mã KH' },
        { key: 'companyName', label: 'Tên Công Ty' },
        { key: 'contactPerson', label: 'Người Liên Hệ' },
        { key: 'phone', label: 'Số Điện Thoại' },
        { key: 'createdAt', label: 'Ngày Tạo' },
    ];

    tableContainer.innerHTML = DataTable({ columns: customerColumns, data: paginatedCustomers });

    // Render pagination
    let paginationHTML = '';
    if (totalPages > 1) {
        paginationHTML += `<nav class="flex items-center justify-between pt-4" aria-label="Table navigation">`;
        paginationHTML += `<span class="text-sm font-normal text-muted">Hiển thị <span class="font-semibold text-text dark:text-white">${startIndex + 1}-${startIndex + paginatedCustomers.length}</span> trên <span class="font-semibold text-text dark:text-white">${customers.length}</span></span>`;
        paginationHTML += `<ul class="inline-flex items-center -space-x-px">`;

        for (let i = 1; i <= totalPages; i++) {
            const isActive = i === currentPage ? 'bg-accent text-white' : 'bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700';
            paginationHTML += `<li><button data-page="${i}" class="page-link px-3 py-2 leading-tight ${isActive} border border-gray-300">${i}</button></li>`;
        }

        paginationHTML += `</ul></nav>`;
    }
    paginationContainer.innerHTML = paginationHTML;

    lucide.createIcons();
    attachTableEventListeners();

    // Gắn sự kiện cho các nút phân trang
    document.querySelectorAll('.page-link').forEach(button => {
        button.addEventListener('click', (e) => {
            currentPage = parseInt(e.currentTarget.getAttribute('data-page'));
            renderCustomerTable();
        });
    });
};

export const renderCustomersPage = async () => {
    const mainContent = document.getElementById('main-content');
    currentPage = 1; // Reset về trang 1 mỗi khi render lại trang
    state.searchQuery = ''; // Reset ô tìm kiếm

    const pageContent = `
        <div class="p-8">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold text-text dark:text-white">Quản lý Khách hàng</h1>
                <button id="add-customer-btn" class="bg-primary text-white hover:bg-opacity-90 font-semibold py-2 px-4 rounded-lg flex items-center shadow-md transition-transform hover:scale-105">
                    <i data-lucide="plus" class="mr-2 h-5 w-5"></i>
                    Thêm Khách Hàng
                </button>
            </div>

            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 mb-6">
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <i data-lucide="search" class="w-5 h-5 text-muted"></i>
                    </div>
                    <input type="text" id="customer-search-input" class="block w-full p-3 pl-10 text-sm text-text border border-gray-300 rounded-lg bg-gray-50 focus:ring-accent focus:border-accent dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="Tìm kiếm khách hàng theo tên, mã, SĐT...">
                </div>
            </div>
            
            <div id="customer-table-container"></div>
            <div id="pagination-container" class="mt-4"></div>
        </div>
    `;

    mainContent.innerHTML = pageContent;
    
    // Gắn sự kiện cho các thành phần tĩnh của trang
    document.getElementById('add-customer-btn').addEventListener('click', () => openCustomerModal());
    document.getElementById('customer-search-input').addEventListener('keyup', (e) => {
        state.searchQuery = e.target.value;
        currentPage = 1; // Quay về trang 1 khi có tìm kiếm mới
        renderCustomerTable();
    });

    // Fetch data from API and render the table
    LoadingSpinnerService.show();
    state.allCustomers = await apiService.getCustomers();
    renderCustomerTable();
    LoadingSpinnerService.hide();
};