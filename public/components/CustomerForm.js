import { FormInput, FormTextarea } from './Form.js';

export const CustomerForm = (customer = {}) => {
    return `
        <form id="customer-form" class="space-y-4 p-2">
            <!-- Hidden input for ID to handle updates -->
            <input type="hidden" name="id" value="${customer.id || ''}">

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${FormInput({
                    id: 'customerCode',
                    label: 'Mã Khách Hàng',
                    value: customer.customerCode || '',
                    placeholder: 'Tự động nếu bỏ trống'
                })}
                ${FormInput({
                    id: 'companyName',
                    label: 'Tên Công Ty / Khách Hàng',
                    value: customer.companyName || '',
                    placeholder: 'Tên công ty hoặc cá nhân'
                })}
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${FormInput({
                    id: 'contactPerson',
                    label: 'Người Liên Hệ',
                    value: customer.contactPerson || '',
                    placeholder: 'Bắt buộc',
                    required: true
                })}
                ${FormInput({
                    id: 'phone',
                    label: 'Số Điện Thoại',
                    value: customer.phone || '',
                    placeholder: 'VD: 0912345678'
                })}
            </div>
            ${FormInput({
                id: 'address',
                label: 'Địa Chỉ',
                value: customer.address || '',
                placeholder: 'VD: 123 Đường ABC, Quận 1, TP. HCM'
            })}
            ${FormTextarea({
                id: 'note',
                label: 'Ghi Chú',
                value: customer.note || '',
                placeholder: 'Thêm ghi chú nếu cần',
                rows: 3
            })}
        </form>
    `;
};