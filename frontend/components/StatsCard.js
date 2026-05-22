export const StatsCard = ({ title, value, icon, color = 'primary' }) => {
    // Định nghĩa màu sắc dựa trên prop 'color'
    const iconBgColor = {
        primary: 'bg-primary',
        accent: 'bg-accent',
        success: 'bg-success',
        warning: 'bg-warning',
        danger: 'bg-danger',
    }[color] || 'bg-primary';

    return `
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 flex items-center justify-between">
            <div class="flex flex-col">
                <span class="text-sm font-medium text-muted">${title}</span>
                <span class="text-3xl font-bold text-text dark:text-white mt-1">${value}</span>
            </div>
            <div class="p-3 rounded-full ${iconBgColor} text-white">
                <i data-lucide="${icon}" class="w-6 h-6"></i>
            </div>
        </div>
    `;
};