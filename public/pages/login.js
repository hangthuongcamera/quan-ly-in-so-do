import { AuthService } from '../services/auth.js';
import { ToastService } from '../components/Toast.js';

export const renderLoginPage = () => {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div class="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
                <div>
                    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        Đăng nhập hệ thống
                    </h2>
                    <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        Phần mềm quản lý in sơ đồ may mặc
                    </p>
                </div>
                <form class="mt-8 space-y-6" id="login-form" novalidate>
                    <input type="hidden" name="remember" value="true">
                    <div class="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label for="username" class="sr-only">Tên đăng nhập</label>
                            <input id="username" name="username" type="text" class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="Tên đăng nhập (vd: admin)">
                        </div>
                        <div>
                            <label for="password" class="sr-only">Mật khẩu</label>
                            <input id="password" name="password" type="password" class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="Mật khẩu">
                        </div>
                    </div>

                    <div>
                        <button type="submit" id="login-btn" class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200">
                            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                                <i data-lucide="lock" class="h-5 w-5 text-gray-400 group-hover:text-gray-300"></i>
                            </span>
                            Đăng nhập
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    lucide.createIcons();

    const loginForm = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-btn');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = loginForm.username.value.trim();
        const password = loginForm.password.value;
        
        if (!username) {
            ToastService.error('Vui lòng nhập tên đăng nhập');
            return;
        }
        
        if (!password) {
            ToastService.error('Vui lòng nhập mật khẩu');
            return;
        }
        
        loginBtn.disabled = true;
        loginBtn.innerHTML = 'Đang xử lý...';
        
        try {
            const result = await AuthService.login(username, password);
            
            if (result.success) {
                ToastService.success('Đăng nhập thành công!');
                // Force full page reload by changing the non-hash URL part
                // (hash-only changes never trigger reload, but query param changes do)
                window.location.href = window.location.pathname + '?t=' + Date.now() + '#/dashboard';
                return;
            } else {
                ToastService.error(result.message || 'Đăng nhập thất bại');
            }
        } catch (error) {
            console.error('Login error:', error);
            ToastService.error('Lỗi kết nối đến máy chủ');
        }
        
        // Always re-enable button on failure
        loginBtn.disabled = false;
        loginBtn.innerHTML = `
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                <i data-lucide="lock" class="h-5 w-5 text-gray-400 group-hover:text-gray-300"></i>
            </span>
            Đăng nhập
        `;
        lucide.createIcons();
    });
};
