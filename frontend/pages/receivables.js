import { DataTable } from '../components/DataTable.js';
import { StatsCard } from '../components/StatsCard.js';
import { ModalService } from '../components/ModalService.js';
import { PaymentForm } from '../components/PaymentForm.js';
import { ToastService } from '../components/Toast.js';
import { LoadingSpinnerService } from '../components/LoadingSpinner.js';
import { apiService } from '../services/api.js';

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

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

    document.getElementById('modal-cancel-btn').addEventListener('click', () => ModalService.close());
    document.getElementById('modal-save-btn').addEventListener('click', async () => {
        const form = document.getElementById('payment-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        LoadingSpinnerService.show();
        await apiService.savePayment(data);
        LoadingSpinnerService.hide();

        ToastService.show('Đã ghi nhận thanh toán thành công!', 'success');
        ModalService.close();
        renderReceivablesPage(); // Re-render the page to reflect changes
    });
};

export const renderReceivablesPage = async () => {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = ''; // Clear previous content
    LoadingSpinnerService.show();

    const receivables = await apiService.getReceivables();

    // Tính toán tổng hợp
    const totalDebt = receivables.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalPaid = receivables.reduce((sum, item) => sum + item.paidAmount, 0);
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
            
            <div id="receivables-table-container"></div>
        </div>
    `;

    mainContent.innerHTML = pageContent;

    const receivablesColumns = [
        { key: 'customerCode', label: 'Mã KH' },
        { key: 'companyName', label: 'Tên Công Ty' },
        { key: 'totalAmount', label: 'Tổng Nợ' },
        { key: 'paidAmount', label: 'Đã Trả' },
        { key: 'remainingAmount', label: 'Còn Lại' },
    ];

    LoadingSpinnerService.hide();

    const formattedData = receivables.map(item => ({
        ...item,
        totalAmount: formatCurrency(item.totalAmount),
        paidAmount: formatCurrency(item.paidAmount),
        remainingAmount: `<span class="font-bold ${item.remainingAmount > 0 ? 'text-danger' : 'text-success'}">${formatCurrency(item.remainingAmount)}</span>`
    }));

    document.getElementById('receivables-table-container').innerHTML = DataTable({
        columns: receivablesColumns,
        data: formattedData,
        showActions: false // Không cần nút sửa/xóa cho từng dòng ở đây
    });

    lucide.createIcons();

    document.getElementById('record-payment-btn').addEventListener('click', openPaymentModal);
};