// REEMPLAZA TODO TU CÓDIGO ACTUAL CON ESTE:

// Función para formatear fecha al formato YYYY-MM-DDTHH:mm
function formatDateTimeForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Función para convertir fecha string a objeto Date (maneja timezone correctamente)
function parseDateTimeFromInput(dateTimeString) {
    if (!dateTimeString) return new Date();
    
    // Separar fecha y hora
    const [datePart, timePart] = dateTimeString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    
    // Crear fecha en zona horaria local
    return new Date(year, month - 1, day, hours, minutes);
}

// Establecer fecha y hora actual al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('fechaCombustible').value = formatDateTimeForInput(new Date());
});

// Gestión de combustible - ACTUALIZADO PARA USAR LA FECHA SELECCIONADA
document.getElementById('formCombustible').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const tipo = document.getElementById('tipoMovimiento').value;
    const cantidad = parseFloat(document.getElementById('cantidadCombustible').value);
    
    // OBTENER LA FECHA DEL CAMPO DE ENTRADA (lo que el usuario seleccionó)
    const fechaInput = document.getElementById('fechaCombustible').value;
    const fecha = parseDateTimeFromInput(fechaInput);
    
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
        
        // Limpiar formulario y establecer fecha/hora actual
        document.getElementById('formCombustible').reset();
        document.getElementById('fechaCombustible').value = formatDateTimeForInput(new Date());
        
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
                const id = e.target.closest('button').getAttribute('data-id');
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