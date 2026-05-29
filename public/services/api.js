import { AuthService } from './auth.js';

const API_BASE_URL = '/api'; // Use relative path to work on any port/domain

// Wrapper for fetch to include Authorization header
const fetchWithAuth = async (url, options = {}) => {
    const token = AuthService.getToken();
    const headers = {
        ...options.headers,
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
        AuthService.logout();
        throw new Error('Phiên đăng nhập đã hết hạn hoặc không có quyền truy cập.');
    }

    return response;
};

// Helper function to handle API responses and errors
const handleResponse = async (response) => {
    const contentType = response.headers.get("content-type");
    if (!response.ok) {
        let errorData;
        if (contentType && contentType.indexOf("application/json") !== -1) {
            errorData = await response.json();
        } else {
            errorData = { message: await response.text() };
        }
        throw new Error(errorData.message || 'Đã có lỗi xảy ra từ máy chủ.');
    }
    // Handle cases where response might be empty (e.g., DELETE)
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    }
    return {};
};

// Helper function to format date string to a more readable format
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
};

export const apiService = {
    async getCustomers() {
        const response = await fetchWithAuth(`${API_BASE_URL}/customers`);
        const customers = await handleResponse(response);
        // Map _id to id and format date for frontend consistency
        return customers.map(customer => ({
            ...customer,
            id: customer._id, // DataTable component expects 'id'
            createdAt: formatDate(customer.createdAt)
        }));
    },

    async saveCustomer(customerData) {
        const { id, ...data } = customerData;
        const url = id ? `${API_BASE_URL}/customers/${id}` : `${API_BASE_URL}/customers`;
        const method = id ? 'PUT' : 'POST';

        const response = await fetchWithAuth(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    async deleteCustomer(id) {
        const response = await fetchWithAuth(`${API_BASE_URL}/customers/${id}`, {
            method: 'DELETE',
        });
        return handleResponse(response);
    },

    async getOrders() {
        const response = await fetchWithAuth(`${API_BASE_URL}/orders`);
        const orders = await handleResponse(response);
        // Map data for frontend consistency
        return orders.map(order => ({
            ...order,
            id: order._id,
            customerName: order.customerId ? `${order.customerId.companyName || 'N/A'} (${order.customerId.customerCode || 'N/A'})` : 'Khách hàng không xác định',
            orderDate: formatDate(order.orderDate),
            rawOrderDate: order.orderDate,
            rawTotalAmount: order.totalAmount,
            totalAmount: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount),
            status: order.status, // We can translate this later if needed
        }));
    },

    async getOrderById(id) {
        const response = await fetchWithAuth(`${API_BASE_URL}/orders/${id}`);
        // The detail view will handle the raw data, so no extra mapping is needed here.
        return handleResponse(response);
    },

    async deleteOrder(id) {
        const response = await fetchWithAuth(`${API_BASE_URL}/orders/${id}`, {
            method: 'DELETE',
        });
        return handleResponse(response);
    },

    async createOrder(orderData) {
        const response = await fetchWithAuth(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData),
        });
        return handleResponse(response);
    },

    async updateOrder(id, orderData) {
        const response = await fetchWithAuth(`${API_BASE_URL}/orders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData),
        });
        return handleResponse(response);
    },

    // --- Settings API ---
    async getPricingSettings() {
        const response = await fetchWithAuth(`${API_BASE_URL}/settings/pricing`);
        return handleResponse(response);
    },

    async savePricingSettings(settingsData) {
        const response = await fetchWithAuth(`${API_BASE_URL}/settings/pricing`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settingsData),
        });
        return handleResponse(response);
    },

    // --- Receivables & Payments API ---
    async getReceivables() {
        const response = await fetchWithAuth(`${API_BASE_URL}/receivables`);
        return handleResponse(response);
    },

    async savePayment(paymentData) {
        const response = await fetchWithAuth(`${API_BASE_URL}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData),
        });
        return handleResponse(response);
    },

    async getPayments() {
        const response = await fetchWithAuth(`${API_BASE_URL}/payments`);
        const payments = await handleResponse(response);
        return payments.map(payment => ({
            ...payment,
            id: payment._id,
            customerName: payment.customerId ? `${payment.customerId.companyName || payment.customerId.contactPerson || 'Không xác định'} (${payment.customerId.customerCode || 'N/A'})` : 'Khách hàng không xác định',
            paymentDate: formatDate(payment.paymentDate),
            rawPaymentDate: payment.paymentDate,
            amount: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(payment.amount),
        }));
    },

    async getDashboardStats() {
        const [customers, orders, receivables] = await Promise.all([
            this.getCustomers(),
            this.getOrders(),
            this.getReceivables()
        ]);

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // Doanh thu tháng: Tổng totalAmount của các đơn hàng trong tháng hiện tại
        const monthlyRevenue = orders.reduce((sum, order) => {
            if (!order.rawOrderDate) return sum;
            const d = new Date(order.rawOrderDate);
            if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
                return sum + (order.rawTotalAmount || 0);
            }
            return sum;
        }, 0);

        // Công nợ còn lại: Tổng remainingAmount từ receivables
        const outstandingDebt = receivables.reduce((sum, r) => sum + (r.remainingAmount || 0), 0);

        // Đơn hàng đang xử lý: Số lượng đơn hàng chưa thanh toán ('unpaid')
        const processingOrders = orders.filter(order => order.status === 'unpaid').length;

        return {
            totalCustomers: customers.length,
            monthlyRevenue,
            outstandingDebt,
            processingOrders
        };
    },

    async getRevenueChartData() {
        const orders = await this.getOrders();
        
        // Tạo danh sách 6 tháng gần nhất từ hiện tại giật lùi về trước
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                year: d.getFullYear(),
                month: d.getMonth(),
                label: `Tháng ${d.getMonth() + 1}`
            });
        }

        // Tính doanh thu từng tháng
        const data = months.map(m => {
            const monthlySum = orders.reduce((sum, order) => {
                if (!order.rawOrderDate) return sum;
                const od = new Date(order.rawOrderDate);
                if (od.getFullYear() === m.year && od.getMonth() === m.month) {
                    return sum + (order.rawTotalAmount || 0);
                }
                return sum;
            }, 0);
            return monthlySum;
        });

        return {
            labels: months.map(m => m.label),
            datasets: [{
                label: 'Doanh thu (VNĐ)',
                data: data,
                fill: true,
                borderColor: 'rgb(56, 189, 248)',
                backgroundColor: 'rgba(56, 189, 248, 0.2)',
                tension: 0.3,
            }]
        };
    }
};
