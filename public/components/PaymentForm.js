import { FormInput, FormSelect, FormTextarea } from './Form.js';

export const PaymentForm = (payment = {}, customers = []) => {
    const customerOptions = [
        { value: '', label: '--- Chọn khách hàng ---' },
        ...customers.map(c => ({ value: c.id, label: `${c.companyName} (${c.customerCode})` }))
    ];

    return `
        <form id="payment-form" class="space-y-4">
            ${FormSelect({ id: 'customerId', label: 'Khách hàng', options: customerOptions, required: true })}
            ${FormInput({ id: 'amount', label: 'Số tiền thanh toán (VNĐ)', type: 'number', value: payment.amount || '', placeholder: '0', required: true })}
            ${FormTextarea({ id: 'note', label: 'Ghi chú', value: payment.note || '', placeholder: 'Nội dung thanh toán...' })}
        </form>
    `;
};