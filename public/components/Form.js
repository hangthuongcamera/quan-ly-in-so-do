export const FormInput = ({ id, label, value = '', placeholder = '', type = 'text', required = false }) => `
    <div>
        <label for="${id}" class="block text-sm font-medium text-muted mb-1">${label}</label>
        <input type="${type}" id="${id}" name="${id}" value="${value}" placeholder="${placeholder}" ${required ? 'required' : ''}
               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
    </div>
`;

export const FormTextarea = ({ id, label, value = '', placeholder = '', rows = 3 }) => `
    <div>
        <label for="${id}" class="block text-sm font-medium text-muted mb-1">${label}</label>
        <textarea id="${id}" name="${id}" placeholder="${placeholder}" rows="${rows}"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white">${value}</textarea>
    </div>
`;

export const FormSelect = ({ id, label, options, required = false }) => `
    <div>
        <label for="${id}" class="block text-sm font-medium text-muted mb-1">${label}</label>
        <select id="${id}" name="${id}" ${required ? 'required' : ''} class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            ${options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
        </select>
    </div>
`;