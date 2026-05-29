import { AuthService } from '../services/auth.js';
import { ToastService } from '../components/Toast.js';
import { ModalService } from '../components/ModalService.js';

export const renderUserManagementPage = async () => {
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = `
        <div class="p-8 max-w-7xl mx-auto">
            <div class="flex justify-between items-center mb-8">
                <h1 class="text-3xl font-bold text-text dark:text-white flex items-center">
                    <i data-lucide="users-cog" class="mr-3 h-8 w-8 text-primary"></i>
                    Quản lý người dùng
                </h1>
                <button id="add-user-btn" class="bg-primary hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors flex items-center shadow-md">
                    <i data-lucide="plus" class="mr-2 h-5 w-5"></i>
                    Thêm người dùng
                </button>
            </div>
            
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                <th class="p-4 font-semibold text-gray-600 dark:text-gray-300">Tên hiển thị</th>
                                <th class="p-4 font-semibold text-gray-600 dark:text-gray-300 hidden md:table-cell">Tên đăng nhập</th>
                                <th class="p-4 font-semibold text-gray-600 dark:text-gray-300">Vai trò</th>
                                <th class="p-4 font-semibold text-gray-600 dark:text-gray-300 hidden md:table-cell">Trạng thái</th>
                                <th class="p-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody id="users-table-body" class="divide-y divide-gray-200 dark:divide-gray-700">
                            <tr><td colspan="5" class="p-4 text-center">Đang tải...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    lucide.createIcons();
    await loadUsers();

    document.getElementById('add-user-btn').addEventListener('click', () => {
        openUserModal();
    });
};

const fetchUsers = async () => {
    try {
        const token = AuthService.getToken();
        const res = await fetch('/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if(data.success) return data.data;
        throw new Error(data.message);
    } catch (e) {
        ToastService.error(e.message);
        return [];
    }
};

const loadUsers = async () => {
    const users = await fetchUsers();
    const tbody = document.getElementById('users-table-body');
    const currentUser = AuthService.getUser();
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500">Không có dữ liệu</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
            <td class="p-4 text-gray-800 dark:text-gray-200 font-medium">${user.displayName}</td>
            <td class="p-4 text-gray-600 dark:text-gray-400 hidden md:table-cell">${user.username}</td>
            <td class="p-4">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">
                    ${user.role === 'admin' ? 'Admin' : 'Nhân viên'}
                </span>
            </td>
            <td class="p-4 hidden md:table-cell">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${user.isActive ? 'Hoạt động' : 'Đã khóa'}
                </span>
            </td>
            <td class="p-4 text-right">
                <button class="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" onclick="window.editUser('${user._id}')" title="Sửa">
                    <i data-lucide="edit-2" class="h-4 w-4"></i>
                </button>
                ${(user.username !== 'admin' && user._id !== currentUser._id) ? `
                <button class="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" onclick="window.deleteUser('${user._id}')" title="Xóa">
                    <i data-lucide="trash-2" class="h-4 w-4"></i>
                </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
    
    lucide.createIcons();
};

const pagesConfig = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'customers', label: 'Khách hàng' },
    { key: 'marker', label: 'Chạy sơ đồ' },
    { key: 'manualServices', label: 'Dịch vụ thủ công' },
    { key: 'orders', label: 'Đơn hàng' },
    { key: 'debt', label: 'Công nợ' },
    { key: 'debtSettlement', label: 'Chốt công nợ' },
    { key: 'settings', label: 'Cài đặt' }
];

window.editUser = async (id) => {
    const users = await fetchUsers();
    const user = users.find(u => u._id === id);
    if(user) openUserModal(user);
};

window.deleteUser = async (id) => {
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
        try {
            const token = AuthService.getToken();
            const res = await fetch(`/api/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if(data.success) {
                ToastService.success('Đã xóa người dùng');
                loadUsers();
            } else throw new Error(data.message);
        } catch(e) {
            ToastService.error(e.message);
        }
    }
};

const openUserModal = (user = null) => {
    const isEdit = !!user;
    const isAdminAccount = user && user.username === 'admin';
    
    const defaultPermissions = { dashboard: true, customers: false, marker: false, manualServices: false, orders: false, debt: false, debtSettlement: false, settings: false };
    const permissions = isEdit ? (user.permissions || defaultPermissions) : defaultPermissions;
    
    const checkboxesHtml = pagesConfig.map(page => `
        <label class="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer">
            <input type="checkbox" name="perm_${page.key}" class="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                ${permissions[page.key] ? 'checked' : ''} ${isAdminAccount ? 'disabled' : ''}>
            <span class="text-sm text-gray-700 dark:text-gray-300 font-medium">${page.label}</span>
        </label>
    `).join('');

    const content = `
        <form id="user-form" class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên hiển thị <span class="text-red-500">*</span></label>
                    <input type="text" name="displayName" required class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white" value="${user?.displayName || ''}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên đăng nhập <span class="text-red-500">*</span></label>
                    <input type="text" name="username" required class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white" value="${user?.username || ''}" ${isEdit ? 'disabled readonly' : ''}>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mật khẩu ${isEdit ? '(Để trống nếu không đổi)' : '<span class="text-red-500">*</span>'}</label>
                    <input type="password" name="password" ${isEdit ? '' : 'required'} class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white" minlength="6">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vai trò</label>
                    <select name="role" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white" ${isAdminAccount ? 'disabled' : ''}>
                        <option value="user" ${user?.role === 'user' ? 'selected' : ''}>Nhân viên (Bị giới hạn quyền)</option>
                        <option value="admin" ${user?.role === 'admin' ? 'selected' : ''}>Admin (Toàn quyền)</option>
                    </select>
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
                <div class="flex items-center">
                    <input type="checkbox" name="isActive" id="isActive" class="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" ${!isEdit || user?.isActive ? 'checked' : ''} ${isAdminAccount ? 'disabled' : ''}>
                    <label for="isActive" class="ml-2 text-sm text-gray-700 dark:text-gray-300">Tài khoản đang hoạt động (Cho phép đăng nhập)</label>
                </div>
            </div>

            <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Phân quyền truy cập</h3>
                ${isAdminAccount ? '<p class="text-sm text-blue-500 mb-4">Tài khoản Admin hệ thống luôn có toàn quyền.</p>' : ''}
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="permissions-container">
                    ${checkboxesHtml}
                </div>
            </div>

            <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
                <button type="button" class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" onclick="window.closeModal()">Hủy</button>
                <button type="submit" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">Lưu</button>
            </div>
        </form>
    `;

    ModalService.open({
        title: isEdit ? 'Cập nhật người dùng' : 'Thêm người dùng mới',
        content: content,
        width: 'max-w-4xl'
    });
    
    // Xử lý ẩn hiện phần phân quyền nếu chọn Admin
    const roleSelect = document.querySelector('select[name="role"]');
    const permContainer = document.getElementById('permissions-container');
    const togglePerms = () => {
        if(roleSelect.value === 'admin') {
            permContainer.style.opacity = '0.5';
            permContainer.style.pointerEvents = 'none';
        } else {
            permContainer.style.opacity = '1';
            permContainer.style.pointerEvents = 'auto';
        }
    };
    if(roleSelect) {
        roleSelect.addEventListener('change', togglePerms);
        togglePerms();
    }

    document.getElementById('user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // Map permissions
        const permsObj = {};
        pagesConfig.forEach(page => {
            permsObj[page.key] = !!data[`perm_${page.key}`];
        });
        
        const payload = {
            displayName: data.displayName,
            role: data.role || (isAdminAccount ? 'admin' : 'user'),
            isActive: data.isActive === 'on' || isAdminAccount, // admin always active
            permissions: permsObj
        };
        
        if (!isEdit) payload.username = data.username;
        if (data.password) payload.password = data.password;

        try {
            const token = AuthService.getToken();
            const url = isEdit ? `/api/users/${user._id}` : '/api/users';
            const method = isEdit ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method,
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            const result = await res.json();
            if(result.success) {
                ToastService.success(isEdit ? 'Đã cập nhật người dùng' : 'Đã tạo người dùng');
                ModalService.close();
                loadUsers();
            } else {
                throw new Error(result.message);
            }
        } catch(err) {
            ToastService.error(err.message);
        }
    });
};
