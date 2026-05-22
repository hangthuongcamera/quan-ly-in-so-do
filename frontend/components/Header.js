export const Header = () => {
    return `
        <header class="bg-white dark:bg-gray-900 p-4 shadow-md flex justify-between items-center z-10">
            <div>
                <!-- Search bar can go here -->
            </div>
            <div class="flex items-center space-x-4">
                <button id="dark-mode-toggle" class="text-muted hover:text-accent">
                    <i data-lucide="moon" class="dark-mode-icon"></i>
                </button>
                <!-- Notifications, User Avatar can go here -->
                <div class="w-8 h-8 bg-accent rounded-full"></div>
            </div>
        </header>
    `;
};