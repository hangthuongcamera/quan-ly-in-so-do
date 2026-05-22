import { Sidebar } from './Sidebar.js';
import { Header } from './Header.js';

export const AppLayout = () => {
    return `
        <div class="flex h-screen bg-background dark:bg-primary">
            ${Sidebar()}
            <div class="flex-1 flex flex-col overflow-hidden">
                ${Header()}
                <main id="main-content" class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-800">
                    <!-- Nội dung trang sẽ được router render vào đây -->
                </main>
            </div>
        </div>
    `;
};