import { FormInput, FormTextarea } from './Form.js';

export const CustomerForm = (customer = {}) => {
    return `
        <form id="customer-form" class="space-y-4">
            <input type="hidden" name="id" value="${customer.id || ''}">
            ${FormInput({ id: 'customerCode', label: 'Mã Khách Hàng', value: customer.customerCode || '', placeholder: 'Tự động tạo nếu để trống' })}
            ${FormInput({ id: 'companyName', label: 'Tên Công Ty / Khách Hàng', value: customer.companyName || '', placeholder: 'Bắt buộc', required: true })}
            ${FormInput({ id: 'contactPerson', label: 'Người Liên Hệ', value: customer.contactPerson || '' })}
            ${FormInput({ id: 'phone', label: 'Số Điện Thoại', value: customer.phone || '', type: 'tel' })}
            ${FormTextarea({ id: 'address', label: 'Địa Chỉ', value: customer.address || '' })}
        </form>
    `;
};