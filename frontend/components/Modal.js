export const Modal = ({ title, content, footer }) => {
    return `
        <div id="app-modal" class="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300 opacity-0">
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg m-4 transform transition-transform duration-300 scale-95">
                <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-xl font-semibold text-text dark:text-white">${title}</h3>
                    <button id="modal-close-btn" class="text-muted hover:text-danger p-1 rounded-full">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>
                <div id="modal-content" class="p-6">
                    ${content}
                </div>
                <div id="modal-footer" class="px-6 py-4 bg-gray-50 dark:bg-gray-900 text-right rounded-b-2xl">
                    ${footer}
                </div>
            </div>
        </div>
    `;
};