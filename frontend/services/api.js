import { mockCustomers, mockReceivables, mockInvoices, mockPriceSettings, mockOrders, mockRevenueChartData, mockDashboardStats } from '../js/mockData.js';

/**
 * Simulates network delay.
 * @param {number} ms - Milliseconds to wait.
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * A mock API service layer. In Phase 2, this will be replaced with actual fetch calls.
 */
export const apiService = {
    /**
     * Fetches all customers.
     */
    async getCustomers() {
        await wait(500); // Simulate network latency
        console.log('API: Fetched customers');
        return mockCustomers;
    },

    /**
     * Saves a customer (new or existing).
     * @param {object} customerData - The customer data to save.
     */
    async saveCustomer(customerData) {
        await wait(300);
        if (customerData.id) {
            // In a real app, find and update
            console.log('API: Updated customer', customerData);
        } else {
            // In a real app, add to the database
            console.log('API: Created new customer', customerData);
        }
        return { success: true, data: customerData };
    },

    /**
     * Deletes a customer.
     * @param {number} customerId - The ID of the customer to delete.
     */
    async deleteCustomer(customerId) {
        await wait(300);
        // In a real app, remove from the database
        console.log('API: Deleted customer with ID', customerId);
        return { success: true };
    },

    /**
     * Fetches all receivables.
     */
    async getReceivables() {
        await wait(500);
        console.log('API: Fetched receivables');
        return mockReceivables;
    },

    /**
     * Fetches all invoices.
     */
    async getInvoices() {
        await wait(500);
        console.log('API: Fetched invoices');
        return mockInvoices;
    },

    /**
     * Saves a manual service order.
     * @param {object} orderData - The order data to save.
     */
    async saveManualOrder(orderData) {
        await wait(400);
        console.log('API: Saving manual order', orderData);
        return { success: true, data: orderData };
    },

    /**
     * Fetches marker pricing settings.
     */
    async getMarkerPricingSettings() {
        await wait(300);
        console.log('API: Fetched marker pricing settings');
        return mockPriceSettings.markerPricing;
    },

    /**
     * Saves a marker order (batch of PLT files).
     * @param {object} orderPayload - The payload containing customerId, items, and markerCreationFee.
     */
    async saveMarkerOrder(orderPayload) {
        await wait(700);
        console.log('API: Saving marker order', orderPayload);
        return { success: true, orderId: Date.now() }; // Simulate a new order ID
    },

    /**
     * Saves a payment record.
     * @param {object} paymentData - The payment data.
     */
    async savePayment(paymentData) {
        await wait(400);
        console.log('API: Saving payment', paymentData);
        // In a real app, this would update customer's debt.
        return { success: true };
    },

    /**
     * Creates a new invoice.
     * @param {object} invoiceData - Data for generating the invoice.
     */
    async createInvoice(invoiceData) {
        await wait(600);
        console.log('API: Creating invoice', invoiceData);
        // In a real app, this would find all completed orders for the customer in the given month and generate an invoice.
        return { success: true, invoiceId: `HD-MOCK-${Date.now()}` };
    },

    /**
     * Fetches data for the dashboard statistics cards.
     */
    async getDashboardStats() {
        await wait(200);
        console.log('API: Fetched dashboard stats');
        return mockDashboardStats;
    },

    /**
     * Fetches data for the revenue chart.
     */
    async getRevenueChartData() {
        await wait(400);
        console.log('API: Fetched revenue chart data');
        return mockRevenueChartData;
    },

    /**
     * Fetches all pricing settings.
     */
    async getPricingSettings() {
        await wait(300);
        console.log('API: Fetched all pricing settings');
        return mockPriceSettings;
    },

    /**
     * Saves all pricing settings.
     * @param {object} settingsData - The new settings data.
     */
    async savePricingSettings(settingsData) {
        await wait(500);
        console.log('API: Saved pricing settings', settingsData);
        // In a real app, this would update the settings document in MongoDB.
        return { success: true };
    }
};