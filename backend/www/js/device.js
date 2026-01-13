/**
 * js/device.js - Lógica da Página de Detalhes e Gráficos
 */

let chartsInstances = {}; // Armazena os gráficos para permitir atualizações

document.addEventListener("DOMContentLoaded", () => {
    // 1. Pega o ID do dispositivo da URL
    const urlParams = new URLSearchParams(window.location.search);
    const deviceId = urlParams.get('id');

    if (!deviceId) {
        window.location.href = "home.html";
        return;
    }

    // 2. Carrega os dados (por padrão, da última hora)
    fetchDeviceDetails(deviceId, 'hour');

    // 3. Configura os filtros de tempo (Última hora, semana, etc.)
    setupFilters(deviceId);
});

async function fetchDeviceDetails(id, range) {
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
            updateDeviceUI(data);      // Atualiza textos e bubbles
            renderAllCharts(data.charts); // Desenha os gráficos
        }
    } catch (error) {
        console.error("Erro ao carregar detalhes:", error);
    }
}

function updateDeviceUI(data) {
    // Atualiza Nome e Serial
    document.querySelector(".device-title").textContent = data.name;
    // Seleciona o elemento strong e altera o texto a seguir a ele
    const serialElem = document.querySelector(".device-subtitle strong");
    if (serialElem) serialElem.nextSibling.textContent = ` ${data.serial_number}`;
    
    const statusValues = document.querySelectorAll(".status-box .big-text");

    // Preenche as Bubbles (Lógica Baixa/Média/Alta)
    if (statusValues.length >= 4) {
        // Gás (MQ2)
        const gas = data.cards.gas;
        statusValues[0].textContent = gas === null ? "---" : (gas < 300 ? "Baixa" : (gas < 600 ? "Média" : "Alta"));

        // Monóxido (MQ5)
        const co = data.cards.co;
        statusValues[1].textContent = co === null ? "---" : (co < 200 ? "Baixa" : (co < 500 ? "Média" : "Alta"));

        // Temperatura
        statusValues[2].textContent = data.cards.temperature ? `${data.cards.temperature}ºC` : "---";

        // Humidade
        const hum = data.cards.humidity;
        statusValues[3].textContent = hum === null ? "---" : (hum < 40 ? "Baixa" : (hum < 70 ? "Média" : "Alta"));
    }
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
            const range = rangeMap[o.textContent.trim()] || "hour";
            fetchDeviceDetails(deviceId, range);
            document.getElementById("filterBtn").textContent = o.textContent + " ▼";
        };
    });
}

function renderAllCharts(chartsData) {
    createChart("chartGas", "Gás (MQ2)", chartsData.gas, "#f1c40f");
    createChart("chartCO", "Monóxido (MQ5)", chartsData.co, "#e67e22");
    createChart("chartTemp", "Temperatura (ºC)", chartsData.temperature, "#e74c3c");
    createChart("chartHum", "Humidade (%)", chartsData.humidity, "#3498db");
}

function createChart(canvasId, label, dataArray, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (chartsInstances[canvasId]) {
        chartsInstances[canvasId].destroy();
    }

    const labels = dataArray.map(d => {
        const date = new Date(d.timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    const values = dataArray.map(d => d.value);

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
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: false }
            }
        }
    });
}