import { FormInput, FormSelect } from './Form.js';

export const InvoiceForm = (invoice = {}, customers = []) => {
    const customerOptions = [
        { value: '', label: '--- Chọn khách hàng ---' },
        ...customers.map(c => ({ value: c.id, label: `${c.companyName} (${c.customerCode})` }))
    ];

    // Lấy tháng hiện tại theo định dạng YYYY-MM làm giá trị mặc định
    const defaultMonth = new Date().toISOString().slice(0, 7);

    return `
        <form id="invoice-form" class="space-y-4">
            ${FormSelect({ id: 'customerId', label: 'Khách hàng', options: customerOptions, required: true })}
            ${FormInput({ id: 'invoiceMonth', label: 'Tháng xuất hóa đơn', type: 'month', value: invoice.invoiceMonth || defaultMonth })}
        </form>
    `;
};