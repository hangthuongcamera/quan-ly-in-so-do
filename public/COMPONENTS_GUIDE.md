# Hướng Dẫn Sử Dụng Các Component Giao Diện (Giai Đoạn 1)

Tài liệu này mô tả cách sử dụng các UI component đã được xây dựng trong Giai đoạn 1 của dự án. Việc tuân thủ các component này sẽ giúp đảm bảo giao diện người dùng nhất quán, dễ bảo trì và mở rộng.

---

## 1. DataTable

Component dùng để hiển thị dữ liệu dạng bảng.

-   **File:** `public/components/DataTable.js`

### Cách sử dụng

```javascript
import { DataTable } from '../components/DataTable.js';

const columns = [
    { key: 'name', label: 'Tên' },
    { key: 'email', label: 'Email' }
];

const data = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Doe', email: 'jane@example.com' }
];

const tableHTML = DataTable({ columns, data, showActions: true });
document.getElementById('container').innerHTML = tableHTML;
```

### Tham số

-   `columns` (Array): Mảng các object định nghĩa cột. Mỗi object có:
    -   `key`: Tên thuộc tính trong object dữ liệu.
    -   `label`: Tên hiển thị của cột.
-   `data` (Array): Mảng các object dữ liệu cần hiển thị. Mỗi object phải có thuộc tính `id` để các nút hành động (Sửa/Xóa) hoạt động.
-   `showActions` (Boolean, mặc định: `true`): Hiển thị hoặc ẩn cột "Hành động" (nút Sửa/Xóa).

---

## 2. ModalService

Service dùng để hiển thị các hộp thoại modal.

-   **File:** `public/components/ModalService.js`

### Cách sử dụng

```javascript
import { ModalService } from '../components/ModalService.js';

const formContent = `<input type="text" placeholder="Nhập gì đó...">`;
const footerContent = `<button id="close-btn">Đóng</button>`;

ModalService.open({
    title: 'Tiêu đề Modal',
    content: formContent,
    footer: footerContent
});

document.getElementById('close-btn').addEventListener('click', () => {
    ModalService.close();
});
```

### Phương thức

-   `ModalService.open(options)`: Mở một modal.
    -   `options` (Object):
        -   `title` (String): Tiêu đề của modal.
        -   `content` (String): Nội dung HTML bên trong modal.
        -   `footer` (String): Nội dung HTML của phần chân modal (thường chứa các nút).
-   `ModalService.close()`: Đóng modal đang mở.

---

## 3. ToastService

Service dùng để hiển thị các thông báo nhanh (toast notification).

-   **File:** `public/components/Toast.js`

### Cách sử dụng

```javascript
import { ToastService } from '../components/Toast.js';

// Khởi tạo container một lần khi ứng dụng bắt đầu (trong main.js)
ToastService.init();

// Hiển thị thông báo
ToastService.show('Lưu thành công!', 'success');
ToastService.show('Có lỗi xảy ra.', 'danger');
```

### Phương thức

-   `ToastService.init()`: Tạo container chứa các toast. Cần được gọi một lần khi ứng dụng khởi chạy.
-   `ToastService.show(message, type, duration)`: Hiển thị một toast.
    -   `message` (String): Nội dung thông báo.
    -   `type` (String, mặc định: `'info'`): Loại thông báo. Bao gồm: `'info'`, `'success'`, `'warning'`, `'danger'`.
    -   `duration` (Number, mặc định: `4000`): Thời gian hiển thị (ms).

---

## 4. ConfirmDialogService

Service dùng để hiển thị hộp thoại xác nhận, thay thế cho `confirm()` của trình duyệt.

-   **File:** `public/components/ConfirmDialog.js`

### Cách sử dụng

Component này trả về một `Promise`, nên cách sử dụng tốt nhất là với `async/await`.

```javascript
import { ConfirmDialogService } from '../components/ConfirmDialog.js';

async function handleDelete() {
    const confirmed = await ConfirmDialogService.show({
        title: 'Xác nhận Xóa',
        message: 'Bạn có chắc chắn muốn xóa mục này?',
        confirmText: 'Xóa',
        confirmButtonClass: 'bg-danger text-white' // Tùy chỉnh màu nút
    });

    if (confirmed) {
        // Logic xóa ở đây
        console.log('Người dùng đã xác nhận xóa.');
    } else {
        console.log('Người dùng đã hủy.');
    }
}
```

### Phương thức

-   `ConfirmDialogService.show(options)`: Hiển thị hộp thoại và trả về `Promise<boolean>`.
    -   `options` (Object):
        -   `title` (String): Tiêu đề hộp thoại.
        -   `message` (String): Nội dung thông điệp.
        -   `confirmText` (String): Chữ trên nút xác nhận.
        -   `cancelText` (String): Chữ trên nút hủy.
        -   `confirmButtonClass` (String): Các lớp CSS của Tailwind để tùy chỉnh nút xác nhận.

---

## 5. LoadingSpinnerService

Service dùng để hiển thị một icon xoay trên toàn màn hình, báo hiệu một tác vụ đang chạy.

-   **File:** `public/components/LoadingSpinner.js`

### Cách sử dụng

```javascript
import { LoadingSpinnerService } from '../components/LoadingSpinner.js';

async function fetchData() {
    LoadingSpinnerService.show();
    try {
        const data = await apiService.getSomeData();
        // Xử lý dữ liệu
    } catch (error) {
        // Xử lý lỗi
    } finally {
        LoadingSpinnerService.hide();
    }
}
```

### Phương thức

-   `LoadingSpinnerService.show()`: Hiển thị spinner.
-   `LoadingSpinnerService.hide()`: Ẩn spinner.

---

## 6. Form Components

Bộ component để xây dựng form một cách nhất quán.

-   **File:** `public/components/Form.js`

### Các component

-   `FormInput({ id, label, value, placeholder, type, required })`
-   `FormTextarea({ id, label, value, placeholder, rows })`
-   `FormSelect({ id, label, options, required })`
    -   `options` (Array): Mảng các object `{ value: '...', label: '...' }`.

### Cách sử dụng

```javascript
import { FormInput, FormSelect, FormTextarea } from './Form.js';

const customerOptions = [
    { value: '', label: '--- Chọn khách hàng ---' },
    { value: '1', label: 'Khách hàng A' }
];

const formHTML = `
    <form class="space-y-4">
        ${FormInput({ id: 'name', label: 'Tên', required: true })}
        ${FormSelect({ id: 'customer', label: 'Khách hàng', options: customerOptions, required: true })}
        ${FormTextarea({ id: 'note', label: 'Ghi chú' })}
    </form>
`;
```