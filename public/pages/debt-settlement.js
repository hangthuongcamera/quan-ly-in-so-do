import { DataTable } from '../components/DataTable.js';
import { StatsCard } from '../components/StatsCard.js';
import { ModalService } from '../components/ModalService.js';
import { ToastService } from '../components/Toast.js';
import { LoadingSpinnerService } from '../components/LoadingSpinner.js';
import { apiService } from '../services/api.js';

let selectedCustomerId = '';
let selectedMonth = '';
let startDate = '';
let endDate = '';

const state = {
    customers: [],
    orders: [],
    payments: [],
    settings: {},
};

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const getCurrentMonthValue = () => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}`;
};

const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    
    // Tạo danh sách 24 tháng gần nhất (2 năm)
    for (let i = 0; i < 24; i++) {
        const d = new Date(currentYear, currentMonth - i, 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const value = `${y}-${m}`;
        const label = `Tháng ${m}/${y}`;
        options.push({ value, label });
    }
    return options;
};

const getDatesFromMonth = (monthValue) => {
    const [year, month] = monthValue.split('-');
    const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
    const formattedLastDay = String(lastDay).padStart(2, '0');
    return {
        start: `${year}-${month}-01`,
        end: `${year}-${month}-${formattedLastDay}`
    };
};

const renderBlankState = () => `
    <div class="bg-white dark:bg-gray-900 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-800 shadow-sm">
        <i data-lucide="info" class="w-12 h-12 text-muted mx-auto mb-4"></i>
        <h3 class="text-lg font-bold text-text dark:text-white mb-2">Chưa chọn khách hàng</h3>
        <p class="text-sm text-muted">Vui lòng chọn khách hàng và khoảng thời gian để xem chốt công nợ chi tiết.</p>
    </div>
`;

const openOrderReviewModal = async (orderId) => {
    LoadingSpinnerService.show();
    try {
        const order = await apiService.getOrderById(orderId);
        LoadingSpinnerService.hide();

        const orderDateStr = new Date(order.orderDate).toLocaleDateString('vi-VN');
        const customerName = order.customerId?.companyName || 'Khách hàng không xác định';
        const customerCode = order.customerId?.customerCode || 'N/A';
        const customerPhone = order.customerId?.phone || 'Chưa cập nhật';
        const customerAddress = order.customerId?.address || 'Chưa cập nhật';

        const statusBadge = order.status === 'paid'
            ? `<span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Đã thanh toán</span>`
            : `<span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Chưa thanh toán</span>`;

        const itemsHTML = order.items.map((item, idx) => `
            <tr class="border-b border-gray-100 dark:border-gray-800 text-sm">
                <td class="px-4 py-3 text-center">${idx + 1}</td>
                <td class="px-4 py-3 font-medium">${item.fileName || item.description || 'Dịch vụ'}</td>
                <td class="px-4 py-3 text-center capitalize">${item.serviceTypeLabel || item.serviceType}</td>
                <td class="px-4 py-3 text-right">${item.quantity}</td>
                <td class="px-4 py-3 text-right">${formatCurrency(item.unitPrice)}</td>
                <td class="px-4 py-3 text-right font-semibold text-text dark:text-white">${formatCurrency(item.amount)}</td>
            </tr>
        `).join('');

        const modalContent = `
            <div class="space-y-4 max-h-[70vh] overflow-y-auto pr-2 text-text dark:text-gray-300">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-wider text-muted mb-1">Khách hàng</p>
                        <p class="font-bold text-sm text-text dark:text-white">${customerName} (${customerCode})</p>
                        <p class="text-xs text-muted">SĐT: ${customerPhone}</p>
                        <p class="text-xs text-muted">Địa chỉ: ${customerAddress}</p>
                    </div>
                    <div class="md:text-right">
                        <p class="text-xs font-semibold uppercase tracking-wider text-muted mb-1">Đơn hàng</p>
                        <p class="font-bold text-sm text-accent">#${order._id.slice(-6)}</p>
                        <p class="text-xs text-muted">Ngày: ${orderDateStr}</p>
                        <div class="mt-2">${statusBadge}</div>
                    </div>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full border-collapse">
                        <thead>
                            <tr class="bg-gray-50 dark:bg-gray-800 text-xs font-semibold uppercase tracking-wider text-muted border-b border-gray-100 dark:border-gray-800">
                                <th class="px-4 py-2 text-center w-12">STT</th>
                                <th class="px-4 py-2 text-left">Tên File / Mô Tả</th>
                                <th class="px-4 py-2 text-center">Loại Dịch Vụ</th>
                                <th class="px-4 py-2 text-right">Số Lượng</th>
                                <th class="px-4 py-2 text-right">Đơn Giá</th>
                                <th class="px-4 py-2 text-right">Thành Tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHTML}
                        </tbody>
                    </table>
                </div>

                <div class="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-right w-full ml-auto md:max-w-xs">
                    <div class="flex justify-between text-sm">
                        <span class="text-muted">Tổng cộng:</span>
                        <span class="font-bold text-text dark:text-white">${formatCurrency(order.totalAmount)}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-muted">Đã thanh toán:</span>
                        <span class="font-semibold text-success">${formatCurrency(order.paidAmount || 0)}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-muted">Còn lại:</span>
                        <span class="font-bold text-danger">${formatCurrency(order.totalAmount - (order.paidAmount || 0))}</span>
                    </div>
                </div>

                ${order.note ? `
                <div class="bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 p-3 rounded-lg border border-yellow-100 dark:border-yellow-800">
                    <p class="text-xs font-semibold text-yellow-800 dark:text-yellow-500 mb-0.5">Ghi chú:</p>
                    <p class="text-xs text-yellow-900 dark:text-yellow-400 italic">${order.note}</p>
                </div>
                ` : ''}
            </div>
        `;

        const modalFooter = `
            <button id="modal-close-btn-review" class="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-opacity-90 rounded-lg">Đóng</button>
        `;

        ModalService.open({
            title: `Chi tiết đơn hàng #${order._id.slice(-6)}`,
            content: modalContent,
            footer: modalFooter,
            size: 'max-w-4xl'
        });

        document.getElementById('modal-close-btn-review').addEventListener('click', () => ModalService.close());
    } catch (error) {
        ToastService.show('Lỗi khi xem chi tiết đơn hàng: ' + error.message, 'danger');
    } finally {
        LoadingSpinnerService.hide();
    }
};

const renderResultsHTML = (customer, initialDebt, periodRevenue, periodPaid, finalDebt, orders, payments) => {
    // 4 ô thống kê
    const stats = [
        { title: 'Dư nợ đầu kỳ', value: formatCurrency(initialDebt), icon: 'hourglass', color: initialDebt > 0 ? 'danger' : 'success' },
        { title: 'Phát sinh trong kỳ', value: formatCurrency(periodRevenue), icon: 'trending-up', color: 'primary' },
        { title: 'Đã thanh toán', value: formatCurrency(periodPaid), icon: 'check-circle', color: 'success' },
        { title: 'Dư nợ cuối kỳ', value: formatCurrency(finalDebt), icon: 'wallet', color: finalDebt > 0 ? 'danger' : 'success' },
    ];

    const statsHTML = stats.map(s => `
        <div class="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-muted mb-1">${s.title}</p>
                <h3 class="text-xl font-bold text-text dark:text-white">${s.value}</h3>
            </div>
            <div class="p-3 rounded-xl bg-${s.color} bg-opacity-10 text-${s.color}">
                <i data-lucide="${s.icon}" class="w-6 h-6"></i>
            </div>
        </div>
    `).join('');

    // Đơn hàng trong kỳ
    let ordersRows = '';
    if (orders.length === 0) {
        ordersRows = `<tr><td colspan="6" class="px-6 py-4 text-center text-muted">Không có đơn hàng phát sinh trong khoảng thời gian này.</td></tr>`;
    } else {
        ordersRows = orders.map(o => {
            const serviceLabel = o.items.map(item => item.serviceTypeLabel || item.serviceType).join(', ');
            const remaining = o.rawTotalAmount - (o.paidAmount || 0);
            return `
                <tr class="border-b border-gray-100 dark:border-gray-800 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td class="px-6 py-4">${o.orderDate}</td>
                    <td class="px-6 py-4 font-bold text-primary cursor-pointer hover:underline view-order-review-btn" data-id="${o.id}">#${o.id.slice(-6)}</td>
                    <td class="px-6 py-4 max-w-xs truncate hidden md:table-cell" title="${serviceLabel}">${serviceLabel}</td>
                    <td class="px-6 py-4 text-right font-medium">${formatCurrency(o.rawTotalAmount)}</td>
                    <td class="px-6 py-4 text-right text-success hidden md:table-cell">${formatCurrency(o.paidAmount || 0)}</td>
                    <td class="px-6 py-4 text-right font-semibold text-danger">${formatCurrency(remaining)}</td>
                </tr>
            `;
        }).join('');
    }

    // Phiếu thanh toán trong kỳ
    let paymentsRows = '';
    if (payments.length === 0) {
        paymentsRows = `<tr><td colspan="3" class="px-6 py-4 text-center text-muted">Không có phiếu thanh toán phát sinh trong khoảng thời gian này.</td></tr>`;
    } else {
        paymentsRows = payments.map(p => {
            const isRefund = p.amount < 0;
            const amountText = isRefund 
                ? `<span class="text-success font-semibold">Hoàn tiền: ${formatCurrency(Math.abs(p.amount))}</span>`
                : `<span class="text-primary font-semibold">${formatCurrency(p.amount)}</span>`;
            return `
                <tr class="border-b border-gray-100 dark:border-gray-800 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td class="px-6 py-4">${p.paymentDate}</td>
                    <td class="px-6 py-4 text-right">${amountText}</td>
                    <td class="px-6 py-4 max-w-xs truncate hidden md:table-cell" title="${p.note || ''}">${p.note || '-'}</td>
                </tr>
            `;
        }).join('');
    }

    return `
        <div class="space-y-8">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                ${statsHTML}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Bảng Đơn Hàng (2/3 chiều rộng) -->
                <div class="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 lg:col-span-2">
                    <h3 class="text-lg font-bold text-text dark:text-white mb-4 flex items-center gap-2"><i data-lucide="receipt" class="w-5 h-5 text-primary"></i> Đơn hàng phát sinh</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-gray-50 dark:bg-gray-800 text-xs font-bold uppercase tracking-wider text-muted border-b border-gray-100 dark:border-gray-800">
                                    <th class="px-6 py-3">Ngày</th>
                                    <th class="px-6 py-3">Mã đơn</th>
                                    <th class="px-6 py-3 hidden md:table-cell">Dịch vụ</th>
                                    <th class="px-6 py-3 text-right">Tổng tiền</th>
                                    <th class="px-6 py-3 text-right hidden md:table-cell">Đã trả</th>
                                    <th class="px-6 py-3 text-right">Còn nợ</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${ordersRows}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Bảng Thanh toán (1/3 chiều rộng) -->
                <div class="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                    <h3 class="text-lg font-bold text-text dark:text-white mb-4 flex items-center gap-2"><i data-lucide="credit-card" class="w-5 h-5 text-success"></i> Giao dịch thanh toán</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-gray-50 dark:bg-gray-800 text-xs font-bold uppercase tracking-wider text-muted border-b border-gray-100 dark:border-gray-800">
                                    <th class="px-6 py-3">Ngày</th>
                                    <th class="px-6 py-3 text-right">Số tiền</th>
                                    <th class="px-6 py-3 hidden md:table-cell">Ghi chú</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${paymentsRows}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
};

const renderPrintSheetHTML = (customer, initialDebt, periodRevenue, periodPaid, finalDebt, orders, payments) => {
    const formattedStartDate = new Date(startDate).toLocaleDateString('vi-VN');
    const formattedEndDate = new Date(endDate).toLocaleDateString('vi-VN');
    const todayStr = new Date().toLocaleDateString('vi-VN');

    const settings = state.settings || {};
    const pdfTitle = settings.pdfTitle || 'DỊCH VỤ THIẾT KẾ & IN SƠ ĐỒ MAY MẶC';
    const pdfAddress = settings.pdfAddress || 'Địa chỉ: 456 Đường XYZ, Quận Tân Bình, TP. HCM';
    const pdfPhone = settings.pdfPhone || 'Điện thoại: 0987.654.321';
    const pdfEmail = settings.pdfEmail || 'Email: support@insodo.com';
    const pdfCreator = settings.pdfCreator || 'Lê Văn A';

    // Đơn hàng rows
    let ordersRowsHTML = '';
    if (orders.length === 0) {
        ordersRowsHTML = `<tr><td colspan="7" style="text-align: center;">Không có đơn hàng phát sinh</td></tr>`;
    } else {
        ordersRowsHTML = orders.map((o, idx) => {
            const serviceLabel = o.items.map(item => item.serviceTypeLabel || item.serviceType).join(', ');
            const remaining = o.rawTotalAmount - (o.paidAmount || 0);
            return `
                <tr>
                    <td style="text-align: center;">${idx + 1}</td>
                    <td>${o.orderDate}</td>
                    <td style="font-weight: bold;">#${o.id.slice(-6)}</td>
                    <td>${serviceLabel}</td>
                    <td style="text-align: right;">${formatCurrency(o.rawTotalAmount)}</td>
                    <td style="text-align: right;">${formatCurrency(o.paidAmount || 0)}</td>
                    <td style="text-align: right; font-weight: bold;">${formatCurrency(remaining)}</td>
                </tr>
            `;
        }).join('');
    }

    // Phiếu thanh toán rows
    let paymentsRowsHTML = '';
    if (payments.length === 0) {
        paymentsRowsHTML = `<tr><td colspan="4" style="text-align: center;">Không có giao dịch thanh toán</td></tr>`;
    } else {
        paymentsRowsHTML = payments.map((p, idx) => {
            const isRefund = p.amount < 0;
            const amountText = isRefund 
                ? `Hoàn tiền: ${formatCurrency(Math.abs(p.amount))}`
                : formatCurrency(p.amount);
            return `
                <tr>
                    <td style="text-align: center;">${idx + 1}</td>
                    <td>${p.paymentDate}</td>
                    <td style="text-align: right; font-weight: bold;">${amountText}</td>
                    <td>${p.note || '-'}</td>
                </tr>
            `;
        }).join('');
    }

    return `
        <div style="font-family: 'Times New Roman', Times, serif; font-size: 14px; line-height: 1.5; color: black; background: white;">
            <!-- Phần Tiêu Đề Cửa Hàng -->
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
                <div>
                    <h3 style="margin: 0; font-size: 16px; text-transform: uppercase; font-weight: bold;">${pdfTitle}</h3>
                    <p style="margin: 3px 0 0 0; font-size: 12px; color: #555;">${pdfAddress}</p>
                    <p style="margin: 3px 0 0 0; font-size: 12px; color: #555;">${pdfPhone} - ${pdfEmail}</p>
                </div>
                <div style="text-align: right;">
                    <p style="margin: 0; font-size: 12px; font-style: italic;">Ngày lập phiếu: ${todayStr}</p>
                </div>
            </div>

            <!-- Tên Văn Bản -->
            <div class="print-title" style="text-align: center; text-transform: uppercase; font-size: 20px; font-weight: bold; margin: 25px 0 15px 0;">
                BẢNG ĐỐI SOÁT CÔNG NỢ CHI TIẾT
            </div>
            <div style="text-align: center; font-style: italic; margin-bottom: 25px; font-size: 13px;">
                Từ ngày: ${formattedStartDate} &nbsp;&nbsp;&nbsp;&nbsp; Đến ngày: ${formattedEndDate}
            </div>

            <!-- Thông Tin Khách Hàng -->
            <div style="margin-bottom: 25px; border: 1px solid #000; padding: 12px; border-radius: 4px;">
                <table style="width: 100%; border: none !important;">
                    <tr style="border: none !important;">
                        <td style="border: none !important; padding: 3px 0; width: 60%;"><strong>Khách hàng:</strong> ${customer.companyName || customer.contactPerson}</td>
                        <td style="border: none !important; padding: 3px 0; width: 40%;"><strong>Mã khách hàng:</strong> ${customer.customerCode}</td>
                    </tr>
                    <tr style="border: none !important;">
                        <td style="border: none !important; padding: 3px 0;"><strong>Người liên hệ:</strong> ${customer.contactPerson || '-'}</td>
                        <td style="border: none !important; padding: 3px 0;"><strong>Số điện thoại:</strong> ${customer.phone || 'N/A'}</td>
                    </tr>
                    <tr style="border: none !important;">
                        <td colspan="2" style="border: none !important; padding: 3px 0;"><strong>Địa chỉ:</strong> ${customer.address || 'N/A'}</td>
                    </tr>
                </table>
            </div>

            <!-- Bảng Tổng Hợp Công Nợ (4 Cột) -->
            <div style="margin-bottom: 25px;">
                <h4 style="margin: 0 0 10px 0; text-transform: uppercase; font-weight: bold; font-size: 14px;">I. Báo cáo tổng hợp số dư</h4>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 25%;">Dư nợ đầu kỳ</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 25%;">Phát sinh trong kỳ</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 25%;">Đã trả trong kỳ</th>
                            <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 25%;">Dư nợ cuối kỳ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold; color: ${initialDebt > 0 ? 'red' : 'green'};">${formatCurrency(initialDebt)}</td>
                            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(periodRevenue)}</td>
                            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold; color: green;">${formatCurrency(periodPaid)}</td>
                            <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold; color: ${finalDebt > 0 ? 'red' : 'green'};">${formatCurrency(finalDebt)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Bảng Kê Đơn Hàng Phát Sinh -->
            <div style="margin-bottom: 25px;">
                <h4 style="margin: 0 0 10px 0; text-transform: uppercase; font-weight: bold; font-size: 14px;">II. Chi tiết đơn hàng phát sinh</h4>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 5%;">STT</th>
                            <th style="border: 1px solid #000; padding: 6px; width: 15%;">Ngày</th>
                            <th style="border: 1px solid #000; padding: 6px; width: 15%;">Mã đơn</th>
                            <th style="border: 1px solid #000; padding: 6px; width: 30%;">Dịch vụ</th>
                            <th style="border: 1px solid #000; padding: 6px; text-align: right; width: 12%;">Tổng tiền</th>
                            <th style="border: 1px solid #000; padding: 6px; text-align: right; width: 11%;">Đã trả</th>
                            <th style="border: 1px solid #000; padding: 6px; text-align: right; width: 12%;">Còn nợ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ordersRowsHTML}
                    </tbody>
                </table>
            </div>

            <!-- Bảng Kê Thanh Toán -->
            <div style="margin-bottom: 35px;">
                <h4 style="margin: 0 0 10px 0; text-transform: uppercase; font-weight: bold; font-size: 14px;">III. Chi tiết giao dịch thanh toán trong kỳ</h4>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 8%;">STT</th>
                            <th style="border: 1px solid #000; padding: 6px; width: 22%;">Ngày giao dịch</th>
                            <th style="border: 1px solid #000; padding: 6px; text-align: right; width: 25%;">Số tiền thanh toán</th>
                            <th style="border: 1px solid #000; padding: 6px; width: 45%;">Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${paymentsRowsHTML}
                    </tbody>
                </table>
            </div>

            <!-- Phần Ký Tên (Chữ Ký Đối Soát) -->
            <div style="display: flex; justify-content: space-between; margin-top: 50px; padding: 0 40px;">
                <div style="text-align: center; width: 40%;">
                    <strong>ĐẠI DIỆN KHÁCH HÀNG</strong>
                    <br><span style="font-size: 11px; font-style: italic;">(Ký, ghi rõ họ tên)</span>
                    <br><br><br><br><br>
                </div>
                <div style="text-align: center; width: 40%;">
                    <strong>NGƯỜI LẬP BẢNG KÊ</strong>
                    <br><span style="font-size: 11px; font-style: italic;">(Ký, ghi rõ họ tên)</span>
                    <br><br><br><br><br>
                    <strong>${pdfCreator}</strong>
                </div>
            </div>
        </div>
    `;
};

const calculateAndRender = () => {
    const resultsContainer = document.getElementById('debt-settlement-results');
    const printSheetContainer = document.getElementById('debt-settlement-print-sheet');
    const printBtn = document.getElementById('print-settlement-btn');
    const exportExcelBtn = document.getElementById('export-excel-btn');
    if (!resultsContainer || !printSheetContainer) return;

    if (!selectedCustomerId) {
        resultsContainer.innerHTML = renderBlankState();
        printSheetContainer.innerHTML = '';
        if (printBtn) printBtn.disabled = true;
        if (exportExcelBtn) exportExcelBtn.disabled = true;
        lucide.createIcons();
        return;
    }

    if (printBtn) printBtn.disabled = false;
    if (exportExcelBtn) exportExcelBtn.disabled = false;

    const customer = state.customers.find(c => c.id === selectedCustomerId);
    if (!customer) {
        resultsContainer.innerHTML = renderBlankState();
        printSheetContainer.innerHTML = '';
        if (printBtn) printBtn.disabled = true;
        if (exportExcelBtn) exportExcelBtn.disabled = true;
        return;
    }

    const allOrders = state.orders.filter(order => order.customerId && order.customerId._id === selectedCustomerId);
    const allPayments = state.payments.filter(payment => payment.customerId && payment.customerId._id === selectedCustomerId);

    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');

    // 1. Tính dư nợ đầu kỳ (Outstanding debt before startDate)
    const ordersBefore = allOrders.filter(order => new Date(order.rawOrderDate) < start);
    const paymentsBefore = allPayments.filter(payment => new Date(payment.rawPaymentDate) < start);

    const debtBefore = ordersBefore.reduce((sum, o) => sum + (o.rawTotalAmount || 0), 0);
    const paidBefore = paymentsBefore.reduce((sum, p) => sum + (p.amount || 0), 0);
    const initialDebt = debtBefore - paidBefore;

    // 2. Tính phát sinh trong kỳ
    const ordersInPeriod = allOrders.filter(order => {
        const d = new Date(order.rawOrderDate);
        return d >= start && d <= end;
    });

    const periodRevenue = ordersInPeriod.reduce((sum, o) => sum + (o.rawTotalAmount || 0), 0);

    // 3. Tính đã thanh toán trong kỳ
    const paymentsInPeriod = allPayments.filter(payment => {
        const d = new Date(payment.rawPaymentDate);
        return d >= start && d <= end;
    });

    const periodPaid = paymentsInPeriod.reduce((sum, p) => sum + (p.amount || 0), 0);

    // 4. Tính dư nợ cuối kỳ
    const finalDebt = initialDebt + periodRevenue - periodPaid;

    // Render kết quả lên màn hình
    resultsContainer.innerHTML = renderResultsHTML(customer, initialDebt, periodRevenue, periodPaid, finalDebt, ordersInPeriod, paymentsInPeriod);
    
    // Render bản in
    printSheetContainer.innerHTML = renderPrintSheetHTML(customer, initialDebt, periodRevenue, periodPaid, finalDebt, ordersInPeriod, paymentsInPeriod);

    // Bắt sự kiện xem chi tiết đơn hàng
    resultsContainer.querySelectorAll('.view-order-review-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const orderId = btn.getAttribute('data-id');
            openOrderReviewModal(orderId);
        });
    });

    lucide.createIcons();
};

const setupCustomerDropdown = () => {
    const input = document.getElementById('settlement-customer-search-input');
    const hiddenSelect = document.getElementById('settlement-customer-id');
    const list = document.getElementById('settlement-customer-dropdown-list');
    const clearBtn = document.getElementById('settlement-clear-customer-btn');

    if (!input || !hiddenSelect || !list) return;

    const toggleClearBtn = () => {
        if (input.value.trim() !== '') {
            clearBtn?.classList.remove('hidden');
        } else {
            clearBtn?.classList.add('hidden');
        }
    };

    const renderList = (filterText = '') => {
        const filtered = state.customers.filter(c => 
            `${c.companyName || c.contactPerson || ''} ${c.customerCode} ${c.phone || ''}`.toLowerCase().includes(filterText.toLowerCase())
        );
        
        if (filtered.length === 0) {
            list.innerHTML = `<li class="px-3 py-2 text-sm text-gray-500 text-center">Không tìm thấy khách hàng</li>`;
            return;
        }

        let listHTML = '';
        listHTML += filtered.map(c => `
            <li class="px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 text-sm border-b border-gray-100 last:border-0" data-id="${c.id}" data-name="${c.companyName || c.contactPerson} (${c.customerCode})">
                <div class="font-medium">${c.companyName || c.contactPerson}</div>
                <div class="text-xs text-muted">Mã: ${c.customerCode} ${c.phone ? `- SĐT: ${c.phone}` : ''}</div>
            </li>
        `).join('');

        list.innerHTML = listHTML;
    };

    // Set initial value if state already has a selected customerId
    if (selectedCustomerId) {
        const selectedCustomer = state.customers.find(c => c.id === selectedCustomerId);
        if (selectedCustomer) {
            input.value = `${selectedCustomer.companyName || selectedCustomer.contactPerson} (${selectedCustomer.customerCode})`;
            hiddenSelect.value = selectedCustomerId;
            clearBtn?.classList.remove('hidden');
        }
    }

    input.addEventListener('click', () => { 
        list.classList.remove('hidden'); 
        renderList(input.value); 
    });
    
    input.addEventListener('input', (e) => { 
        list.classList.remove('hidden'); 
        toggleClearBtn(); 
        renderList(e.target.value); 
    });

    list.addEventListener('click', (e) => {
        const li = e.target.closest('li[data-id]');
        if (li) {
            const id = li.dataset.id;
            hiddenSelect.value = id;
            input.value = li.dataset.name;
            list.classList.add('hidden');
            toggleClearBtn();
            
            selectedCustomerId = id;
            calculateAndRender();
        }
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !list.contains(e.target) && !clearBtn?.contains(e.target)) {
            list.classList.add('hidden');
            const selectedCustomer = state.customers.find(c => c.id === hiddenSelect.value);
            if (selectedCustomer) {
                input.value = `${selectedCustomer.companyName || selectedCustomer.contactPerson} (${selectedCustomer.customerCode})`;
            } else {
                input.value = '';
            }
            toggleClearBtn();
        }
    });

    clearBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        input.value = ''; 
        hiddenSelect.value = ''; 
        toggleClearBtn();
        list.classList.add('hidden');
        
        selectedCustomerId = '';
        calculateAndRender();
    });

    lucide.createIcons();
};

const setupFilters = () => {
    const monthInput = document.getElementById('settlement-month');

    if (monthInput && typeof flatpickr !== 'undefined') {
        flatpickr(monthInput, {
            locale: 'vn',
            plugins: [
                new monthSelectPlugin({
                    shorthand: true,
                    dateFormat: "Y-m", // value format returned (e.g. 2026-05)
                    altInput: true,
                    altFormat: "Tháng m/Y", // display format (e.g. Tháng 05/2026)
                    theme: "light"
                })
            ],
            defaultDate: selectedMonth,
            onChange: (selectedDates, dateStr) => {
                selectedMonth = dateStr;
                const dates = getDatesFromMonth(selectedMonth);
                startDate = dates.start;
                endDate = dates.end;
                calculateAndRender();
            }
        });
    } else {
        monthInput?.addEventListener('change', (e) => {
            selectedMonth = e.target.value;
            const dates = getDatesFromMonth(selectedMonth);
            startDate = dates.start;
            endDate = dates.end;
            calculateAndRender();
        });
    }

    const clearBtn = document.getElementById('clear-all-filters-btn');
    clearBtn?.addEventListener('click', () => {
        // Reset customer search dropdown
        const input = document.getElementById('settlement-customer-search-input');
        const hiddenSelect = document.getElementById('settlement-customer-id');
        const clearCustomerBtn = document.getElementById('settlement-clear-customer-btn');
        if (input) input.value = '';
        if (hiddenSelect) hiddenSelect.value = '';
        if (clearCustomerBtn) clearCustomerBtn.classList.add('hidden');

        selectedCustomerId = '';
        selectedMonth = getCurrentMonthValue();
        const dates = getDatesFromMonth(selectedMonth);
        startDate = dates.start;
        endDate = dates.end;

        if (monthInput) {
            if (monthInput._flatpickr) {
                monthInput._flatpickr.setDate(selectedMonth);
            } else {
                monthInput.value = selectedMonth;
            }
        }

        calculateAndRender();
    });
};

const exportToExcel = () => {
    if (!selectedCustomerId) {
        ToastService.show('Vui lòng chọn khách hàng trước khi xuất Excel.', 'warning');
        return;
    }

    const customer = state.customers.find(c => c.id === selectedCustomerId);
    if (!customer) return;

    // Lọc đơn hàng phát sinh trong kỳ
    const allOrders = state.orders.filter(order => order.customerId && order.customerId._id === selectedCustomerId);
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    
    const ordersInPeriod = allOrders.filter(order => {
        const d = new Date(order.rawOrderDate);
        return d >= start && d <= end;
    });

    if (ordersInPeriod.length === 0) {
        ToastService.show('Không có đơn hàng phát sinh trong khoảng thời gian này.', 'warning');
        return;
    }

    const dichVuItems = [];
    const inSoDoItems = [];

    const getServiceTypeLabel = (type) => {
        const map = {
            'marker': 'In sơ đồ (Auto Marker)',
            'grading': 'Nhảy size (Grading)',
            'design': 'Thiết kế rập (Pattern Design)',
            'digitizing': 'Nhập rập (Pattern Digitizing)'
        };
        return map[type] || type || 'Khác';
    };

    ordersInPeriod.forEach(order => {
        const orderDateStr = order.rawOrderDate ? new Date(order.rawOrderDate).toLocaleDateString('vi-VN') : order.orderDate;
        const orderCode = `#${order._id.slice(-6)}`;
        const statusLabel = order.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán';

        order.items.forEach(item => {
            const isMarker = item.serviceType === 'marker' || order.serviceType === 'marker' || (item.description && item.description.toLowerCase().includes('in sơ đồ'));
            
            let description = item.description || item.fileName || 'Chi tiết';
            const serviceType = item.serviceTypeLabel || getServiceTypeLabel(item.serviceType);
            const qty = item.quantity || 0;
            const price = item.unitPrice || 0;
            const amount = item.amount || (qty * price);

            if (isMarker) {
                // Định dạng chi tiết kích thước sơ đồ nếu có
                let fileName = item.fileName || item.description || 'Sơ đồ';
                if (item.width && item.length) {
                    const copiesStr = item.copies ? `, ${item.copies} bản` : '';
                    fileName = `${fileName} (Khổ ${item.width}cm x ${item.length}m${copiesStr})`;
                }
                inSoDoItems.push({
                    orderDateStr,
                    orderCode,
                    fileName,
                    serviceType,
                    qty,
                    price,
                    amount,
                    statusLabel
                });
            } else {
                dichVuItems.push({
                    orderDateStr,
                    orderCode,
                    fileName: description,
                    serviceType,
                    qty,
                    price,
                    amount,
                    statusLabel
                });
            }
        });
    });

    // Tạo cấu trúc dữ liệu mảng 2 chiều (AOA) cho Excel
    const aoa = [
        ['BẢNG KÊ CHI TIẾT ĐƠN HÀNG PHÁT SINH TRONG KỲ'],
        [`Khách hàng: ${customer.companyName || customer.contactPerson} (${customer.customerCode})`],
        [`Kỳ đối soát: ${selectedMonth ? 'Tháng ' + selectedMonth.split('-')[1] + '/' + selectedMonth.split('-')[0] : startDate + ' đến ' + endDate}`],
        [`Ngày xuất file: ${new Date().toLocaleDateString('vi-VN')}`],
        [], // Dòng trống
    ];

    const merges = [];
    const addMerge = (startRow, startCol, endRow, endCol) => {
        merges.push({ s: { r: startRow, c: startCol }, e: { r: endRow, c: endCol } });
    };

    // Merge thông tin header (Cột A đến I)
    addMerge(0, 0, 0, 8);
    addMerge(1, 0, 1, 8);
    addMerge(2, 0, 2, 8);
    addMerge(3, 0, 3, 8);

    // --- PHẦN I: CHI TIẾT DỊCH VỤ ---
    const sec1TitleRow = aoa.length;
    aoa.push(['I. CHI TIẾT DỊCH VỤ (NHẢY SIZE / THIẾT KẾ RẬP / NHẬP RẬP)']);
    addMerge(sec1TitleRow, 0, sec1TitleRow, 8);

    const sec1HeaderRow = aoa.length;
    aoa.push(['STT', 'Ngày Đơn Hàng', 'Mã Đơn Hàng', 'Mô Tả Dịch Vụ', 'Loại Dịch Vụ', 'Số Lượng', 'Đơn Giá (đ)', 'Thành Tiền (đ)', 'Trạng Thái']);

    let totalQtyDichVu = 0;
    let totalAmountDichVu = 0;

    if (dichVuItems.length === 0) {
        const emptyRowIdx = aoa.length;
        aoa.push(['-', 'Không có dữ liệu dịch vụ phát sinh', '', '', '', '', '', '', '']);
        addMerge(emptyRowIdx, 1, emptyRowIdx, 8);
    } else {
        dichVuItems.forEach((item, index) => {
            aoa.push([
                index + 1,
                item.orderDateStr,
                item.orderCode,
                item.fileName,
                item.serviceType,
                item.qty,
                item.price,
                item.amount,
                item.statusLabel
            ]);
            totalQtyDichVu += item.qty;
            totalAmountDichVu += item.amount;
        });
    }

    const sec1TotalRow = aoa.length;
    aoa.push([
        'CỘNG CHI PHÍ DỊCH VỤ (I)',
        '',
        '',
        '',
        '',
        totalQtyDichVu,
        '',
        totalAmountDichVu,
        ''
    ]);
    addMerge(sec1TotalRow, 0, sec1TotalRow, 4);

    aoa.push([]); // Dòng trống
    aoa.push([]); // Dòng trống

    // --- PHẦN II: CHI TIẾT IN SƠ ĐỒ ---
    const sec2TitleRow = aoa.length;
    aoa.push(['II. CHI TIẾT IN SƠ ĐỒ (CHẠY SƠ ĐỒ / IN SƠ ĐỒ)']);
    addMerge(sec2TitleRow, 0, sec2TitleRow, 8);

    const sec2HeaderRow = aoa.length;
    aoa.push(['STT', 'Ngày Đơn Hàng', 'Mã Đơn Hàng', 'Tên File Sơ Đồ (Khổ rộng x Chiều dài)', 'Loại Dịch Vụ', 'Tổng Mét (m)', 'Đơn Giá/m (đ)', 'Thành Tiền (đ)', 'Trạng Thái']);

    let totalQtyInSoDo = 0;
    let totalAmountInSoDo = 0;

    if (inSoDoItems.length === 0) {
        const emptyRowIdx = aoa.length;
        aoa.push(['-', 'Không có dữ liệu in sơ đồ phát sinh', '', '', '', '', '', '', '']);
        addMerge(emptyRowIdx, 1, emptyRowIdx, 8);
    } else {
        inSoDoItems.forEach((item, index) => {
            aoa.push([
                index + 1,
                item.orderDateStr,
                item.orderCode,
                item.fileName,
                item.serviceType,
                item.qty,
                item.price,
                item.amount,
                item.statusLabel
            ]);
            totalQtyInSoDo += item.qty;
            totalAmountInSoDo += item.amount;
        });
    }

    const sec2TotalRow = aoa.length;
    aoa.push([
        'CỘNG CHI PHÍ IN SƠ ĐỒ (II)',
        '',
        '',
        '',
        '',
        totalQtyInSoDo,
        '',
        totalAmountInSoDo,
        ''
    ]);
    addMerge(sec2TotalRow, 0, sec2TotalRow, 4);

    aoa.push([]); // Dòng trống
    aoa.push([]); // Dòng trống

    // --- TỔNG CỘNG CHUNG ---
    const grandTotalRow = aoa.length;
    aoa.push([
        'TỔNG CỘNG CHUNG PHÁT SINH (I + II)',
        '',
        '',
        '',
        '',
        totalQtyDichVu + totalQtyInSoDo,
        '',
        totalAmountDichVu + totalAmountInSoDo,
        ''
    ]);
    addMerge(grandTotalRow, 0, grandTotalRow, 4);

    // Tạo workbook và sheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Áp dụng định dạng và trang trí bằng CSS Style của xlsx-js-style
    for (let cellRef in ws) {
        if (cellRef[0] === '!') continue; // Bỏ qua metadata
        const cell = ws[cellRef];
        if (!cell) continue;

        const addr = XLSX.utils.decode_cell(cellRef);
        const r = addr.r; // chỉ số hàng (0-based)
        const c = addr.c; // chỉ số cột (0-based)

        // Cấu hình style mặc định cho tất cả các ô
        cell.s = {
            font: { name: 'Segoe UI', sz: 10, color: { rgb: '1E293B' } },
            alignment: { vertical: 'center' },
            border: {
                top: { style: 'thin', color: { rgb: 'E2E8F0' } },
                bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
                left: { style: 'thin', color: { rgb: 'E2E8F0' } },
                right: { style: 'thin', color: { rgb: 'E2E8F0' } }
            }
        };

        // Cấu hình định dạng số
        if (cell.t === 'n') {
            if (c === 5) {
                cell.z = '#,##0.00';
            } else if (c === 6 || c === 7) {
                cell.z = '#,##0';
            }
        }

        // 1. Dòng tiêu đề chính (Hàng 0)
        if (r === 0) {
            cell.s.font = { name: 'Segoe UI', sz: 16, bold: true, color: { rgb: '0F172A' } };
            cell.s.alignment = { horizontal: 'center', vertical: 'center' };
            cell.s.border = {}; // Không viền cho tiêu đề chính
            continue;
        }

        // 2. Dòng thông tin phụ (Hàng 1, 2, 3)
        if (r >= 1 && r <= 3) {
            cell.s.font = { name: 'Segoe UI', sz: 10, italic: true, color: { rgb: '475569' } };
            cell.s.alignment = { horizontal: 'left', vertical: 'center' };
            cell.s.border = {}; // Không viền cho thông tin phụ
            continue;
        }

        // Bỏ qua dòng trống r === 4
        if (r === 4) {
            cell.s.border = {};
            continue;
        }

        // 3. Tiêu đề các mục (Phần I và Phần II)
        if (r === sec1TitleRow || r === sec2TitleRow) {
            cell.s.font = { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: 'FFFFFF' } };
            cell.s.fill = { fgColor: { rgb: '1E293B' } }; // Slate-800
            cell.s.alignment = { horizontal: 'left', vertical: 'center' };
            cell.s.border = {
                top: { style: 'thin', color: { rgb: '1E293B' } },
                bottom: { style: 'thin', color: { rgb: '1E293B' } }
            };
            continue;
        }

        // 4. Dòng tiêu đề bảng (Headers)
        if (r === sec1HeaderRow || r === sec2HeaderRow) {
            cell.s.font = { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: '0F172A' } };
            cell.s.fill = { fgColor: { rgb: 'E2E8F0' } }; // Slate-200
            cell.s.border = {
                top: { style: 'thin', color: { rgb: '94A3B8' } },
                bottom: { style: 'medium', color: { rgb: '0F172A' } },
                left: { style: 'thin', color: { rgb: 'CBD5E1' } },
                right: { style: 'thin', color: { rgb: 'CBD5E1' } }
            };
            // Căn lề tiêu đề cột
            if (c === 0 || c === 1 || c === 2 || c === 8) {
                cell.s.alignment.horizontal = 'center';
            } else if (c === 5 || c === 6 || c === 7) {
                cell.s.alignment.horizontal = 'right';
            } else {
                cell.s.alignment.horizontal = 'left';
            }
            continue;
        }

        // 5. Dòng tổng cộng chi phí từng phần
        if (r === sec1TotalRow || r === sec2TotalRow) {
            cell.s.font = { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: '0F172A' } };
            cell.s.fill = { fgColor: { rgb: 'F1F5F9' } }; // Slate-100
            cell.s.border = {
                top: { style: 'thin', color: { rgb: '94A3B8' } },
                bottom: { style: 'thin', color: { rgb: '94A3B8' } },
                left: { style: 'thin', color: { rgb: 'E2E8F0' } },
                right: { style: 'thin', color: { rgb: 'E2E8F0' } }
            };
            if (c === 5 || c === 7) {
                cell.s.alignment.horizontal = 'right';
            } else {
                cell.s.alignment.horizontal = 'left';
            }
            continue;
        }

        // 6. Dòng tổng cộng chung cuối cùng
        if (r === grandTotalRow) {
            cell.s.font = { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: 'B91C1C' } }; // Màu đỏ đô nổi bật
            cell.s.fill = { fgColor: { rgb: 'FEF2F2' } }; // Nền đỏ hồng cực nhẹ
            cell.s.border = {
                top: { style: 'thin', color: { rgb: 'EF4444' } },
                bottom: { style: 'double', color: { rgb: 'EF4444' } }, // Gạch chân kép tài chính
                left: { style: 'thin', color: { rgb: 'FCA5A5' } },
                right: { style: 'thin', color: { rgb: 'FCA5A5' } }
            };
            if (c === 5 || c === 7) {
                cell.s.alignment.horizontal = 'right';
            } else {
                cell.s.alignment.horizontal = 'left';
            }
            continue;
        }

        // 7. Các dòng dữ liệu thường (Zebra Striping)
        const isDataRow = (r > sec1HeaderRow && r < sec1TotalRow) || (r > sec2HeaderRow && r < sec2TotalRow);
        if (isDataRow) {
            // Đổi màu nền xen kẽ để dễ đọc
            if (r % 2 === 0) {
                cell.s.fill = { fgColor: { rgb: 'F8FAFC' } }; // Slate-50
            }
            
            // Căn lề dữ liệu theo cột
            if (c === 0 || c === 1 || c === 2 || c === 8) {
                cell.s.alignment.horizontal = 'center';
            } else if (c === 5 || c === 6 || c === 7) {
                cell.s.alignment.horizontal = 'right';
            } else {
                cell.s.alignment.horizontal = 'left';
            }
        }
    }

    // Cấu hình chiều rộng cột (width)
    ws['!cols'] = [
        { wch: 6 },  // STT
        { wch: 15 }, // Ngày Đơn Hàng
        { wch: 15 }, // Mã Đơn Hàng
        { wch: 45 }, // Mô Tả / Tên File Sơ Đồ (Giãn thêm cột mô tả để hiển thị thông số khổ rập rõ ràng)
        { wch: 25 }, // Loại Dịch Vụ
        { wch: 15 }, // Số Lượng
        { wch: 18 }, // Đơn Giá
        { wch: 20 }, // Thành Tiền
        { wch: 18 }  // Trạng Thái
    ];

    // Gán danh sách merges
    ws['!merges'] = merges;

    XLSX.utils.book_append_sheet(wb, ws, 'Chi tiết đối soát');

    // Tên file lưu: Doi_Soat_Chi_Tiet_KhachHang_Thang_MM_YYYY.xlsx
    const cleanCustomerName = (customer.companyName || customer.contactPerson).replace(/[^a-zA-Z0-9]/g, '_');
    const monthStr = selectedMonth ? selectedMonth.replace('-', '_') : 'Ky_Doi_Soat';
    const fileName = `Doi_Soat_Chi_Tiet_${cleanCustomerName}_${monthStr}.xlsx`;

    XLSX.writeFile(wb, fileName);
    ToastService.show('Xuất file Excel thành công!', 'success');
};

const setupActions = () => {
    const printBtn = document.getElementById('print-settlement-btn');
    printBtn?.addEventListener('click', () => {
        if (!selectedCustomerId) return;
        window.print();
    });

    const exportExcelBtn = document.getElementById('export-excel-btn');
    exportExcelBtn?.addEventListener('click', () => {
        exportToExcel();
    });
};

export const renderDebtSettlementPage = async () => {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    // Reset parameters if blank
    if (!selectedMonth) selectedMonth = getCurrentMonthValue();
    const dates = getDatesFromMonth(selectedMonth);
    startDate = dates.start;
    endDate = dates.end;

    LoadingSpinnerService.show();
    try {
        const [customers, orders, payments, settings] = await Promise.all([
            apiService.getCustomers(),
            apiService.getOrders(),
            apiService.getPayments(),
            apiService.getPricingSettings()
        ]);
        state.customers = customers;
        state.orders = orders;
        state.payments = payments;
        state.settings = settings;
    } catch (error) {
        ToastService.show('Không thể tải dữ liệu: ' + error.message, 'danger');
    } finally {
        LoadingSpinnerService.hide();
    }

    const pageContent = `
        <style>
            @media print {
                /* Ẩn các thành phần bên ngoài */
                aside, header, nav, button, .print-hidden, #clear-all-filters-btn, .filter-section {
                    display: none !important;
                }
                body, main, #main-content, #app {
                    margin: 0 !important;
                    padding: 0 !important;
                    background-color: white !important;
                    color: black !important;
                }
                .p-8 {
                    padding: 0 !important;
                }
                #debt-settlement-print-sheet {
                    display: block !important;
                    background-color: white !important;
                    color: black !important;
                    width: 100% !important;
                }
                table {
                    border-collapse: collapse !important;
                    width: 100% !important;
                }
                th, td {
                    border: 1px solid #000 !important;
                    padding: 6px 8px !important;
                }
                th {
                    background-color: #f2f2f2 !important;
                    color: #000 !important;
                }
            }
            #debt-settlement-print-sheet {
                display: none;
            }
        </style>
        
        <div id="debt-settlement-container" class="p-8 print-hidden">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h1 class="text-3xl font-bold text-text dark:text-white">Chốt Công Nợ</h1>
                <div class="flex flex-wrap items-center gap-3">
                    <button id="export-excel-btn" class="bg-success text-white hover:bg-opacity-90 font-semibold py-2 px-4 rounded-lg flex items-center shadow-md transition-transform hover:scale-105" ${selectedCustomerId ? '' : 'disabled'}>
                        <i data-lucide="file-spreadsheet" class="mr-2 h-5 w-5"></i> Xuất Excel Đơn Hàng
                    </button>
                    <button id="print-settlement-btn" class="bg-accent text-white hover:bg-opacity-90 font-semibold py-2 px-4 rounded-lg flex items-center shadow-md transition-transform hover:scale-105" ${selectedCustomerId ? '' : 'disabled'}>
                        <i data-lucide="printer" class="mr-2 h-5 w-5"></i> In Công Nợ (PDF)
                    </button>
                </div>
            </div>

            <!-- Bộ lọc chọn khách hàng và ngày -->
            <div class="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm mb-6 border border-gray-100 dark:border-gray-800 filter-section">
                <div class="flex justify-between items-center mb-4 pb-2 border-b border-gray-50 dark:border-gray-800">
                    <h2 class="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1"><i data-lucide="sliders-horizontal" class="w-3.5 h-3.5"></i> Chọn Khách hàng & Chọn Tháng chốt nợ</h2>
                    <button id="clear-all-filters-btn" class="text-xs font-semibold text-danger hover:text-opacity-80 flex items-center gap-1 transition-colors hover:scale-105 active:scale-95 duration-150">
                        <i data-lucide="filter-x" class="w-3.5 h-3.5"></i> Xóa bộ lọc
                    </button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <!-- Chọn khách hàng -->
                    <div class="relative w-full">
                        <label class="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Khách hàng</label>
                        <div class="relative">
                            <input type="text" id="settlement-customer-search-input" class="w-full text-sm bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg p-2.5 pr-8 text-text dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Nhập tên/mã KH..." autocomplete="off">
                            <div class="absolute inset-y-0 right-0 flex items-center pr-2">
                                <button id="settlement-clear-customer-btn" type="button" class="hidden p-1 text-gray-400 hover:text-danger focus:outline-none"><i data-lucide="x" class="w-4 h-4"></i></button>
                                <i data-lucide="chevron-down" class="w-4 h-4 ml-1 text-muted pointer-events-none"></i>
                            </div>
                            <input type="hidden" id="settlement-customer-id" value="${selectedCustomerId}">
                            <ul id="settlement-customer-dropdown-list" class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg hidden max-h-60 overflow-y-auto"></ul>
                        </div>
                    </div>

                    <!-- Chọn Tháng -->
                    <div>
                        <label class="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Chọn Tháng</label>
                        <div class="relative">
                            <input type="text" id="settlement-month" class="w-full text-sm bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg p-2.5 pr-10 text-text dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer" placeholder="Chọn tháng..." readonly />
                            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted">
                                <i data-lucide="calendar" class="w-4 h-4"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Vùng hiển thị kết quả chốt công nợ -->
            <div id="debt-settlement-results">
                ${renderBlankState()}
            </div>
        </div>

        <!-- BẢN IN DÀNH CHO XUẤT FILE/IN RA GIẤY (Chỉ hiển thị khi @media print) -->
        <div id="debt-settlement-print-sheet" class="hidden"></div>
    `;

    mainContent.innerHTML = pageContent;
    lucide.createIcons();

    setupCustomerDropdown();
    setupFilters();
    setupActions();

    if (selectedCustomerId) {
        calculateAndRender();
    }
};
