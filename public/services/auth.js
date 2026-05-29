export const AuthService = {
    getToken() {
        return localStorage.getItem('token');
    },

    setToken(token) {
        localStorage.setItem('token', token);
    },

    removeToken() {
        localStorage.removeItem('token');
    },

    getUser() {
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch (e) {
            return null;
        }
    },

    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },

    isLoggedIn() {
        const token = this.getToken();
        if (!token) return false;
        
        try {
            // Check if token is expired by decoding payload manually
            const payloadBase64 = token.split('.')[1];
            const decodedJson = atob(payloadBase64);
            const decoded = JSON.parse(decodedJson);
            const exp = decoded.exp;
            if (Date.now() >= exp * 1000) {
                // Token expired — clear storage silently, do NOT call logout() to avoid reload loop
                this.removeToken();
                localStorage.removeItem('user');
                return false;
            }
            return true;
        } catch (e) {
            // Token malformed — clear storage silently
            this.removeToken();
            localStorage.removeItem('user');
            return false;
        }
    },

    async login(username, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            
            if (data.success) {
                this.setToken(data.data.token);
                this.setUser(data.data);
                return { success: true };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            return { success: false, message: 'Lỗi kết nối đến máy chủ' };
        }
    },

    logout() {
        this.removeToken();
        localStorage.removeItem('user');
        // Use href assignment for reliable redirect
        window.location.href = window.location.pathname;
    },

    canAccess(pageKey) {
        const user = this.getUser();
        if (!user) return false;
        
        if (user.role === 'admin') return true; // Admin có toàn quyền

        // Loại bỏ '#' và '/' khỏi pageKey nếu có
        let key = pageKey.replace(/^#\/?/, '').replace(/^\//, '');
        
        // Mapping route path to permission key
        const permissionMap = {
            'dashboard': 'dashboard',
            '': 'dashboard', // default route
            'customers': 'customers',
            'marker': 'marker',
            'manual-services': 'manualServices',
            'orders': 'orders',
            'debt': 'debt',
            'debt-settlement': 'debtSettlement',
            'settings': 'settings',
            'user-management': 'settings'
        };

        const mappedKey = permissionMap[key] || key;
        
        // Route user-management chỉ admin mới được vào
        if (key === 'user-management' && user.role !== 'admin') {
            return false;
        }

        return user.permissions && user.permissions[mappedKey] === true;
    }
};

