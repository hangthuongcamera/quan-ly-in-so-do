import { DataTable } from '../components/DataTable.js';
import { ModalService } from '../components/ModalService.js';
import { InvoiceForm } from '../components/InvoiceForm.js';
import { ToastService } from '../components/Toast.js';
import { LoadingSpinnerService } from '../components/LoadingSpinner.js';
import { apiService } from '../services/api.js';

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const openInvoiceModal = async () => {
    LoadingSpinnerService.show();
    const customers = await apiService.getCustomers();
    LoadingSpinnerService.hide();
    const title = 'Tạo Hóa đơn mới';
    const formContent = InvoiceForm({}, customers);
    const footerContent = `
        <button id="modal-cancel-btn" class="px-4 py-2 text-sm font-medium text-muted bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg">Hủy</button>
        <button id="modal-save-btn" class="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-opacity-90 rounded-lg ml-2">Tạo Hóa đơn</button>
    `;

    ModalService.open({ title, content: formContent, footer: footerContent });

    document.getElementById('modal-cancel-btn').addEventListener('click', () => ModalService.close());
    document.getElementById('modal-save-btn').addEventListener('click', async () => {
        const form = document.getElementById('invoice-form');
        if (form.checkValidity()) {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            LoadingSpinnerService.show();
            await apiService.createInvoice(data);
            LoadingSpinnerService.hide();
            ToastService.show('Đã tạo hóa đơn thành công!', 'success');
            ModalService.close();
            renderInvoicesPage(); // Re-render page
        } else {
            form.reportValidity();
        }
    });
};

const attachTableEventListeners = () => {
    document.querySelectorAll('.view-invoice-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const invoiceId = e.currentTarget.getAttribute('data-id');
            alert(`Xem chi tiết/In hóa đơn ID: ${invoiceId} (chức năng chưa triển khai).`);
        });
    });
};

export const renderInvoicesPage = async () => {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = ''; // Clear previous content
    LoadingSpinnerService.show();

    const pageContent = `
        <div class="p-8">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold text-text dark:text-white">Quản lý Hóa đơn</h1>
                <button id="create-invoice-btn" class="bg-primary text-white hover:bg-opacity-90 font-semibold py-2 px-4 rounded-lg flex items-center shadow-md transition-transform hover:scale-105">
                    <i data-lucide="plus-circle" class="mr-2 h-5 w-5"></i>
                    Tạo Hóa đơn
                </button>
            </div>
            
            <div id="invoices-table-container"></div>
        </div>
    `;
    mainContent.innerHTML = pageContent;

    const invoiceColumns = [
        { key: 'invoiceNumber', label: 'Số HĐ' },
        { key: 'customerName', label: 'Khách Hàng' },
        { key: 'monthYear', label: 'Tháng/Năm' },
        { key: 'totalAmount', label: 'Tổng Tiền' },
        { key: 'statusLabel', label: 'Trạng Thái' },
        { key: 'actions', label: 'Hành động' },
    ];

    const invoices = await apiService.getInvoices();
    LoadingSpinnerService.hide();

    const formattedData = invoices.map(invoice => ({
        ...invoice,
        totalAmount: formatCurrency(invoice.totalAmount),
        statusLabel: `<span class="px-2 py-1 text-xs font-medium rounded-full bg-${invoice.statusColor}/20 text-${invoice.statusColor}">${invoice.statusLabel}</span>`,
        actions: `
            <button class="view-invoice-btn text-accent hover:text-blue-700 p-1" title="Xem & In hóa đơn" data-id="${invoice.id}">
                <i data-lucide="printer" class="w-5 h-5"></i>
            </button>
        `
    }));

    document.getElementById('invoices-table-container').innerHTML = DataTable({
        columns: invoiceColumns,
        data: formattedData,
        showActions: false // Tắt action mặc định vì ta đã tự tạo
    });

    lucide.createIcons();
    attachTableEventListeners();
    document.getElementById('create-invoice-btn').addEventListener('click', openInvoiceModal);
};