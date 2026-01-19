// Chart instance
let breathingChart = null;

// Chart colors - distinct for visibility
const chartColors = {
    inhale: '#D97706',    // Orange
    hold: '#0D9488',      // Teal
    exhale: '#8B5CF6',    // Purple
    retention: '#EC4899'  // Pink
};

// Render or update the chart
function renderChart() {
    const data = loadSessions();
    const sessions = data.sessions;
    const emptyState = document.getElementById('empty-state');
    const canvas = document.getElementById('breathing-chart');

    // Show/hide empty state
    if (sessions.length === 0) {
        emptyState.classList.remove('hidden');
        canvas.style.display = 'none';
        if (breathingChart) {
            breathingChart.destroy();
            breathingChart = null;
        }
        return;
    }

    emptyState.classList.add('hidden');
    canvas.style.display = 'block';

    // Prepare data
    const labels = sessions.map((s, i) => `Session ${i + 1}`);
    const inhaleData = sessions.map(s => s.averages.inhale);
    const holdData = sessions.map(s => s.averages.hold);
    const exhaleData = sessions.map(s => s.averages.exhale);
    const retentionData = sessions.map(s => s.averages.retention || 0);

    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'Inhale',
                data: inhaleData,
                borderColor: chartColors.inhale,
                backgroundColor: chartColors.inhale + '20',
                tension: 0.3,
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2
            },
            {
                label: 'Hold',
                data: holdData,
                borderColor: chartColors.hold,
                backgroundColor: chartColors.hold + '20',
                tension: 0.3,
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2
            },
            {
                label: 'Exhale',
                data: exhaleData,
                borderColor: chartColors.exhale,
                backgroundColor: chartColors.exhale + '20',
                tension: 0.3,
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2
            },
            {
                label: 'Retention',
                data: retentionData,
                borderColor: chartColors.retention,
                backgroundColor: chartColors.retention + '20',
                tension: 0.3,
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    color: '#4A4540',
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                backgroundColor: '#4A4540',
                titleColor: '#FAF9F7',
                bodyColor: '#FAF9F7',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}s`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#7A756D',
                    font: {
                        size: 11
                    }
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: '#E8E4DE'
                },
                ticks: {
                    color: '#7A756D',
                    font: {
                        size: 11
                    },
                    callback: function(value) {
                        return value + 's';
                    }
                },
                title: {
                    display: true,
                    text: 'Duration (seconds)',
                    color: '#7A756D',
                    font: {
                        size: 12
                    }
                }
            }
        }
    };

    // Create or update chart
    if (breathingChart) {
        breathingChart.data = chartData;
        breathingChart.update();
    } else {
        const ctx = canvas.getContext('2d');
        breathingChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: chartOptions
        });
    }
}
