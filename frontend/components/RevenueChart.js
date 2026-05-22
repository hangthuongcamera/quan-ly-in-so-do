/**
 * Renders a revenue chart into a given canvas element.
 * @param {string} canvasId The ID of the canvas element to render the chart in.
 * @param {object} chartData The data object for the chart, including labels and datasets.
 */
export const renderRevenueChart = (canvasId, chartData) => {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
        console.error(`Canvas element with id "${canvasId}" not found.`);
        return;
    }

    // To prevent re-rendering issues, destroy the old chart instance if it exists
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }

    new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            // Format ticks to be more readable
                            return (value / 1000000) + ' Tr';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false, // Hide legend for a cleaner look in a component
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            return `${label}: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.parsed.y)}`;
                        }
                    }
                }
            }
        }
    });
};