export const FileUpload = () => {
    return `
        <div id="drop-zone" class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center cursor-pointer hover:border-accent dark:hover:border-accent transition-colors duration-300">
            <div class="flex flex-col items-center justify-center">
                <i data-lucide="upload-cloud" class="w-16 h-16 text-muted"></i>
                <p class="mt-4 text-lg text-muted">Kéo và thả file .plt vào đây</p>
                <p class="text-sm text-muted">hoặc</p>
                <button id="browse-files-btn" class="mt-2 bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors">
                    Chọn Files
                </button>
                <input type="file" id="file-input" multiple accept=".plt" class="hidden">
            </div>
        </div>
    `;
};