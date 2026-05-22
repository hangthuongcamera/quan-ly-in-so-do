const LoadingSpinnerService = {
    spinnerElement: null,

    _create() {
        if (document.getElementById('loading-spinner-container')) return;

        const spinnerContainer = document.createElement('div');
        spinnerContainer.id = 'loading-spinner-container';
        spinnerContainer.className = 'fixed inset-0 bg-gray-900 bg-opacity-30 dark:bg-opacity-50 flex items-center justify-center z-[101] hidden';

        spinnerContainer.innerHTML = `<div class="loading-spinner"></div>`;

        document.body.appendChild(spinnerContainer);
        this.spinnerElement = spinnerContainer;
    },

    show() {
        if (!this.spinnerElement) {
            this._create();
        }
        this.spinnerElement.classList.remove('hidden');
    },

    hide() {
        if (this.spinnerElement) {
            this.spinnerElement.classList.add('hidden');
        }
    }
};

export { LoadingSpinnerService };