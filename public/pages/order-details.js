import { ToastService } from '../components/Toast.js';
import { LoadingSpinnerService } from '../components/LoadingSpinner.js';
import { apiService } from '../services/api.js';
import { renderOrdersPage } from './orders.js';
import { renderEditOrderPage } from './edit-order.js';

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const getStatusBadge = (status) => {
    const statusMap = {
        'unpaid': { label: 'Chưa thanh toán', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
        'paid': { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    };
    
    const mappedStatus = statusMap[status] || statusMap['unpaid'];
    
    return `<span class="px-3 py-1 text-sm font-semibold rounded-full ${mappedStatus.color}">
                ${mappedStatus.label}
            </span>`;
};

export const renderOrderDetailsPage = async (orderId) => {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '';
    LoadingSpinnerService.show();

    try {
        const order = await apiService.getOrderById(orderId);
        LoadingSpinnerService.hide();

        const isLocked = (order.paidAmount || 0) > 0 || order.status === 'paid';

        const orderDateStr = new Date(order.orderDate).toLocaleDateString('vi-VN');
        const customerName = order.customerId?.companyName || 'Khách hàng không xác định';
        const customerCode = order.customerId?.customerCode || 'N/A';
        const customerPhone = order.customerId?.phone || 'Chưa cập nhật';
        const customerAddress = order.customerId?.address || 'Chưa cập nhật';

        mainContent.innerHTML = `
            <style>
                @media print {
                    /* Ẩn các thành phần layout bên ngoài như Sidebar, Header */
                    aside, header, nav, #sidebar {
                        display: none !important;
                    }
                    /* Reset lề cho toàn trang để bản in vừa vặn tờ giấy A4 */
                    body, main, #main-content {
                        margin: 0 !important;
                        padding: 0 !important;
                        background-color: white !important;
                    }
                }
            </style>
            <div class="p-8 pb-20 max-w-5xl mx-auto print:p-0">
                <!-- Header Thao tác -->
                <div class="flex justify-between items-center mb-6 print:hidden">
                    <div class="flex items-center gap-4">
                        <button id="back-to-orders-btn" class="p-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-full transition-colors text-muted" title="Quay lại danh sách">
                            <i data-lucide="arrow-left" class="w-5 h-5"></i>
                        </button>
                        <h1 class="text-3xl font-bold text-text dark:text-white">Chi Tiết Đơn Hàng <span class="text-accent text-xl ml-2">#${order._id.slice(-6)}</span></h1>
                    </div>
                    <div class="flex gap-3">
                        ${isLocked ? '' : `
                            <button id="edit-order-from-details-btn" data-id="${order._id}" class="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-muted hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold py-2 px-4 rounded-lg flex items-center shadow-sm transition-colors">
                                <i data-lucide="edit" class="mr-2 h-4 w-4"></i> Sửa Đơn
                            </button>
                        `}
                        <button id="print-order-btn" class="bg-accent text-white hover:bg-opacity-90 font-semibold py-2 px-4 rounded-lg flex items-center shadow-md transition-transform hover:scale-105">
                            <i data-lucide="printer" class="mr-2 h-4 w-4"></i> In Hóa Đơn
                        </button>
                    </div>
                </div>

                <!-- Box thông tin chính (Giống dạng Hóa đơn) -->
                <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden print:shadow-none print:border-0 print:rounded-none">
                    <!-- Phần đầu thông tin -->
                    <div class="p-8 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <p class="text-sm text-muted font-medium mb-1 uppercase tracking-wider">Thông Tin Khách Hàng</p>
                            <h2 class="text-xl font-bold text-text dark:text-white mb-2">${customerName}</h2>
                            <p class="text-sm text-muted mb-1"><i data-lucide="hash" class="inline w-3 h-3 mr-1"></i> Mã KH: ${customerCode}</p>
                            <p class="text-sm text-muted mb-1"><i data-lucide="phone" class="inline w-3 h-3 mr-1"></i> SĐT: ${customerPhone}</p>
                            <p class="text-sm text-muted"><i data-lucide="map-pin" class="inline w-3 h-3 mr-1"></i> Địa chỉ: ${customerAddress}</p>
                        </div>
                        <div class="text-left md:text-right bg-gray-50 dark:bg-gray-800 p-4 rounded-xl min-w-[200px]">
                            <p class="text-sm text-muted mb-1">Ngày lập đơn</p>
                            <p class="font-semibold text-text dark:text-white mb-3">${orderDateStr}</p>
                            <p class="text-sm text-muted mb-1">Trạng thái</p>
                            <div class="inline-block">${getStatusBadge(order.status)}</div>
                        </div>
                    </div>

                    <!-- Ghi chú nếu có -->
                    ${order.note ? `
                    <div class="px-8 py-4 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 border-b border-yellow-100 dark:border-yellow-800">
                        <p class="text-sm font-semibold text-yellow-800 dark:text-yellow-500 mb-1"><i data-lucide="sticky-note" class="inline w-4 h-4 mr-1"></i> Ghi chú đơn hàng:</p>
                        <p class="text-sm text-yellow-900 dark:text-yellow-400 italic">${order.note}</p>
                    </div>
                    ` : ''}

                    <!-- Bảng chi tiết dịch vụ -->
                    <div class="p-8">
                        <h3 class="text-lg font-bold text-text dark:text-white mb-4">Chi Tiết Dịch Vụ</h3>
                        <div class="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
                            <table class="w-full text-sm text-left text-muted">
                                <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                                    <tr>
                                        <th scope="col" class="px-4 py-4">STT</th>
                                        <th scope="col" class="px-4 py-4">Dịch Vụ / Nội Dung</th>
                                        <th scope="col" class="px-4 py-4 text-right">Số Lượng</th>
                                        <th scope="col" class="px-4 py-4 text-right">Đơn Giá</th>
                                        <th scope="col" class="px-4 py-4 text-right">Thành Tiền</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                                    ${order.items.map((item, index) => `
                                        <tr class="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td class="px-4 py-4 font-medium text-gray-900 dark:text-white">${index + 1}</td>
                                            <td class="px-4 py-4">
                                                <div class="font-semibold text-text dark:text-white">${item.serviceTypeLabel || item.serviceType}</div>
                                                <div class="text-xs text-muted mt-1">${item.description || item.fileName || ''}</div>
                                                ${item.hasCreationFee ? `<span class="text-[10px] bg-accent bg-opacity-20 text-accent px-2 py-0.5 rounded mt-1 inline-block">Đã kèm phí chạy sơ đồ</span>` : ''}
                                            </td>
                                            <td class="px-4 py-4 text-right">${item.quantity} <span class="text-xs text-muted">${item.unit || ''}</span></td>
                                            <td class="px-4 py-4 text-right">${formatCurrency(item.unitPrice)}</td>
                                            <td class="px-4 py-4 text-right font-semibold text-text dark:text-white">${formatCurrency(item.amount)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>

                        <!-- Tổng tiền -->
                        <div class="mt-8 flex justify-end">
                            <div class="w-full md:w-1/2 lg:w-1/3 bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                                <div class="flex justify-between items-center mb-3">
                                    <span class="text-muted font-medium">Tạm tính:</span>
                                    <span class="text-text dark:text-white font-semibold">${formatCurrency(order.totalAmount)}</span>
                                </div>
                                <div class="flex justify-between items-center mb-3">
                                    <span class="text-muted font-medium">Đã thanh toán:</span>
                                    <span class="text-success font-semibold">${formatCurrency(order.paidAmount || 0)}</span>
                                </div>
                                <div class="w-full h-px bg-gray-200 dark:bg-gray-700 my-3"></div>
                                <div class="flex justify-between items-center">
                                    <span class="text-lg font-bold text-text dark:text-white">Còn Nợ:</span>
                                    <span class="text-2xl font-bold ${(order.totalAmount - (order.paidAmount || 0)) > 0 ? 'text-danger' : 'text-success'}">
                                        ${formatCurrency(order.totalAmount - (order.paidAmount || 0))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        lucide.createIcons();

        // Sự kiện nút Quay lại
        document.getElementById('back-to-orders-btn').addEventListener('click', renderOrdersPage);
        
        // Sự kiện chuyển sang trang Sửa
        const editBtn = document.getElementById('edit-order-from-details-btn');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                renderEditOrderPage(order._id);
            });
        }

        // Sự kiện In đơn
        document.getElementById('print-order-btn').addEventListener('click', () => {
            window.print(); // Gọi lệnh in của trình duyệt (Có thể cấu hình CSS @media print sau này để in đẹp hơn)
        });

    } catch (error) {
        LoadingSpinnerService.hide();
        ToastService.show('Lỗi tải dữ liệu chi tiết đơn hàng: ' + error.message, 'danger');
        renderOrdersPage();
    }
};