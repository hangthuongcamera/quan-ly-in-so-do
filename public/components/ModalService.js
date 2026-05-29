import { Modal } from '../components/Modal.js';

const modalContainer = document.getElementById('modal-container');

export const ModalService = {
    open: ({ title, content, footer, size, onClose }) => {
        if (!modalContainer) return;

        modalContainer.innerHTML = Modal({ title, content, footer, size });

        // Kích hoạt hiệu ứng animation
        setTimeout(() => {
            const modalElement = document.getElementById('app-modal');
            if (modalElement) {
                modalElement.classList.remove('opacity-0');
                modalElement.querySelector('div > div').classList.remove('scale-95');
            }
        }, 10);

        const closeBtn = document.getElementById('modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => ModalService.close(onClose));
        }
        
        const modalElement = document.getElementById('app-modal');
        if (modalElement) {
            modalElement.addEventListener('click', (e) => {
                if (e.target.id === 'app-modal') { // Chỉ đóng khi click vào lớp nền
                    ModalService.close(onClose);
                }
            });
        }

        lucide.createIcons();
    },

    close: (onCloseCallback) => {
        if (!modalContainer) return;
        const modalElement = document.getElementById('app-modal');

        if (modalElement) {
            modalElement.classList.add('opacity-0');
            modalElement.querySelector('div > div').classList.add('scale-95');
            setTimeout(() => {
                modalContainer.innerHTML = '';
                if (onCloseCallback) onCloseCallback();
            }, 300); // Khớp với thời gian transition
        }
    }
};