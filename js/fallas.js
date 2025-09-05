// Gestión de fallas
// Busca esta función y modifícala para que limpie el formulario:
document.getElementById('formFalla').addEventListener('submit', (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombreCliente').value;
    const ubicacion = document.getElementById('ubicacionCliente').value;
    const tipo = document.getElementById('tipoFalla').value;
    const descripcion = document.getElementById('descripcionFalla').value;
    const estado = document.getElementById('estadoFalla').value;
    const fecha = new Date();

    db.collection('fallas').add({
        nombre,
        ubicacion,
        tipo,
        descripcion,
        estado,
        fecha
    })
        .then(() => {
            // Mostrar notificación
            mostrarNotificacion('Falla registrada correctamente', 'success');

            // Limpiar formulario
            document.getElementById('formFalla').reset(); 

            cargarFallas();
            if (document.getElementById('dashboard').classList.contains('active')) {
                cargarDatosDashboard();
            }
        })
        .catch((error) => {
            mostrarNotificacion('Error al registrar la falla: ' + error.message, 'error');
        });
});

// Cargar fallas desde Firestore
function cargarFallas() {
    let query = db.collection('fallas').orderBy('fecha', 'desc');

    // Aplicar filtro de estado si no es "todos"
    const filterEstado = document.getElementById('filterEstado').value;
    if (filterEstado !== 'todos') {
        query = query.where('estado', '==', filterEstado);
    }

    // Aplicar filtro de tipo si no es "todos"
    const filterTipo = document.getElementById('filterTipo').value;
    if (filterTipo !== 'todos') {
        query = query.where('tipo', '==', filterTipo);
    }

    query.onSnapshot((snapshot) => {
        const tablaFallas = document.getElementById('tablaFallas').getElementsByTagName('tbody')[0];
        tablaFallas.innerHTML = '';

        snapshot.forEach((doc) => {
            const data = doc.data();
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
                <td>${data.descripcion}</td>
                <td><span class="status-badge status-${data.estado}">${data.estado}</span></td>
                <td>${fechaFormateada}</td>
                <td>
                    <button class="btn btn-success btn-sm btn-resolver" data-id="${doc.id}"><i class="fas fa-check"></i> Resolver</button>
                    <button class="btn btn-danger btn-sm btn-eliminar" data-id="${doc.id}"><i class="fas fa-trash"></i> Eliminar</button>
                </td>
            `;

            tablaFallas.appendChild(tr);
        });

        // Agregar event listeners a los botones
        document.querySelectorAll('.btn-resolver').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                resolverFalla(id);
            });
        });

        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                eliminarFalla(id);
            });
        });
    });
}

// Resolver una falla
function resolverFalla(id) {
    db.collection('fallas').doc(id).update({
        estado: 'resuelto'
    })
        .then(() => {
            mostrarNotificacion('Falla marcada como resuelta', 'success');
            cargarFallas();
            if (document.getElementById('dashboard').classList.contains('active')) {
                cargarDatosDashboard();
            }
        })
        .catch((error) => {
            alert('Error al marcar la falla como resuelta: ' + error.message);
        });
}

// Eliminar una falla
function eliminarFalla(id) {
    if (confirm('¿Está seguro de que desea eliminar esta falla?')) {
        db.collection('fallas').doc(id).delete()
            .then(() => {
                alert('Falla eliminada correctamente');
                cargarFallas();
                if (document.getElementById('dashboard').classList.contains('active')) {
                    cargarDatosDashboard();
                }
            })
            .catch((error) => {
                mostrarNotificacion('Error al eliminar la falla: ' + error.message, 'error');
            });
    }
}

// Event listeners para filtros
document.getElementById('filterEstado').addEventListener('change', cargarFallas);
document.getElementById('filterTipo').addEventListener('change', cargarFallas);