export const mockCustomers = [
    {
        id: 1,
        customerCode: 'KH001',
        companyName: 'Công ty TNHH May Mặc An Phước',
        contactPerson: 'Nguyễn Văn A',
        phone: '0909123456',
        address: '123 Đường ABC, Quận 1, TP. HCM',
        createdAt: '2023-10-01',
    },
    {
        id: 2,
        customerCode: 'KH002',
        companyName: 'Xưởng May Gia Công Bình Minh',
        contactPerson: 'Trần Thị B',
        phone: '0987654321',
        address: '456 Đường XYZ, Quận Tân Bình, TP. HCM',
        createdAt: '2023-10-05',
    },
    {
        id: 3,
        customerCode: 'KH003',
        companyName: 'Công ty CP Dệt May Sài Gòn',
        contactPerson: 'Lê Văn C',
        phone: '0912345678',
        address: '789 Đường LMN, Quận 3, TP. HCM',
        createdAt: '2023-10-15',
    },
    {
        id: 4,
        customerCode: 'KH004',
        companyName: 'Hộ Kinh Doanh Thời Trang Việt',
        contactPerson: 'Phạm Thị D',
        phone: '0939888999',
        address: '101 Đường PQR, Quận Gò Vấp, TP. HCM',
        createdAt: '2023-11-02',
    },
];

export const mockPriceSettings = {
    markerPricing: [
        { id: 1, chargeWidth: 160, maxWidth: 159.99, unitPrice: 10000, isActive: true },
        { id: 2, chargeWidth: 185, maxWidth: 169.99, unitPrice: 12000, isActive: true },
        { id: 3, chargeWidth: 200, maxWidth: 999, unitPrice: 15000, isActive: true }
    ],
    gradingRate: 50000, // Đơn giá/chi tiết
    designRate: 200000, // Đơn giá/giờ
    digitizingRate: 80000, // Đơn giá/chi tiết
};

// Dữ liệu mẫu cho công nợ (để apiService.getReceivables có dữ liệu)
export const mockReceivables = [
    {
        id: 1,
        customerCode: 'KH001',
        companyName: 'Công ty TNHH May Mặc An Phước',
        totalAmount: 55000000,
        paidAmount: 40000000,
        get remainingAmount() { return this.totalAmount - this.paidAmount; }
    },
    {
        id: 2,
        customerCode: 'KH002',
        companyName: 'Xưởng May Gia Công Bình Minh',
        totalAmount: 32500000,
        paidAmount: 32500000,
        get remainingAmount() { return this.totalAmount - this.paidAmount; }
    },
    {
        id: 3,
        customerCode: 'KH003',
        companyName: 'Công ty CP Dệt May Sài Gòn',
        totalAmount: 89000000,
        paidAmount: 50000000,
        get remainingAmount() { return this.totalAmount - this.paidAmount; }
    },
];

export const mockInvoices = [
    {
        id: 1,
        invoiceNumber: 'HD-2023-10-001',
        customerId: 1,
        customerName: 'Công ty TNHH May Mặc An Phước',
        monthYear: '10/2023',
        totalAmount: 1550000,
        status: 'paid',
        statusLabel: 'Đã thanh toán',
        statusColor: 'success'
    },
    {
        id: 2,
        invoiceNumber: 'HD-2023-10-002',
        customerId: 2,
        customerName: 'Xưởng May Gia Công Bình Minh',
        monthYear: '10/2023',
        totalAmount: 500000,
        status: 'unpaid',
        statusLabel: 'Chưa thanh toán',
        statusColor: 'warning'
    },
    {
        id: 3,
        invoiceNumber: 'HD-2023-09-001',
        customerId: 3,
        customerName: 'Công ty CP Dệt May Sài Gòn',
        monthYear: '09/2023',
        totalAmount: 2100000,
        status: 'overdue',
        statusLabel: 'Quá hạn',
        statusColor: 'danger'
    },
];

export const mockRevenueChartData = {
    labels: ['Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11'],
    datasets: [{
        label: 'Doanh thu (VNĐ)',
        data: [65000000, 59000000, 80000000, 81000000, 56000000, 125000000],
        fill: true,
        borderColor: 'rgb(56, 189, 248)', // accent color from config
        backgroundColor: 'rgba(56, 189, 248, 0.2)',
        tension: 0.3,
    }]
};

export const mockDashboardStats = {
    totalCustomers: 45,
    monthlyRevenue: 125000000,
    outstandingDebt: 35000000,
    processingOrders: 12,
};

export const mockOrders = [
    {
        id: 101,
        orderCode: 'DH-001',
        customerId: 1,
        customerName: 'Công ty TNHH May Mặc An Phước',
        serviceType: 'marker',
        serviceLabel: 'Chạy sơ đồ',
        description: 'Sơ mi nam (3 files)',
        amount: 350000,
        status: 'completed',
        statusLabel: 'Hoàn thành',
        orderDate: '2023-11-10',
    },
    {
        id: 102,
        orderCode: 'DH-002',
        customerId: 2,
        customerName: 'Xưởng May Gia Công Bình Minh',
        serviceType: 'grading',
        serviceLabel: 'Nhảy size',
        description: 'Áo thun nữ (5 size)',
        amount: 500000,
        status: 'invoiced',
        statusLabel: 'Đã xuất HĐ',
        orderDate: '2023-11-11',
    },
    {
        id: 103,
        orderCode: 'DH-003',
        customerId: 1,
        customerName: 'Công ty TNHH May Mặc An Phước',
        serviceType: 'design',
        serviceLabel: 'Thiết kế rập',
        description: 'Rập đầm dạ hội',
        amount: 1200000,
        status: 'paid',
        statusLabel: 'Đã thanh toán',
        orderDate: '2023-11-12',
    },
    {
        id: 104,
        orderCode: 'DH-004',
        customerId: 3,
        customerName: 'Công ty CP Dệt May Sài Gòn',
        serviceType: 'marker',
        serviceLabel: 'Chạy sơ đồ',
        description: 'Quần tây (5 files)',
        amount: 780000,
        status: 'completed',
        statusLabel: 'Hoàn thành',
        orderDate: '2023-11-15',
    },
    {
        id: 105,
        orderCode: 'DH-005',
        customerId: 4,
        customerName: 'Hộ Kinh Doanh Thời Trang Việt',
        serviceType: 'digitizing',
        serviceLabel: 'Nhập rập',
        description: 'Rập giấy sang file',
        amount: 250000,
        status: 'pending',
        statusLabel: 'Đang xử lý',
        orderDate: '2023-11-16',
    },
];