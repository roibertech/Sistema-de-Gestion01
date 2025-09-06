// REEMPLAZA TODO TU CÓDIGO ACTUAL CON ESTE:

// Función para obtener la fecha y hora local en el formato correcto
function getLocalDateTime() {
    const now = new Date();
    // Ajustar por el offset de zona horaria
    const timezoneOffset = now.getTimezoneOffset() * 60000; // offset en milisegundos
    const localTime = new Date(now.getTime() - timezoneOffset);
    return localTime.toISOString().slice(0, 16);
}

// Establecer fecha y hora actual al cargar la página (hora local corregida)
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('fechaCombustible').value = getLocalDateTime();
});

// Gestión de combustible
document.getElementById('formCombustible').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const tipo = document.getElementById('tipoMovimiento').value;
    const cantidad = parseFloat(document.getElementById('cantidadCombustible').value);
    
    // SIEMPRE usar la fecha y hora actual local (ignorando lo que el usuario ve en el campo)
    const fecha = new Date();
    
    const notas = document.getElementById('notasCombustible').value;
    
    db.collection('combustible').add({
        tipo,
        cantidad,
        fecha,
        notas
    })
    .then(() => {
        // Mostrar notificación
        mostrarNotificacion('Movimiento de combustible registrado correctamente', 'success');
        
        // Limpiar formulario y establecer fecha/hora actual local
        document.getElementById('formCombustible').reset();
        document.getElementById('fechaCombustible').value = getLocalDateTime();
        
        cargarCombustible();
        if (document.getElementById('dashboard').classList.contains('active')) {
            cargarDatosDashboard();
        }
    })
    .catch((error) => {
        mostrarNotificacion('Error al registrar el movimiento: ' + error.message, 'error');
    });
});

// Cargar combustible desde Firestore
function cargarCombustible() {
    let query = db.collection('combustible').orderBy('fecha', 'desc');
    
    // Aplicar filtro de tipo si no es "todos"
    const filterMovimiento = document.getElementById('filterMovimiento').value;
    if (filterMovimiento !== 'todos') {
        query = query.where('tipo', '==', filterMovimiento);
    }
    
    query.onSnapshot((snapshot) => {
        const tablaCombustible = document.getElementById('tablaCombustible').getElementsByTagName('tbody')[0];
        tablaCombustible.innerHTML = '';
        
        let totalEntradas = 0;
        let totalSalidas = 0;
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            const tr = document.createElement('tr');
            
            // Calcular totales
            if (data.tipo === 'entrada') {
                totalEntradas += data.cantidad;
            } else {
                totalSalidas += data.cantidad;
            }
            
            // Formatear fecha
            const fecha = data.fecha.toDate();
            const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            tr.innerHTML = `
                <td class="movimiento-${data.tipo}">${data.tipo === 'entrada' ? 'Entrada' : 'Salida'}</td>
                <td>${data.cantidad.toFixed(2)} L</td>
                <td>${fechaFormateada}</td>
                <td>${data.notas || ''}</td>
                <td>
                    <button class="btn btn-danger btn-sm btn-eliminar-combustible" data-id="${doc.id}"><i class="fas fa-trash"></i> Eliminar</button>
                </td>
            `;
            
            tablaCombustible.appendChild(tr);
        });
        
        // Actualizar los totales
        document.getElementById('totalEntradas').textContent = totalEntradas.toFixed(2) + ' L';
        document.getElementById('totalSalidas').textContent = totalSalidas.toFixed(2) + ' L';
        document.getElementById('inventarioActual').textContent = (totalEntradas - totalSalidas).toFixed(2) + ' L';
        
        // Agregar event listeners a los botones de eliminar
        document.querySelectorAll('.btn-eliminar-combustible').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                eliminarCombustible(id);
            });
        });
    });
}

// Eliminar un registro de combustible
function eliminarCombustible(id) {
    if (confirm('¿Está seguro de que desea eliminar este registro de combustible?')) {
        db.collection('combustible').doc(id).delete()
        .then(() => {
            mostrarNotificacion('Registro de combustible eliminado correctamente', 'success');
            cargarCombustible();
            if (document.getElementById('dashboard').classList.contains('active')) {
                cargarDatosDashboard();
            }
        })
        .catch((error) => {
            mostrarNotificacion('Error al eliminar el registro: ' + error.message, 'error');
        });
    }
}

// Event listeners para filtros
document.getElementById('filterMovimiento').addEventListener('change', cargarCombustible);