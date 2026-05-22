import { FileUpload } from '../components/FileUpload.js';
import { DataTable } from '../components/DataTable.js';
import { LoadingSpinnerService } from '../components/LoadingSpinner.js';
import { ToastService } from '../components/Toast.js';
import { apiService } from '../services/api.js';

let analysisResults = [];
let availableCustomers = [];
let priceSettings = {}; // Store all pricing settings

// Giả lập logic tính giá dựa trên tài liệu dự án
const getMarkerPricing = (width, pricingSettings) => {
    // Find the appropriate pricing rule based on width
    // Assuming pricingSettings is sorted by maxWidth ascending
    for (const rule of pricingSettings) {
        if (width < rule.maxWidth) {
            return { chargeWidth: rule.chargeWidth, unitPrice: rule.unitPrice };
        }
    }
    // Default to the last rule if no specific rule is found (e.g., for very large widths)
    const lastRule = pricingSettings[pricingSettings.length - 1];
    return { chargeWidth: lastRule.chargeWidth, unitPrice: lastRule.unitPrice };
};

// Tính tổng tiền và định dạng
const calculateTotal = (results) => {
    let total = results.reduce((sum, item) => sum + (item.amount || 0), 0);
    const chargeMarkerCreation = document.getElementById('charge-marker-creation-checkbox')?.checked;

    if (chargeMarkerCreation && priceSettings.markerCreationFee) {
        total += priceSettings.markerCreationFee;
    }
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
        { key: 'width', label: 'Rộng (cm)' },
        { key: 'length', label: 'Dài (m)' },
        { key: 'chargeWidth', label: 'Khổ tính tiền' },
        { key: 'unitPrice', label: 'Đơn giá' },
        { key: 'amount', label: 'Thành tiền' },
    ];

    // Định dạng số liệu để hiển thị đẹp hơn
    const formattedData = analysisResults.map((res, index) => ({
        ...res,
        id: index, // Unique ID for DataTable
        unitPrice: new Intl.NumberFormat('vi-VN').format(res.unitPrice || 0),
        amount: new Intl.NumberFormat('vi-VN').format(res.amount || 0),
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

    const chargeMarkerCreation = document.getElementById('charge-marker-creation-checkbox').checked;
    const markerCreationFee = chargeMarkerCreation ? priceSettings.markerCreationFee : 0;

    LoadingSpinnerService.show();
    try {
        await apiService.saveMarkerOrder({
            customerId, 
            items: analysisResults,
            markerCreationFee
        });
        ToastService.show('Đã lưu đơn hàng sơ đồ thành công!', 'success');
        analysisResults = []; // Clear results after saving
        renderResultsTable();
    } catch (error) {
        ToastService.show('Lỗi khi lưu đơn hàng: ' + error.message, 'danger');
    } finally {
        LoadingSpinnerService.hide();
    }
};

/**
 * Calculates the bounding box of geometries returned by JSCAD.
 * @param {Array} geometries - Array of geometry objects.
 * @returns {{width: number, height: number}} The width and height of the bounding box.
 */
const getBoundingBox = (geometries) => {
    // Đảm bảo chúng ta luôn làm việc với một mảng và lọc ra các giá trị null/undefined.
    const geoms = (Array.isArray(geometries) ? geometries : [geometries]).filter(Boolean);
    if (geoms.length === 0) {
        return { width: 0, height: 0 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    const processPoints = (points) => {
        points.forEach(point => {
            minX = Math.min(minX, point[0]);
            minY = Math.min(minY, point[1]);
            maxX = Math.max(maxX, point[0]);
            maxY = Math.max(maxY, point[1]);
        });
    };

    geoms.forEach(geom => {
        if (geom.points) { // For polylines
            processPoints(geom.points);
        } else if (geom.sides) { // For polygons
            geom.sides.forEach(side => processPoints(side));
        }
    });

    if (isFinite(minX)) {
        return {
            width: maxX - minX,
            height: maxY - minY, // In HPGL, this is often the length
        };
    }
    return { width: 0, height: 0 };
};

/**
 * Reads a PLT file, parses it, and returns its dimensions.
 * @param {File} file - The PLT file to process.
 * @returns {Promise<{width: number, length: number}>} A promise that resolves with the dimensions in cm and m.
 */
const analyzePltFile = async (file) => {
    const hpglData = await file.text();
    const geometries = jscad_io.deserialize({ filename: file.name, output: 'geometry' }, hpglData);
    const bbox = getBoundingBox(geometries);
    const plotterUnitToMm = 0.025; // Standard HPGL unit: 1 unit = 0.025 mm
    return {
        width: (bbox.width * plotterUnitToMm) / 10,   // Convert to cm
        length: (bbox.height * plotterUnitToMm) / 1000, // Convert to m
    };
};

const handleFiles = (files) => {
    const fileListContainer = document.getElementById('file-list-container');
    if (!fileListContainer) return;

    if (files.length > 0) {
        fileListContainer.innerHTML = ''; // Xóa placeholder
        analysisResults = []; // Reset kết quả khi có đợt upload mới
        renderResultsTable(); // Xóa bảng kết quả cũ
    }

    for (const file of files) {
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
                const amount = length * (pricing.unitPrice || 0);

                analysisResults.push({
                    fileName: file.name,
                    width: parseFloat(width.toFixed(2)),
                    length: parseFloat(length.toFixed(2)),
                    chargeWidth: pricing.chargeWidth,
                    unitPrice: pricing.unitPrice,
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
                // Hiển thị lỗi cụ thể hơn. Thư viện jscad thường báo lỗi chứa "parse" khi định dạng file sai.
                const errorMessage = (error.message && error.message.toLowerCase().includes('parse')) 
                    ? `File '${file.name}' không đúng định dạng hoặc bị lỗi.` 
                    : `Lỗi xử lý file: ${file.name}`;
                ToastService.show(errorMessage, 'danger');
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

    const customerOptions = [
        { value: '', label: '--- Chọn khách hàng ---' },
        ...availableCustomers.map(c => ({ value: c.id, label: `${c.companyName} (${c.customerCode})` }))
    ].map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');

    mainContent.innerHTML = `
        <div class="p-8">
            <div class="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h1 class="text-3xl font-bold text-text dark:text-white">Chạy sơ đồ (.plt)</h1>
                <div class="flex items-center gap-4">
                    <div class="flex items-center">
                        <input id="charge-marker-creation-checkbox" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent">
                        <label for="charge-marker-creation-checkbox" class="ml-2 block text-sm text-muted">Tính phí chạy sơ đồ</label>
                    </div>
                    <select id="customer-select" class="w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        ${customerOptions}
                    </select>
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
    document.getElementById('charge-marker-creation-checkbox')?.addEventListener('change', () => {
        // Re-calculate total when checkbox changes
        renderResultsTable();
    });
    renderResultsTable(); // Render lần đầu (sẽ không hiển thị gì)
};