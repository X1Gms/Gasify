/**
 * js/device.js - Lógica de Gráficos em PPM com Escalas Fixas e Data Completa
 */

let chartsInstances = {}; 

// Fórmulas de conversão do Backend (Base 4095)
const convertCO = (v) => (v * 106.0) / 4095.0;
const convertGas = (v) => (v * 6363.0) / 4095.0;

// Valores máximos possíveis em PPM
const MAX_CO_PPM = 106;
const MAX_GAS_PPM = 6363;

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const deviceId = urlParams.get('id');

    if (!deviceId) {
        showToast('error', 'Dispositivo não encontrado', 'A redirecionar...');
        setTimeout(() => { window.location.href = "home.html"; }, 2000);
        return;
    }

    fetchDeviceDetails(deviceId, 'hour', true);
    setupFilters(deviceId);
});

async function fetchDeviceDetails(id, range, allowToast = false) {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`http://localhost:8081/users/me/devices/${id}?range=${range}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        const data = await response.json();
        if (response.ok && data.success) {
            updateDeviceUI(data, allowToast); 
            renderAllCharts(data.charts);
        }
    } catch (error) {
        showToast('error', 'Erro de Rede', 'Falha ao ligar ao servidor.');
    }
}

function updateDeviceUI(data, allowToast) {
    document.querySelector(".device-title").textContent = data.name;
    const statusValues = document.querySelectorAll(".status-box .big-text");

    if (statusValues.length >= 4) {
        const coPpm = data.cards.co !== null ? convertCO(data.cards.co) : null;
        statusValues[1].textContent = coPpm === null ? "---" : 
                                     (coPpm <= 34 ? "Baixa" : (coPpm <= 69 ? "Média" : "Alta"));

        const gasPpm = data.cards.gas !== null ? convertGas(data.cards.gas) : null;
        statusValues[0].textContent = gasPpm === null ? "---" : 
                                      (gasPpm <= 2100 ? "Baixa" : (gasPpm <= 4199 ? "Média" : "Alta"));

        statusValues[2].textContent = data.cards.temperature ? `${data.cards.temperature}ºC` : "---";
        statusValues[3].textContent = data.cards.humidity !== null ? `${data.cards.humidity}%` : "---";
        
        if (data.has_active_alert && allowToast) {
            showToast('error', 'ALERTA CRÍTICO', 'Fuga detectada! Verifique o local.');
        }
    }
}

function renderAllCharts(chartsData) {
    const coLimitAlto = 70;
    const gasLimitAlto = 4200;

    createChart("chartCO", "Monóxido (PPM)", chartsData.co, "#e67e22", coLimitAlto, " ppm", convertCO, MAX_CO_PPM);
    createChart("chartGas", "Gás (PPM)", chartsData.gas, "#f1c40f", gasLimitAlto, " ppm", convertGas, MAX_GAS_PPM);
    createChart("chartTemp", "Temperatura", chartsData.temperature, "#e74c3c", null, "ºC", v => v, null);
    createChart("chartHum", "Humidade", chartsData.humidity, "#3498db", null, "%", v => v, 100);
}

function createChart(canvasId, label, dataArray, color, limitLine, unit, conversionFn, yMax) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (chartsInstances[canvasId]) {
        chartsInstances[canvasId].destroy();
    }

    /** * ALTERAÇÃO AQUI: 
     * Formata a label para incluir Dia/Mês além da Hora 
     */
    const labels = dataArray.map(d => {
        const date = new Date(d.timestamp);
        const dayMonth = date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${dayMonth} ${time}`; 
    });

    const values = dataArray.map(d => conversionFn(d.value));

    const annotations = {};
    if (limitLine !== null) {
        annotations.line1 = {
            type: 'line',
            yMin: limitLine,
            yMax: limitLine,
            borderColor: '#ff0000',
            borderWidth: 3,
            borderDash: [5, 5],
            label: {
                display: true,
                content: 'NÍVEL ALTO',
                position: 'end',
                backgroundColor: 'rgba(255, 0, 0, 0.8)',
                color: '#fff',
                font: { size: 10, weight: 'bold' }
            }
        };
    }

    chartsInstances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: values,
                borderColor: color,
                backgroundColor: color + "22", 
                fill: true,
                tension: 0.3,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                annotation: { annotations: annotations },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}${unit}`
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        font: { size: 10 }
                    }
                },
                y: { 
                    beginAtZero: true,
                    max: yMax,
                    ticks: { callback: (value) => value + unit }
                }
            }
        }
    });
}

function setupFilters(deviceId) {
    const rangeMap = {
        "Últimas Horas": "hour",
        "Últimas Semanas": "week",
        "Última Quinzena": "fortnight",
        "Último Mês": "month"
    };

    document.querySelectorAll(".filter-menu .opt").forEach(o => {
        o.onclick = () => {
            const rangeText = o.textContent.trim();
            const range = rangeMap[rangeText] || "hour";
            fetchDeviceDetails(deviceId, range, false);
            document.getElementById("filterBtn").textContent = rangeText + " ▼";
        };
    });
} 