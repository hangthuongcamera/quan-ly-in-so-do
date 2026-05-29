const ConfirmDialogService = {
    show({
        title = 'Xác nhận',
        message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
        confirmText = 'Xác nhận',
        cancelText = 'Hủy',
        confirmButtonClass = 'bg-primary text-white hover:bg-opacity-90',
    }) {
        return new Promise((resolve) => {
            // Xóa hộp thoại xác nhận cũ nếu có
            const existingDialog = document.getElementById('confirm-dialog-container');
            if (existingDialog) {
                existingDialog.remove();
            }

            const dialogContainer = document.createElement('div');
            dialogContainer.id = 'confirm-dialog-container';
            dialogContainer.className = 'fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center z-[99]';
            
            dialogContainer.innerHTML = `
                <div id="confirm-dialog-backdrop" class="absolute inset-0"></div>
                <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-lg w-full max-w-md m-4 p-6 animate-fade-in-up">
                    <h3 class="text-lg font-semibold text-text dark:text-white mb-2">${title}</h3>
                    <p class="text-sm text-muted mb-6">${message}</p>
                    <div class="flex justify-end gap-3">
                        <button id="confirm-cancel-btn" class="px-4 py-2 text-sm font-medium text-muted bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg">${cancelText}</button>
                        <button id="confirm-ok-btn" class="px-4 py-2 text-sm font-medium rounded-lg ${confirmButtonClass}">${confirmText}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(dialogContainer);

            const confirmBtn = document.getElementById('confirm-ok-btn');
            const cancelBtn = document.getElementById('confirm-cancel-btn');
            const backdrop = document.getElementById('confirm-dialog-backdrop');

            const closeDialog = (value) => {
                dialogContainer.remove();
                resolve(value);
            };

            confirmBtn.addEventListener('click', () => closeDialog(true));
            cancelBtn.addEventListener('click', () => closeDialog(false));
            backdrop.addEventListener('click', () => closeDialog(false));
        });
    }
};

export { ConfirmDialogService };