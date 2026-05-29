export const DataTable = ({ columns, data, showActions = true }) => {
    // Tạo hàng tiêu đề của bảng
    const header = columns.map(col => `
        <th class="p-4 text-left text-sm font-semibold text-text dark:text-gray-300 uppercase tracking-wider ${col.hiddenMobile ? 'hidden md:table-cell' : ''}">${col.label}</th>
    `).join('');

    // Tạo các hàng dữ liệu của bảng
    const rows = data.map(row => `
        <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
            ${columns.map(col => `
                <td class="p-4 text-sm text-muted ${col.hiddenMobile ? 'hidden md:table-cell' : ''}">${row[col.key] || ''}</td>
            `).join('')}
            ${showActions ? `
                <td class="p-4 text-right">
                    <button class="edit-btn text-accent hover:text-blue-700 p-1" title="Chỉnh sửa" data-id="${row.id}">
                        <i data-lucide="edit" class="w-4 h-4"></i>
                    </button>
                    <button class="delete-btn text-danger hover:text-red-700 p-1" title="Xóa" data-id="${row.id}">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            ` : ''}
        </tr>
    `).join('');

    return `
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            ${header}
                            ${showActions ? `<th class="p-4 text-right text-sm font-semibold text-text dark:text-gray-300 uppercase">Hành động</th>` : ''}
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>
    `;
};