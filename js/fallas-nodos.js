// fallas-nodos.js - Versión mejorada
document.addEventListener('DOMContentLoaded', function() {
    const db = firebase.firestore();
    const formFallaNodo = document.getElementById('formFallaNodo');
    const tablaFallasNodos = document.getElementById('tablaFallasNodos');
    const filtroEstadoNodo = document.getElementById('filtroEstadoNodo');
    const agregarProductoBtn = document.getElementById('agregarProducto');
    const productosList = document.getElementById('productosList');
    const btnLimpiarNodo = document.getElementById('btnLimpiarNodo');
    const submitButton = formFallaNodo.querySelector('button[type="submit"]');
    
    let editandoId = null;

    // Agregar campo de producto
    agregarProductoBtn.addEventListener('click', function() {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        productItem.innerHTML = `
            <input type="text" placeholder="Nombre del producto" class="producto-nombre form-control">
            <input type="number" placeholder="Cantidad" class="producto-cantidad form-control" min="1">
            <button type="button" class="btn btn-danger remove-product">Eliminar</button>
        `;
        
        productItem.querySelector('.remove-product').addEventListener('click', function() {
            productItem.remove();
        });
        
        productosList.appendChild(productItem);
    });

    // Eliminar campo de producto (evento delegado)
    productosList.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-product')) {
            e.target.closest('.product-item').remove();
        }
    });

    // Cargar fallas de nodos
    function cargarFallasNodos(filtroEstado = 'Todos') {
        let query = db.collection('fallas_nodos').orderBy('fechaRegistro', 'desc');
        
        tablaFallasNodos.querySelector('tbody').innerHTML = '<tr><td colspan="7">Cargando...</td></tr>';
        
        query.get().then((querySnapshot) => {
            let html = '';
            if (querySnapshot.empty) {
                html = '<tr><td colspan="7">No hay fallas de nodos registradas</td></tr>';
            } else {
                querySnapshot.forEach((doc) => {
                    const falla = doc.data();
                    const fechaHora = `${falla.fecha} ${falla.hora}`;
                    
                    // Aplicar filtros
                    if (filtroEstado === 'Todos' || falla.estado === filtroEstado) {
                        // Formatear productos
                        let productosHTML = '';
                        if (falla.productos && falla.productos.length > 0) {
                            productosHTML = '<ul style="margin: 0; padding-left: 20px;">';
                            falla.productos.forEach(producto => {
                                productosHTML += `<li>${producto.nombre} (${producto.cantidad})</li>`;
                            });
                            productosHTML += '</ul>';
                        }
                        
                        // Determinar clase de estado
                        let estadoClass = '';
                        if (falla.estado === 'Pendiente') estadoClass = 'badge-warning';
                        if (falla.estado === 'Resuelto') estadoClass = 'badge-success';
                        if (falla.estado === 'En Proceso') estadoClass = 'badge-info';
                        
                        html += `
                            <tr>
                                <td>${fechaHora}</td>
                                <td>${falla.nodo}</td>
                                <td>${falla.falla}</td>
                                <td>${productosHTML}</td>
                                <td>${falla.tecnico}</td>
                                <td><span class="badge ${estadoClass}">${falla.estado}</span></td>
                                <td>
                                    <button class="btn btn-sm btn-info editar-falla-nodo" data-id="${doc.id}">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger eliminar-falla-nodo" data-id="${doc.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                    ${falla.estado !== 'Resuelto' ? 
                                    `<button class="btn btn-sm btn-success resolver-falla-nodo" data-id="${doc.id}">
                                        <i class="fas fa-check"></i> Resolver
                                    </button>` : ''}
                                </td>
                            </tr>
                        `;
                    }
                });
                
                if (html === '') {
                    html = '<tr><td colspan="7">No hay resultados para los filtros aplicados</td></tr>';
                }
            }
            tablaFallasNodos.querySelector('tbody').innerHTML = html;
            
            // Agregar event listeners a los botones
            document.querySelectorAll('.editar-falla-nodo').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.closest('button').dataset.id;
                    editarFallaNodo(id);
                });
            });
            
            document.querySelectorAll('.eliminar-falla-nodo').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.closest('button').dataset.id;
                    eliminarFallaNodo(id);
                });
            });
            
            document.querySelectorAll('.resolver-falla-nodo').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.closest('button').dataset.id;
                    resolverFallaNodo(id);
                });
            });
        }).catch((error) => {
            console.error("Error al cargar fallas de nodos: ", error);
            mostrarNotificacion('Error al cargar los datos', 'error');
            tablaFallasNodos.querySelector('tbody').innerHTML = '<tr><td colspan="7">Error al cargar los datos</td></tr>';
        });
    }

    // Función para cargar datos en el formulario de edición
    function cargarDatosEdicion(id) {
        db.collection('fallas_nodos').doc(id).get()
            .then((doc) => {
                if (doc.exists) {
                    const falla = doc.data();
                    
                    // Llenar el formulario con los datos
                    document.getElementById('fechaNodo').value = falla.fecha;
                    document.getElementById('horaNodo').value = falla.hora;
                    document.getElementById('nombreNodo').value = falla.nodo;
                    document.getElementById('descripcionFallaNodo').value = falla.falla;
                    document.getElementById('tecnicoAsignado').value = falla.tecnico;
                    document.getElementById('estadoNodo').value = falla.estado;
                    document.getElementById('observacionesNodo').value = falla.observaciones || '';
                    
                    // Limpiar y cargar productos
                    productosList.innerHTML = '';
                    if (falla.productos && falla.productos.length > 0) {
                        falla.productos.forEach(producto => {
                            const productItem = document.createElement('div');
                            productItem.className = 'product-item';
                            productItem.innerHTML = `
                                <input type="text" placeholder="Nombre del producto" class="producto-nombre form-control" value="${producto.nombre}">
                                <input type="number" placeholder="Cantidad" class="producto-cantidad form-control" value="${producto.cantidad}" min="1">
                                <button type="button" class="btn btn-danger remove-product">Eliminar</button>
                            `;
                            
                            productItem.querySelector('.remove-product').addEventListener('click', function() {
                                productItem.remove();
                            });
                            
                            productosList.appendChild(productItem);
                        });
                    } else {
                        // Agregar un campo vacío si no hay productos
                        agregarProductoBtn.click();
                    }
                    
                    // Cambiar texto del botón
                    submitButton.innerHTML = '<i class="fas fa-save"></i> Actualizar Falla de Nodo';
                    editandoId = id;
                    
                    // Scroll al formulario
                    formFallaNodo.scrollIntoView({ behavior: 'smooth' });
                } else {
                    mostrarNotificacion('No se encontró la falla de nodo', 'error');
                }
            })
            .catch((error) => {
                console.error("Error al cargar datos para edición: ", error);
                mostrarNotificacion('Error al cargar datos para edición', 'error');
            });
    }

    // Función para editar una falla de nodo
    function editarFallaNodo(id) {
        cargarDatosEdicion(id);
    }

    // Registrar nueva falla de nodo o actualizar existente
    formFallaNodo.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Obtener productos
        const productos = [];
        const productItems = productosList.querySelectorAll('.product-item');
        
        productItems.forEach(item => {
            const nombre = item.querySelector('.producto-nombre').value;
            const cantidad = item.querySelector('.producto-cantidad').value;
            
            if (nombre && cantidad) {
                productos.push({
                    nombre: nombre,
                    cantidad: cantidad
                });
            }
        });
        
        // Obtener valores del formulario
        const fallaNodoData = {
            fecha: document.getElementById('fechaNodo').value,
            hora: document.getElementById('horaNodo').value,
            nodo: document.getElementById('nombreNodo').value,
            falla: document.getElementById('descripcionFallaNodo').value,
            productos: productos,
            tecnico: document.getElementById('tecnicoAsignado').value,
            estado: document.getElementById('estadoNodo').value,
            observaciones: document.getElementById('observacionesNodo').value,
            fechaActualizacion: new Date()
        };
        
        // Si estamos editando, agregar también la fecha de registro original
        if (editandoId) {
            fallaNodoData.fechaRegistro = firebase.firestore.Timestamp.fromDate(new Date(document.getElementById('fechaNodo').value));
        } else {
            fallaNodoData.fechaRegistro = new Date();
        }
        
        if (editandoId) {
            // Actualizar documento existente
            db.collection('fallas_nodos').doc(editandoId).update(fallaNodoData)
                .then(() => {
                    mostrarNotificacion('Falla de nodo actualizada correctamente', 'success');
                    limpiarFormularioNodo();
                    cargarFallasNodos(filtroEstadoNodo.value);
                    editandoId = null;
                })
                .catch((error) => {
                    console.error("Error al actualizar falla de nodo: ", error);
                    mostrarNotificacion('Error al actualizar la falla de nodo', 'error');
                });
        } else {
            // Crear nuevo documento
            db.collection('fallas_nodos').add(fallaNodoData)
                .then(() => {
                    mostrarNotificacion('Falla de nodo registrada correctamente', 'success');
                    limpiarFormularioNodo();
                    cargarFallasNodos(filtroEstadoNodo.value);
                })
                .catch((error) => {
                    console.error("Error al registrar falla de nodo: ", error);
                    mostrarNotificacion('Error al registrar la falla de nodo', 'error');
                });
        }
    });

    // Limpiar formulario
    btnLimpiarNodo.addEventListener('click', limpiarFormularioNodo);
    
    function limpiarFormularioNodo() {
        document.getElementById('fechaNodo').value = '';
        document.getElementById('horaNodo').value = '';
        document.getElementById('nombreNodo').value = '';
        document.getElementById('descripcionFallaNodo').value = '';
        document.getElementById('tecnicoAsignado').value = '';
        document.getElementById('estadoNodo').value = 'Pendiente';
        document.getElementById('observacionesNodo').value = '';
        
        // Limpiar productos
        productosList.innerHTML = '';
        
        // Restaurar texto del botón
        submitButton.innerHTML = '<i class="fas fa-save"></i> Registrar Falla de Nodo';
        editandoId = null;
        
        // Agregar un campo de producto vacío
        agregarProductoBtn.click();
        
        // Establecer fecha y hora actual
        const now = new Date();
        document.getElementById('fechaNodo').value = now.toISOString().split('T')[0];
        document.getElementById('horaNodo').value = now.toTimeString().substring(0, 5);
    }

    // Filtrar fallas cuando cambien los filtros
    filtroEstadoNodo.addEventListener('change', () => {
        cargarFallasNodos(filtroEstadoNodo.value);
    });

    // Resolver una falla de nodo
    function resolverFallaNodo(id) {
        db.collection('fallas_nodos').doc(id).update({
            estado: 'Resuelto',
            fechaResolucion: new Date()
        })
        .then(() => {
            mostrarNotificacion('Falla de nodo marcada como resuelta', 'success');
            cargarFallasNodos(filtroEstadoNodo.value);
        })
        .catch((error) => {
            console.error("Error al resolver falla de nodo: ", error);
            mostrarNotificacion('Error al resolver la falla de nodo', 'error');
        });
    }

    // Eliminar una falla de nodo
    function eliminarFallaNodo(id) {
        if (confirm('¿Está seguro de que desea eliminar esta falla de nodo?')) {
            db.collection('fallas_nodos').doc(id).delete()
                .then(() => {
                    mostrarNotificacion('Falla de nodo eliminada correctamente', 'success');
                    cargarFallasNodos(filtroEstadoNodo.value);
                })
                .catch((error) => {
                    console.error("Error al eliminar falla de nodo: ", error);
                    mostrarNotificacion('Error al eliminar la falla de nodo', 'error');
                });
        }
    }

    // Establecer fecha y hora actual por defecto
    const now = new Date();
    document.getElementById('fechaNodo').value = now.toISOString().split('T')[0];
    document.getElementById('horaNodo').value = now.toTimeString().substring(0, 5);
    
    // Agregar un campo de producto vacío al iniciar
    agregarProductoBtn.click();
    
    // Cargar datos al iniciar
    cargarFallasNodos();
});