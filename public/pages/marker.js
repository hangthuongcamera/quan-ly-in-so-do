import { FileUpload } from '../components/FileUpload.js';
import { DataTable } from '../components/DataTable.js';
import { LoadingSpinnerService } from '../components/LoadingSpinner.js';
import { ToastService } from '../components/Toast.js';
import { apiService } from '../services/api.js';

let analysisResults = [];
let availableCustomers = [];
let priceSettings = {}; // Store all pricing settings

// Cải tiến logic tính giá để an toàn và chính xác hơn
const getMarkerPricing = (width, pricingRules = []) => {
    // 1. Lọc các quy tắc đang hoạt động
    const activeRules = pricingRules.filter(rule => rule.isActive);

    // 2. Sắp xếp các quy tắc theo chiều rộng tối đa (maxWidth) để đảm bảo tìm đúng
    const sortedRules = activeRules.sort((a, b) => a.maxWidth - b.maxWidth);

    // 3. Tìm quy tắc phù hợp đầu tiên
    for (const rule of sortedRules) {
        // Nếu chiều rộng thực tế nhỏ hơn hoặc bằng chiều rộng tối đa của quy tắc
        if (width <= rule.maxWidth) {
            return { chargeWidth: rule.chargeWidth, unitPrice: rule.unitPrice };
        }
    }

    // 4. Nếu không tìm thấy quy tắc nào (ví dụ: chiều rộng quá lớn hoặc không có quy tắc nào active)
    // trả về giá trị 0 để tránh tính sai và dễ dàng phát hiện lỗi trên giao diện.
    console.warn(`Không tìm thấy bảng giá active cho khổ rộng: ${width}. Vui lòng kiểm tra Cài đặt.`);
    return {
        chargeWidth: 'Không áp dụng',
        unitPrice: 0
    };
};

// Tính tổng tiền và định dạng
const calculateTotal = (results) => {
    let total = results.reduce((sum, item) => sum + (item.amount || 0), 0);
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total);
};

// Render bảng kết quả
const renderResultsTable = () => {
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) return;

    if (analysisResults.length === 0) {
        resultsContainer.innerHTML = ''; // Xóa bảng nếu không có kết quả
        return;
    }

    // Update total when re-rendering
    const totalDisplay = document.getElementById('total-amount-display');
    if (totalDisplay) {
        totalDisplay.textContent = calculateTotal(analysisResults);
    }

    const resultColumns = [
        { key: 'fileName', label: 'Tên File' },
        { key: 'fileDate', label: 'Ngày File' },
        { key: 'width', label: 'Rộng (cm)' },
        { key: 'length', label: 'Dài (m)' },
        { key: 'chargeWidth', label: 'Khổ tính tiền' },
        { key: 'copies', label: 'Số bản' },
        { key: 'creationFee', label: 'Phí chạy' },
        { key: 'unitPrice', label: 'Đơn giá in' },
        { key: 'amount', label: 'Thành tiền' },
        { key: 'actions', label: '' },
    ];

    // Định dạng số liệu để hiển thị đẹp hơn
    const formattedData = analysisResults.map((res, index) => ({
        ...res,
        id: index, // Unique ID for DataTable
        copies: `<input type="number" min="1" class="update-copies-input w-16 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-center" data-index="${index}" value="${res.copies || 1}">`,
        creationFee: `<input type="checkbox" class="update-fee-checkbox h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent" data-index="${index}" ${res.hasCreationFee ? 'checked' : ''} title="Tính phí chạy sơ đồ">`,
        unitPrice: new Intl.NumberFormat('vi-VN').format(res.unitPrice || 0),
        amount: new Intl.NumberFormat('vi-VN').format(res.amount || 0),
        actions: `<button type="button" class="delete-file-btn text-danger hover:text-opacity-80 p-1 flex items-center justify-center w-full" data-index="${index}" title="Bỏ chọn file này"><i data-lucide="trash-2" class="w-4 h-4"></i></button>`
    }));

    resultsContainer.innerHTML = `
        <h2 class="text-xl font-semibold mb-4">3. Kết quả phân tích & Tính giá</h2>
        ${DataTable({ columns: resultColumns, data: formattedData, showActions: false })}
        <div class="text-right mt-4 pr-4">
            <p class="text-lg font-semibold">Tổng cộng: <span id="total-amount-display" class="text-accent font-bold">${calculateTotal(analysisResults)}</span></p>
            <button id="save-order-btn" class="mt-4 bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors" ${analysisResults.length === 0 ? 'disabled' : ''}>
                Lưu thành Đơn hàng
            </button>
        </div>
    `;

    // Attach event listener for save button
    const saveOrderBtn = document.getElementById('save-order-btn');
    if (saveOrderBtn) {
        saveOrderBtn.addEventListener('click', handleSaveOrder);
    }

    // Cập nhật icon cho các nút xóa vừa được tạo ra
    lucide.createIcons();
};

const handleSaveOrder = async () => {
    const customerId = document.getElementById('customer-select').value;

    if (!customerId) {
        ToastService.show('Vui lòng chọn khách hàng trước khi lưu đơn hàng.', 'warning');
        return;
    }
    if (analysisResults.length === 0) {
        ToastService.show('Không có file sơ đồ nào để lưu.', 'warning');
        return;
    }

    // Sửa tên biến để đồng bộ với thuộc tính totalAmount của orderData
    const totalAmount = analysisResults.reduce((sum, item) => sum + item.amount, 0);
    const totalFees = analysisResults.filter(i => i.hasCreationFee).length * (priceSettings.markerCreationFee || 0);

    const orderData = {
        customerId,
        orderDate: new Date().toISOString().split('T')[0], // Lấy ngày hôm nay
        serviceType: 'marker', // Đánh dấu đây là đơn hàng sơ đồ
        items: analysisResults,
        totalAmount,
        note: totalFees > 0 
            ? `Bao gồm phí chạy sơ đồ cho ${analysisResults.filter(i => i.hasCreationFee).length} file: ${new Intl.NumberFormat('vi-VN').format(totalFees)} VNĐ` 
            : 'Chỉ tính phí in sơ đồ.'
    };

    LoadingSpinnerService.show();
    try {
        // Sử dụng hàm createOrder đã có, thay vì saveMarkerOrder không tồn tại
        await apiService.createOrder(orderData);
        ToastService.show('Đã lưu đơn hàng sơ đồ thành công!', 'success');
        // Xóa kết quả sau khi lưu thành công
        analysisResults = []; // Clear results after saving
        renderResultsTable();
    } catch (error) {
        ToastService.show('Lỗi khi lưu đơn hàng: ' + error.message, 'danger');
    } finally {
        LoadingSpinnerService.hide();
    }
};

/**
 * Reads a PLT file, parses it, and returns its dimensions.
 * @param {File} file - The PLT file to process.
 * @returns {Promise<{width: number, length: number}>} A promise that resolves with the dimensions in cm and m.
 */
const analyzePltFile = async (file) => {
    const hpglData = await file.text();
    
    // --- Custom HPGL Parser ---
    // Sử dụng Regex để phân tích trực tiếp file HPGL thay vì dùng thư viện nặng.
    // Cách này cực kỳ nhanh, nhẹ, và không bao giờ bị lỗi bộ nhớ với file lớn.
    
    // 1. Loại bỏ các lệnh nhãn văn bản (LB) vì có thể gây nhiễu
    const cleanData = hpglData.replace(/LB[\s\S]*?(?:\x03|;)/g, '');
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasPoints = false;
    let currentX = 0, currentY = 0;
    let isAbsolute = true;
    
    // 2. Tìm các lệnh tọa độ bút vẽ: PA, PR, PU, PD
    const cmdRegex = /(PA|PR|PU|PD)([^A-Za-z]*)/ig;
    let match;
    
    while ((match = cmdRegex.exec(cleanData)) !== null) {
        const cmd = match[1].toUpperCase();
        const paramsStr = match[2];
        
        if (cmd === 'PA') isAbsolute = true;
        else if (cmd === 'PR') isAbsolute = false;
        
        const numRegex = /[-+]?\d*\.?\d+/g;
        let numMatch;
        const coords = [];
        while ((numMatch = numRegex.exec(paramsStr)) !== null) {
            coords.push(parseFloat(numMatch[0]));
        }
        
        // 3. Trích xuất cặp tọa độ x, y
        for (let i = 0; i < coords.length - 1; i += 2) {
            const x = coords[i];
            const y = coords[i+1];
            
            if (isAbsolute) {
                currentX = x;
                currentY = y;
            } else {
                currentX += x;
                currentY += y;
            }
            
            if (currentX < minX) minX = currentX;
            if (currentX > maxX) maxX = currentX;
            if (currentY < minY) minY = currentY;
            if (currentY > maxY) maxY = currentY;
            hasPoints = true;
        }
    }
    
    if (!hasPoints) {
        throw new Error('Không thể phân tích dữ liệu tọa độ trong file sơ đồ này.');
    }
    
    const bbox = {
        width: maxX - minX,  // Trục X là hướng cuộn giấy chạy (Chiều dài)
        height: maxY - minY  // Trục Y là hướng thanh vẽ chạy ngang (Khổ rộng)
    };

    const plotterUnitToMm = 0.025; // Standard HPGL unit: 1 unit = 0.025 mm
    return {
        // Đã sửa lại việc nhầm lẫn trục:
        width: (bbox.height * plotterUnitToMm) / 10,   // Trục Y -> Chiều rộng (cm)
        length: (bbox.width * plotterUnitToMm) / 1000, // Trục X -> Chiều dài (m)
    };
};

const handleFiles = (files) => {
    const fileListContainer = document.getElementById('file-list-container');
    if (!fileListContainer) return;

    if (files.length > 0) {
        // Chỉ xóa dòng chữ placeholder nếu nó còn tồn tại
        const placeholder = fileListContainer.querySelector('p.text-center.text-muted');
        if (placeholder) {
            placeholder.remove();
        }
        // KHÔNG reset mảng analysisResults để cho phép chọn nối tiếp (chọn thêm file)
    }

    for (const file of files) {
        // Bỏ qua và thông báo nếu file đã được chọn trước đó (tránh trùng lặp)
        if (analysisResults.some(res => res.fileName === file.name)) {
            ToastService.show(`File '${file.name}' đã tồn tại trong danh sách.`, 'warning');
            continue;
        }

        // For demonstration, we'll simulate upload progress.
        // In a real app, this would be tied to an XMLHttpRequest or Fetch API progress event.
        
        const fileId = `file-${Math.random().toString(36).substr(2, 9)}`;
        const fileProgressHTML = `
            <div id="${fileId}" class="file-progress-item bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-3">
                <div class="flex items-center">
                    <i data-lucide="file-text" class="w-6 h-6 text-muted mr-4 flex-shrink-0"></i>
                    <div class="flex-1">
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-medium text-text dark:text-gray-300 truncate pr-2" title="${file.name}">${file.name}</span>
                            <span class="text-xs text-muted flex-shrink-0">${(file.size / 1024).toFixed(2)} KB</span>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                            <div class="progress-bar bg-accent h-2 rounded-full transition-all duration-500 ease-linear" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        fileListContainer.insertAdjacentHTML('beforeend', fileProgressHTML);

        // Simulate upload
        const progressBar = document.querySelector(`#${fileId} .progress-bar`);
        progressBar.style.width = '50%'; // Show initial progress

        analyzePltFile(file)
            .then(({ width, length }) => {
                const pricing = getMarkerPricing(width, priceSettings.markerPricing);
                
                const isFeeChecked = document.getElementById('global-charge-fee-checkbox')?.checked || false;
                const quantity = parseFloat(length.toFixed(2));
                const baseAmount = quantity * (pricing.unitPrice || 0);
                const amount = baseAmount + (isFeeChecked ? (priceSettings.markerCreationFee || 0) : 0);

                analysisResults.push({
                    serviceType: 'marker',
                    description: `In sơ đồ: ${file.name} (1 bản)${isFeeChecked ? ' + Phí chạy' : ''}`,
                    fileName: file.name,
                    fileDate: new Date(file.lastModified).toLocaleDateString('vi-VN'),
                    width: parseFloat(width.toFixed(2)),
                    length: parseFloat(length.toFixed(2)),
                    chargeWidth: pricing.chargeWidth,
                    copies: 1, // Mặc định số bản in là 1
                    quantity: quantity,
                    unit: 'm',
                    unitPrice: pricing.unitPrice,
                    hasCreationFee: isFeeChecked,
                    amount: amount,
                });

                renderResultsTable();
                lucide.createIcons();

                // Update progress bar to 100% and change color
                if (progressBar) {
                    progressBar.style.width = '100%';
                    progressBar.classList.remove('bg-accent');
                    progressBar.classList.add('bg-success');
                }
            })
            .catch(error => {
                console.error(`Error processing file ${file.name}:`, error);
                ToastService.show(`Lỗi đọc file '${file.name}': ${error.message}`, 'danger');
                if (progressBar) {
                    progressBar.style.width = '100%';
                    progressBar.classList.remove('bg-accent');
                    progressBar.classList.add('bg-danger');
                }
            });
    }
    lucide.createIcons();
};

const attachEventListeners = () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-files-btn');
    const resultsContainer = document.getElementById('results-container');

    if (browseBtn) browseBtn.addEventListener('click', () => fileInput.click());
    if (fileInput) fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    if (dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        dropZone.addEventListener('dragenter', () => dropZone.classList.add('border-accent', 'bg-blue-50', 'dark:bg-gray-700'));
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-accent', 'bg-blue-50', 'dark:bg-gray-700'));
        dropZone.addEventListener('drop', (e) => {
            dropZone.classList.remove('border-accent', 'bg-blue-50', 'dark:bg-gray-700');
            handleFiles(e.dataTransfer.files);
        });
    }

    // Sự kiện xóa file khỏi bảng kết quả
    if (resultsContainer) {
        resultsContainer.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-file-btn');
            if (deleteBtn) {
                const index = parseInt(deleteBtn.dataset.index, 10);
                const deletedFile = analysisResults[index].fileName;
                analysisResults.splice(index, 1); // Xóa file khỏi mảng
                renderResultsTable(); // Render lại bảng (và tính lại tổng tiền)
                ToastService.show(`Đã loại bỏ file '${deletedFile}'.`, 'info');
            }
        });

        // Sự kiện thay đổi số bản in
        resultsContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('update-copies-input')) {
                const index = parseInt(e.target.dataset.index, 10);
                let copies = parseInt(e.target.value, 10);
                
                // Validate số lượng bản in phải lớn hơn hoặc bằng 1
                if (isNaN(copies) || copies < 1) {
                    copies = 1;
                }
                
                const res = analysisResults[index];
                res.copies = copies;
                res.quantity = parseFloat((res.length * copies).toFixed(2)); // Cập nhật lại tổng số mét
                res.amount = (res.quantity * res.unitPrice) + (res.hasCreationFee ? (priceSettings.markerCreationFee || 0) : 0); // Cập nhật lại thành tiền
                res.description = `In sơ đồ: ${res.fileName} (${copies} bản)${res.hasCreationFee ? ' + Phí chạy' : ''}`; // Cập nhật mô tả
                
                renderResultsTable(); // Render lại bảng
            } else if (e.target.classList.contains('update-fee-checkbox')) {
                const index = parseInt(e.target.dataset.index, 10);
                const res = analysisResults[index];
                res.hasCreationFee = e.target.checked;
                
                res.amount = (res.quantity * res.unitPrice) + (res.hasCreationFee ? (priceSettings.markerCreationFee || 0) : 0);
                res.description = `In sơ đồ: ${res.fileName} (${res.copies} bản)${res.hasCreationFee ? ' + Phí chạy' : ''}`;
                
                renderResultsTable();
            }
        });
    }
};

// Cài đặt Dropdown tìm kiếm khách hàng
const setupCustomerDropdown = () => {
    const input = document.getElementById('customer-search-input');
    const hiddenSelect = document.getElementById('customer-select');
    const list = document.getElementById('customer-dropdown-list');
    const clearBtn = document.getElementById('clear-customer-btn');

    if (!input || !hiddenSelect || !list) return;

    const toggleClearBtn = () => {
        if (input.value.trim() !== '') {
            clearBtn?.classList.remove('hidden');
        } else {
            clearBtn?.classList.add('hidden');
        }
    };

    const renderList = (filterText = '') => {
        // Lọc theo Tên, Mã hoặc Số điện thoại
        const filtered = availableCustomers.filter(c => 
            `${c.companyName} ${c.customerCode} ${c.phone || ''}`.toLowerCase().includes(filterText.toLowerCase())
        );
        
        if (filtered.length === 0) {
            list.innerHTML = `<li class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">Không tìm thấy khách hàng</li>`;
            return;
        }

        list.innerHTML = filtered.map(c => `
            <li class="px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 text-sm text-text dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 last:border-0" data-id="${c.id}" data-name="${c.companyName} (${c.customerCode})">
                <div class="font-medium">${c.companyName}</div>
                <div class="text-xs text-muted">Mã: ${c.customerCode} ${c.phone ? `- SĐT: ${c.phone}` : ''}</div>
            </li>
        `).join('');
    };

    // Hiển thị danh sách khi click vào input
    input.addEventListener('click', () => {
        list.classList.remove('hidden');
        renderList(input.value);
    });

    // Lọc danh sách khi gõ phím
    input.addEventListener('input', (e) => {
        list.classList.remove('hidden');
        hiddenSelect.value = ''; // Reset giá trị ẩn nếu người dùng đang gõ tìm kiếm mới
        toggleClearBtn();
        renderList(e.target.value);
    });

    // Khi chọn một khách hàng từ danh sách
    list.addEventListener('click', (e) => {
        const li = e.target.closest('li[data-id]');
        if (li) {
            hiddenSelect.value = li.dataset.id;
            input.value = li.dataset.name;
            list.classList.add('hidden');
            toggleClearBtn();
        }
    });

    // Đóng dropdown khi click ra ngoài
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !list.contains(e.target) && !clearBtn?.contains(e.target)) {
            list.classList.add('hidden');
            // Tự động điền lại tên khách hàng đã chọn nếu input bị bỏ trống giữa chừng
            const selectedCustomer = availableCustomers.find(c => c.id === hiddenSelect.value);
            if (selectedCustomer) {
                input.value = `${selectedCustomer.companyName} (${selectedCustomer.customerCode})`;
            } else {
                input.value = '';
            }
            toggleClearBtn();
        }
    });

    // Xóa chọn khi click nút X
    clearBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        input.value = '';
        hiddenSelect.value = '';
        toggleClearBtn();
        list.classList.remove('hidden');
        renderList('');
        input.focus(); // Tập trung lại vào ô input để gõ tìm kiếm mới ngay
    });
};

export const renderMarkerPage = async () => {
    const mainContent = document.getElementById('main-content');
    LoadingSpinnerService.show();

    try {
        // Fetch customers and pricing settings in parallel
        [availableCustomers, priceSettings] = await Promise.all([
            apiService.getCustomers(),
            apiService.getPricingSettings()
        ]);
    } catch (error) {
        ToastService.show('Lỗi khi tải dữ liệu: ' + error.message, 'danger');
        LoadingSpinnerService.hide();
        return;
    }
    LoadingSpinnerService.hide();

    mainContent.innerHTML = `
        <div class="p-8">
            <div class="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h1 class="text-3xl font-bold text-text dark:text-white">Chạy sơ đồ (.plt)</h1>
                <div class="flex items-center gap-4">
                    <div class="flex items-center">
                        <input id="global-charge-fee-checkbox" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent">
                        <label for="global-charge-fee-checkbox" class="ml-2 block text-sm text-muted">Tính phí chạy sơ đồ (Tất cả)</label>
                    </div>
                    <!-- Custom Searchable Dropdown -->
                    <div class="relative w-72">
                        <div class="relative">
                            <input type="text" id="customer-search-input" class="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="--- Tìm chọn khách hàng ---" autocomplete="off">
                            <div class="absolute inset-y-0 right-0 flex items-center pr-2">
                                <button id="clear-customer-btn" type="button" class="hidden p-1 text-gray-400 hover:text-danger focus:outline-none" title="Xóa chọn">
                                    <i data-lucide="x" class="w-4 h-4"></i>
                                </button>
                                <i data-lucide="chevron-down" class="w-4 h-4 ml-1 text-muted pointer-events-none"></i>
                            </div>
                        </div>
                        <input type="hidden" id="customer-select" value="">
                        <ul id="customer-dropdown-list" class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg hidden max-h-60 overflow-y-auto"></ul>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
                    <h2 class="text-xl font-semibold mb-4">1. Tải lên các file sơ đồ</h2>
                    ${FileUpload()}
                </div>

                <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
                    <h2 class="text-xl font-semibold mb-4">2. Tiến trình Upload</h2>
                    <div id="file-list-container" class="max-h-96 overflow-y-auto pr-2">
                        <p class="text-muted text-center mt-16">Chưa có file nào được chọn.</p>
                    </div>
                </div>
            </div>

            <div id="results-container" class="mt-8">
                <!-- Bảng kết quả sẽ được render vào đây -->
            </div>
        </div>
    `;

    lucide.createIcons();
    attachEventListeners();
    setupCustomerDropdown(); // Khởi tạo dropdown tìm kiếm sau khi render giao diện
    document.getElementById('global-charge-fee-checkbox')?.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        analysisResults.forEach(res => {
            res.hasCreationFee = isChecked;
            res.amount = (res.quantity * res.unitPrice) + (isChecked ? (priceSettings.markerCreationFee || 0) : 0);
            res.description = `In sơ đồ: ${res.fileName} (${res.copies} bản)${res.hasCreationFee ? ' + Phí chạy' : ''}`;
        });
        renderResultsTable();
    });
    renderResultsTable(); // Render lần đầu (sẽ không hiển thị gì)
};