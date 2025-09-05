// Cargar datos para el dashboard
function cargarDatosDashboard() {
    // Cargar estadísticas de fallas
    db.collection('fallas').get().then((snapshot) => {
        const totalFallas = snapshot.size;
        let fallasPendientes = 0;
        let fallasResueltas = 0;
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.estado === 'pendiente') {
                fallasPendientes++;
            } else if (data.estado === 'resuelto') {
                fallasResueltas++;
            }
        });
        
        document.getElementById('totalFallas').textContent = totalFallas;
        document.getElementById('fallasPendientes').textContent = fallasPendientes;
        document.getElementById('fallasResueltas').textContent = fallasResueltas;
        
        // Actualizar gráfico de fallas
        actualizarGraficoFallas(fallasPendientes, fallasResueltas);
        
        // Cargar fallas recientes
        const recentFallas = document.getElementById('recentFallas').getElementsByTagName('tbody')[0];
        recentFallas.innerHTML = '';
        
        // Ordenar por fecha descendente y tomar las últimas 5
        const sortedFallas = [];
        snapshot.forEach((doc) => {
            sortedFallas.push({id: doc.id, ...doc.data()});
        });
        
        sortedFallas.sort((a, b) => b.fecha.toDate() - a.fecha.toDate());
        const ultimasFallas = sortedFallas.slice(0, 5);
        
        ultimasFallas.forEach((data) => {
            const tr = document.createElement('tr');
            
            // Formatear fecha
            const fecha = data.fecha.toDate();
            const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            
            // Determinar clase CSS según el tipo
            let tipoClass = '';
            let tipoText = '';
            if (data.tipo === 'queja') {
                tipoClass = 'tipo-queja';
                tipoText = 'Queja';
            } else if (data.tipo === 'tecnico') {
                tipoClass = 'tipo-tecnico';
                tipoText = 'Técnico';
            } else {
                tipoClass = 'tipo-otro';
                tipoText = 'Otro';
            }
            
            tr.innerHTML = `
                <td>${data.nombre}</td>
                <td>${data.ubicacion}</td>
                <td><span class="tipo-badge ${tipoClass}">${tipoText}</span></td>
                <td>${data.descripcion.substring(0, 50)}${data.descripcion.length > 50 ? '...' : ''}</td>
                <td><span class="status-badge status-${data.estado}">${data.estado}</span></td>
                <td>${fechaFormateada}</td>
            `;
            
            recentFallas.appendChild(tr);
        });
    });
    
    // Cargar estadísticas de combustible
    db.collection('combustible').get().then((snapshot) => {
        let totalEntradas = 0;
        let totalSalidas = 0;
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.tipo === 'entrada') {
                totalEntradas += data.cantidad;
            } else {
                totalSalidas += data.cantidad;
            }
        });
        
        const totalCombustible = totalEntradas - totalSalidas;
        document.getElementById('totalCombustible').textContent = totalCombustible.toFixed(2) + ' L';
        
        // Actualizar gráfico de combustible
        actualizarGraficoCombustible(snapshot);
    });
}

// Actualizar gráfico de fallas
function actualizarGraficoFallas(pendientes, resueltas) {
    const ctx = document.getElementById('fallasChart').getContext('2d');
    
    if (window.fallasChartInstance) {
        window.fallasChartInstance.destroy();
    }
    
    window.fallasChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pendientes', 'Resueltas'],
            datasets: [{
                data: [pendientes, resueltas],
                backgroundColor: [
                    '#fd7e14',
                    '#28a745'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Actualizar gráfico de combustible
function actualizarGraficoCombustible(snapshot) {
    const ctx = document.getElementById('combustibleChart').getContext('2d');
    
    // Preparar datos para el gráfico (últimos 7 movimientos)
    const entradas = [];
    const salidas = [];
    const fechasEntradas = [];
    const fechasSalidas = [];
    
    snapshot.forEach((doc) => {
        const data = doc.data();
        const fecha = data.fecha.toDate();
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short'
        });
        
        if (data.tipo === 'entrada') {
            entradas.unshift(data.cantidad);
            fechasEntradas.unshift(fechaFormateada);
        } else {
            salidas.unshift(data.cantidad);
            fechasSalidas.unshift(fechaFormateada);
        }
    });
    
    // Tomar solo los últimos 7 movimientos para cada tipo
    const ultimasEntradas = entradas.slice(-7);
    const ultimasFechasEntradas = fechasEntradas.slice(-7);
    const ultimasSalidas = salidas.slice(-7);
    const ultimasFechasSalidas = fechasSalidas.slice(-7);
    
    if (window.combustibleChartInstance) {
        window.combustibleChartInstance.destroy();
    }
    
    window.combustibleChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ultimasFechasEntradas.length > 0 ? ultimasFechasEntradas : ultimasFechasSalidas,
            datasets: [
                {
                    label: 'Entradas',
                    data: ultimasEntradas,
                    backgroundColor: '#28a745',
                    borderWidth: 0
                },
                {
                    label: 'Salidas',
                    data: ultimasSalidas,
                    backgroundColor: '#dc3545',
                    borderWidth: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + ' L';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}