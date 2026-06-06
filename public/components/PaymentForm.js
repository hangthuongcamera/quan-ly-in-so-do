import { FormInput, FormTextarea } from './Form.js';

export const PaymentForm = (payment = {}, customers = []) => {
    return `
        <form id="payment-form" class="space-y-4">
            <div class="relative">
                <label class="block text-sm font-medium text-muted mb-1">Khách hàng <span class="text-danger">*</span></label>
                <div class="relative">
                    <input type="text" id="payment-customer-search-input" class="w-full text-sm bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg p-2.5 pr-10 text-text dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Tìm kiếm khách hàng theo tên, mã, SĐT..." autocomplete="off" required>
                    <input type="hidden" id="payment-customerId" name="customerId" required>
                    <button type="button" id="payment-clear-customer-btn" class="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-text hidden">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>
                <ul id="payment-customer-dropdown-list" class="absolute z-50 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto hidden">
                </ul>
            </div>
            ${FormInput({ id: 'amount', label: 'Số tiền thanh toán (VNĐ)', type: 'text', value: payment.amount ? new Intl.NumberFormat('vi-VN').format(payment.amount) : '', placeholder: '0', required: true })}
            ${FormTextarea({ id: 'note', label: 'Ghi chú', value: payment.note || '', placeholder: 'Nội dung thanh toán...' })}
        </form>
    `;
};