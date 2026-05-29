import { DataTable } from '../components/DataTable.js';
import { ModalService } from '../components/ModalService.js';
import { CustomerForm } from '../components/CustomerForm.js';
import { ToastService } from '../components/Toast.js';
import { ConfirmDialogService } from '../components/ConfirmDialog.js';
import { LoadingSpinnerService } from '../components/LoadingSpinner.js';
import { apiService } from '../services/api.js';

let currentPage = 1;
let itemsPerPage = 10; // Số khách hàng trên mỗi trang mặc định

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

const openImportModal = () => {
    const modalContent = `
        <div class="p-2">
            <p class="text-muted mb-4">Chọn hoặc kéo thả file Excel (.xlsx, .xls). File cần có các cột: <strong>customerCode, companyName, contactPerson, phone, address, note</strong>.</p>
            <div id="import-drop-zone" class="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div class="flex flex-col items-center justify-center pt-5 pb-6">
                    <i data-lucide="file-up" class="w-10 h-10 mb-3 text-gray-400"></i>
                    <p class="mb-2 text-sm text-muted"><span class="font-semibold">Nhấn để chọn file</span> hoặc kéo thả</p>
                    <p class="text-xs text-muted">XLSX, XLS</p>
                </div>
                <input id="import-file-input" type="file" class="hidden" accept=".xlsx, .xls, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
            </div>
            <div id="import-file-name" class="mt-4 text-sm text-center text-muted"></div>
        </div>
    `;

    const modalFooter = `
        <button id="modal-cancel-btn" class="px-4 py-2 text-sm font-medium text-muted bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg">Hủy</button>
        <button id="modal-import-btn" class="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-opacity-90 rounded-lg ml-2" disabled>
            <i data-lucide="upload-cloud" class="inline-block mr-1 h-4 w-4"></i>
            Bắt đầu Import
        </button>
    `;

    ModalService.open({
        title: 'Import Khách hàng từ Excel',
        content: modalContent,
        footer: modalFooter
    });

    // Gắn sự kiện cho modal import
    const dropZone = document.getElementById('import-drop-zone');
    const fileInput = document.getElementById('import-file-input');
    const fileNameDisplay = document.getElementById('import-file-name');
    const importBtn = document.getElementById('modal-import-btn');
    let selectedFile = null;

    const handleFileSelect = (file) => {
        if (file) {
            if (!file.name.match(/\.(xlsx|xls)$/i)) {
                ToastService.show('Chỉ chấp nhận file Excel (.xlsx, .xls).', 'danger');
                return;
            }
            selectedFile = file;
            fileNameDisplay.textContent = `File đã chọn: ${file.name}`;
            importBtn.disabled = false;
            lucide.createIcons();
        }
    };

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); });
    });
    dropZone.addEventListener('dragenter', () => dropZone.classList.add('border-accent', 'bg-blue-50', 'dark:bg-gray-700'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-accent', 'bg-blue-50', 'dark:bg-gray-700'));
    dropZone.addEventListener('drop', (e) => {
        dropZone.classList.remove('border-accent', 'bg-blue-50', 'dark:bg-gray-700');
        handleFileSelect(e.dataTransfer.files[0]);
    });

    document.getElementById('modal-cancel-btn').addEventListener('click', () => ModalService.close());
    importBtn.addEventListener('click', () => {
        if (!selectedFile) return;
        LoadingSpinnerService.show();

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                // Sử dụng thư viện SheetJS (XLSX) đã nạp từ index.html
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Lấy worksheet đầu tiên
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Chuyển dữ liệu worksheet thành mảng JSON các dòng
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                if (jsonData.length === 0) {
                    throw new Error("File Excel trống hoặc không đúng định dạng.");
                }

                // Hàm chuẩn hóa tiêu đề cột (hỗ trợ cả tiếng Anh và tiếng Việt thông dụng)
                const normalizeKey = (key) => {
                    const k = String(key).toLowerCase().trim();
                    if (k === 'customercode' || k === 'mã kh' || k === 'ma kh' || k === 'mã khách hàng' || k === 'ma khach hang') return 'customerCode';
                    if (k === 'companyname' || k === 'tên công ty' || k === 'ten cong ty' || k === 'tên khách hàng' || k === 'ten khach hang') return 'companyName';
                    if (k === 'contactperson' || k === 'người liên hệ' || k === 'nguoi lien he') return 'contactPerson';
                    if (k === 'phone' || k === 'sđt' || k === 'sdt' || k === 'số điện thoại' || k === 'so dien thoai') return 'phone';
                    if (k === 'address' || k === 'địa chỉ' || k === 'dia chi') return 'address';
                    if (k === 'note' || k === 'ghi chú' || k === 'ghi chu') return 'note';
                    return key;
                };

                const customersToSave = [];
                for (const row of jsonData) {
                    const customer = {};
                    for (const [key, value] of Object.entries(row)) {
                        const normalizedKey = normalizeKey(key);
                        if (value !== undefined && value !== null) {
                            customer[normalizedKey] = String(value).trim();
                        }
                    }

                    // Yêu cầu tối thiểu: mã khách hàng và (tên công ty hoặc người liên hệ)
                    if (customer.customerCode && (customer.companyName || customer.contactPerson)) {
                        customersToSave.push(customer);
                    }
                }

                if (customersToSave.length === 0) {
                    throw new Error("Không tìm thấy dữ liệu khách hàng hợp lệ trong file Excel. File cần chứa các cột: customerCode, companyName/contactPerson.");
                }

                let successCount = 0;
                let errorCount = 0;
                const errors = [];

                for (const customerData of customersToSave) {
                    try {
                        // Đảm bảo có Người liên hệ (nếu trống sẽ gán bằng Tên công ty)
                        if (!customerData.contactPerson) {
                            customerData.contactPerson = customerData.companyName || 'Khách hàng';
                        }
                        await apiService.saveCustomer(customerData);
                        successCount++;
                    } catch (err) {
                        errorCount++;
                        errors.push(`${customerData.customerCode}: ${err.message}`);
                    }
                }

                LoadingSpinnerService.hide();
                ModalService.close();

                if (errorCount === 0) {
                    ToastService.show(`Import thành công ${successCount} khách hàng!`, 'success');
                } else {
                    ToastService.show(`Import thành công ${successCount} KH, thất bại ${errorCount} KH.`, 'warning');
                    console.error("Lỗi chi tiết import:", errors);
                }

                await renderCustomersPage();
            } catch (err) {
                LoadingSpinnerService.hide();
                ToastService.show('Lỗi xử lý file Excel: ' + err.message, 'danger');
            }
        };

        reader.onerror = () => {
            LoadingSpinnerService.hide();
            ToastService.show('Lỗi khi đọc file.', 'danger');
        };

        reader.readAsArrayBuffer(selectedFile);
    });
};

const openCustomerModal = (customerId) => {
    const isEdit = customerId !== undefined;
    const customer = isEdit ? state.allCustomers.find(c => c.id === customerId) : {}; // id is now a string (_id from mongo)
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

        // Cập nhật validation: Người liên hệ là bắt buộc
        if (!data.contactPerson || data.contactPerson.trim() === '') {
            ToastService.show('Người Liên Hệ là bắt buộc.', 'warning');
            return;
        }

        LoadingSpinnerService.show();
        try {
            await apiService.saveCustomer(data); // The form data includes the 'id' if it's an edit
            ToastService.show(isEdit ? 'Cập nhật khách hàng thành công!' : 'Đã thêm khách hàng mới!', 'success');
            ModalService.close();

            // Tải lại dữ liệu và chỉ render lại bảng để có trải nghiệm tốt hơn
            state.allCustomers = await apiService.getCustomers();
            renderCustomerTable();
        } catch (error) {
            ToastService.show(error.message, 'danger');
        } finally {
            LoadingSpinnerService.hide();
        }
    });
};

// Hàm render lại bảng và phân trang
const renderCustomerTable = () => {
    const tableContainer = document.getElementById('customer-table-container');
    const paginationContainer = document.getElementById('pagination-container');
    if (!tableContainer || !paginationContainer) return;

    const customers = state.filteredCustomers;
    const totalPages = Math.ceil(customers.length / itemsPerPage);
    currentPage = Math.max(1, Math.min(currentPage, totalPages || 1));

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCustomers = customers.slice(startIndex, startIndex + itemsPerPage);

    const customerColumns = [
        { key: 'customerCode', label: 'Mã KH' },
        { key: 'companyName', label: 'Tên Công Ty' },
        { key: 'contactPerson', label: 'Người Liên Hệ', hiddenMobile: true },
        { key: 'phone', label: 'Số Điện Thoại' },
        { key: 'createdAt', label: 'Ngày Tạo', hiddenMobile: true },
    ];

    tableContainer.innerHTML = DataTable({ columns: customerColumns, data: paginatedCustomers });

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
            từ <span class="font-semibold text-text dark:text-white">${customers.length > 0 ? startIndex + 1 : 0}-${startIndex + paginatedCustomers.length}</span> 
            trên <span class="font-semibold text-text dark:text-white">${customers.length}</span>
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

export const renderCustomersPage = async () => {
    const mainContent = document.getElementById('main-content');
    // Reset state when the page is loaded from scratch
    currentPage = 1;
    state.searchQuery = '';

    const pageContent = `
        <div id="customer-page-container" class="p-8">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold text-text dark:text-white">Quản lý Khách hàng</h1>
                <div class="flex items-center gap-3">
                    <button id="import-customer-btn" class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-muted hover:bg-gray-100 dark:hover:bg-gray-600 font-semibold py-2 px-4 rounded-lg flex items-center shadow-sm transition-colors">
                        <i data-lucide="upload" class="mr-2 h-5 w-5"></i>
                        Import Excel
                    </button>
                    <button id="add-customer-btn" class="bg-primary text-white hover:bg-opacity-90 font-semibold py-2 px-4 rounded-lg flex items-center shadow-md transition-transform hover:scale-105">
                        <i data-lucide="plus" class="mr-2 h-5 w-5"></i>
                        Thêm Khách Hàng
                    </button>
                </div>
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
    // Phải gọi createIcons sau khi gán innerHTML để các icon (như dấu +, thùng rác,...) được render.
    lucide.createIcons();
    
    
    const pageContainer = document.getElementById('customer-page-container');

    // Sử dụng Event Delegation để quản lý tất cả các sự kiện click
    pageContainer.addEventListener('click', async (e) => {
        const addBtn = e.target.closest('#add-customer-btn');
        if (addBtn) {
            openCustomerModal();
            return;
        }

        const importBtn = e.target.closest('#import-customer-btn');
        if (importBtn) {
            openImportModal();
            return;
        }

        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
            const customerId = editBtn.getAttribute('data-id'); // ID is a string from MongoDB (_id)
            openCustomerModal(customerId);
            return;
        }

        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            const customerId = deleteBtn.getAttribute('data-id'); // ID is a string from MongoDB (_id)
            const confirmed = await ConfirmDialogService.show({
                title: 'Xác nhận Xóa',
                message: `Bạn có chắc chắn muốn xóa khách hàng này? Hành động này không thể hoàn tác.`,
                confirmText: 'Xóa',
                confirmButtonClass: 'bg-danger text-white hover:bg-opacity-90'
            });

            if (confirmed) {
                LoadingSpinnerService.show();
                try {
                    await apiService.deleteCustomer(customerId);
                    ToastService.show(`Đã xóa khách hàng.`, 'info');
                    // Tải lại dữ liệu và chỉ render lại bảng
                    state.allCustomers = await apiService.getCustomers();
                    renderCustomerTable();
                } catch (error) {
                    ToastService.show(error.message, 'danger');
                } finally {
                    LoadingSpinnerService.hide();
                }
            }
            return;
        }

        const pageLink = e.target.closest('.page-link');
        if (pageLink) {
            currentPage = parseInt(pageLink.getAttribute('data-page'));
            renderCustomerTable();
        }
    });

    pageContainer.querySelector('#customer-search-input').addEventListener('keyup', (e) => {
        state.searchQuery = e.target.value;
        currentPage = 1; // Quay về trang 1 khi có tìm kiếm mới
        renderCustomerTable();
    });

    // Lắng nghe sự kiện thay đổi số bản ghi hiển thị trên mỗi trang
    pageContainer.addEventListener('change', (e) => {
        const select = e.target.closest('#change-items-per-page');
        if (select) {
            itemsPerPage = parseInt(select.value, 10);
            currentPage = 1; // Reset về trang 1
            renderCustomerTable();
        }
    });

    // Fetch data from API and render the table
    LoadingSpinnerService.show();
    try {
        state.allCustomers = await apiService.getCustomers();
        renderCustomerTable();
    } catch (error) {
        ToastService.show('Không thể tải dữ liệu khách hàng: ' + error.message, 'danger');
    } finally {
        LoadingSpinnerService.hide();
    }
};