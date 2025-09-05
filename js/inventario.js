// inventario.js - VERSIÓN CORREGIDA

// --- VARIABLES GLOBALES ---
// db se importa desde firebase/config.js

// --- FUNCIONES GLOBALES ---
function cargarInventario() {
    const filtroCategoria = document.getElementById('filtroCategoria');
    const tablaInventario = document.getElementById('tablaInventario');

    let query = db.collection('inventario');

    if (filtroCategoria && filtroCategoria.value !== 'todos') {
        query = query.where('categoria', '==', filtroCategoria.value);
    }

    query.get().then((snapshot) => {
        let html = '';
        if (snapshot.empty) {
            html = '<tr><td colspan="6">No hay productos en el inventario</td></tr>';
        } else {
            snapshot.forEach((doc) => {
                const producto = doc.data();
                const estado = obtenerEstadoStock(producto.cantidad);
                const estadoClass = obtenerClaseEstadoStock(estado);

                let infoAdicional = '';
                if (producto.tipo && producto.tipo !== 'general') {
                    infoAdicional = `<br><small class="text-muted">Tipo: ${producto.tipo}</small>`;
                }
                if (producto.modelo) {
                    infoAdicional += `<br><small class="text-muted">Modelo: ${producto.modelo}</small>`;
                }

                if (producto.categoria === 'conector' && producto.detalles) {
                    if (producto.detalles.tipo === 'fibra') {
                        infoAdicional += `<br><small class="text-muted">APC: ${producto.detalles.cantidadAPC || 0}, UPC: ${producto.detalles.cantidadUPC || 0}</small>`;
                    } else if (producto.detalles.tipo === 'inalambrico') {
                        infoAdicional += `<br><small class="text-muted">Modelo: ${producto.detalles.modelo || 'N/A'}</small>`;
                    }
                }

                const cantidadDisplay = producto.categoria === 'cable' ?
                    `${producto.cantidad}m` : producto.cantidad;

                html += `
                    <tr>
                        <td>${producto.categoria}</td>
                        <td>${producto.nombre}${infoAdicional}</td>
                        <td>${cantidadDisplay}</td>
                        <td><span class="badge badge-${estadoClass}">${estado}</span></td>
                        <td>
                            <button class="btn btn-sm btn-info" onclick="editarProducto('${doc.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="ajustarStock('${doc.id}')">
                                <i class="fas fa-calculator"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="eliminarProducto('${doc.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
        if (tablaInventario) {
            tablaInventario.querySelector('tbody').innerHTML = html;
        }
    });
}

function obtenerEstadoStock(cantidad) {
    if (cantidad === 0) return 'Sin stock';
    if (cantidad <= 5) return 'Bajo';
    return 'Disponible';
}

function obtenerClaseEstadoStock(estado) {
    const estados = {
        'Disponible': 'success',
        'Bajo': 'warning',
        'Sin stock': 'danger'
    };
    return estados[estado] || 'secondary';
}

function eliminarProducto(id) {
    if (confirm('¿Está seguro de que desea eliminar este producto?')) {
        db.collection('inventario').doc(id).delete()
            .then(() => {
                mostrarNotificacion('Producto eliminado correctamente', 'success');
                cargarInventario();
            })
            .catch((error) => {
                console.error('Error al eliminar producto:', error);
                mostrarNotificacion('Error al eliminar producto', 'error');
            });
    }
}

function editarProducto(id) {
    db.collection('inventario').doc(id).get().then((doc) => {
        if (doc.exists) {
            const producto = doc.data();
            document.getElementById('categoriaProducto').value = producto.categoria;
            actualizarCamposCategoria();

            document.getElementById('nombreProducto').value = producto.nombre;
            document.getElementById('descripcionProducto').value = producto.descripcion;

            if (producto.categoria === 'cable') {
                document.getElementById('tipoCable').value = producto.tipo;
                document.getElementById('metrajeProducto').value = producto.cantidad;
            } else if (producto.categoria === 'otro') {
                document.getElementById('modeloOtro').value = producto.modelo || '';
                document.getElementById('cantidadOtro').value = producto.cantidad;
                document.getElementById('marcaOtro').value = producto.detalles?.marca || '';
                document.getElementById('serieOtro').value = producto.detalles?.serie || '';
                document.getElementById('caracteristicasOtro').value = producto.detalles?.caracteristicas || '';
            } else {
                document.getElementById('modeloProducto').value = producto.modelo || '';
                document.getElementById('cantidadProducto').value = producto.cantidad;

                if (producto.categoria === 'conector') {
                    document.getElementById('tipoConector').value = producto.detalles?.tipo || '';
                    actualizarCamposConector();

                    if (producto.detalles?.tipo === 'fibra') {
                        document.getElementById('cantidadAPC').value = producto.detalles.cantidadAPC || 0;
                        document.getElementById('cantidadUPC').value = producto.detalles.cantidadUPC || 0;
                    } else if (producto.detalles?.tipo === 'inalambrico') {
                        document.getElementById('modeloRJ45').value = producto.detalles.modelo || '';
                        document.getElementById('cantidadRJ45').value = producto.cantidad;
                    }
                }
            }

            document.getElementById('btnSubmitProducto').textContent = 'Actualizar Producto';
            document.getElementById('formProducto').dataset.editingId = id;
            document.getElementById('formProducto').scrollIntoView();
        }
    });
}

function ajustarStock(id) {
    const nuevaCantidad = prompt('Ingrese la nueva cantidad:');
    if (nuevaCantidad !== null && !isNaN(nuevaCantidad)) {
        db.collection('inventario').doc(id).update({
            cantidad: parseFloat(nuevaCantidad)
        })
            .then(() => {
                mostrarNotificacion('Stock ajustado correctamente', 'success');
                cargarInventario();
            })
            .catch((error) => {
                console.error('Error al ajustar stock:', error);
                mostrarNotificacion('Error al ajustar stock', 'error');
            });
    }
}

function actualizarCamposCategoria() {
    const categoria = document.getElementById('categoriaProducto').value;

    // Ocultar todos los grupos primero
    document.getElementById('tipoCableGroup').style.display = 'none';
    document.getElementById('tipoConectorGroup').style.display = 'none';
    document.getElementById('fibraFields').style.display = 'none';
    document.getElementById('inalambricoFields').style.display = 'none';
    document.getElementById('metrajeGroup').style.display = 'none';
    document.getElementById('formularioOtros').style.display = 'none';
    document.getElementById('formularioBasico').style.display = 'grid';
    document.getElementById('nombreProductoGroup').style.display = 'block';

    // Remover atributo required de todos los campos numéricos
    document.getElementById('metrajeProducto').removeAttribute('required');
    document.getElementById('cantidadProducto').removeAttribute('required');
    document.getElementById('cantidadRJ45').removeAttribute('required');
    document.getElementById('cantidadAPC').removeAttribute('required');
    document.getElementById('cantidadUPC').removeAttribute('required');
    document.getElementById('cantidadOtro').removeAttribute('required');

    // Configurar campos según la categoría
    if (categoria === 'cable') {
        document.getElementById('tipoCableGroup').style.display = 'grid';
        document.getElementById('metrajeGroup').style.display = 'block';
        document.getElementById('formularioBasico').style.display = 'none';
        document.getElementById('metrajeProducto').setAttribute('required', 'true');
        document.getElementById('nombreProducto').value = 'Cable';
        document.getElementById('nombreProductoGroup').style.display = 'none';
    }
    else if (categoria === 'conector') {
        document.getElementById('tipoConectorGroup').style.display = 'block';
        document.getElementById('formularioBasico').style.display = 'none';
        document.getElementById('nombreProducto').value = 'Conector';
        document.getElementById('nombreProductoGroup').style.display = 'none';

        const tipoConector = document.getElementById('tipoConector').value;
        if (tipoConector === 'fibra') {
            document.getElementById('fibraFields').style.display = 'block';
            document.getElementById('cantidadAPC').setAttribute('required', 'true');
            document.getElementById('cantidadUPC').setAttribute('required', 'true');
        } else if (tipoConector === 'inalambrico') {
            document.getElementById('inalambricoFields').style.display = 'block';
            document.getElementById('modeloRJ45').setAttribute('required', 'true');
            document.getElementById('cantidadRJ45').setAttribute('required', 'true');
        }
    }
    else if (categoria === 'otro') {
        document.getElementById('formularioOtros').style.display = 'block';
        document.getElementById('formularioBasico').style.display = 'none';
        document.getElementById('cantidadOtro').setAttribute('required', 'true');
    }
    else {
        document.getElementById('cantidadProducto').setAttribute('required', 'true');
        document.getElementById('nombreProductoGroup').style.display = 'block';
    }
}

function actualizarCamposConector() {
    const tipoConector = document.getElementById('tipoConector').value;

    // Ocultar todos los campos primero
    document.getElementById('fibraFields').style.display = 'none';
    document.getElementById('inalambricoFields').style.display = 'none';

    // Remover atributos required de todos los campos de conector
    document.getElementById('modeloRJ45').removeAttribute('required');
    document.getElementById('cantidadRJ45').removeAttribute('required');
    document.getElementById('cantidadAPC').removeAttribute('required');
    document.getElementById('cantidadUPC').removeAttribute('required');

    // Mostrar campos según el tipo seleccionado
    if (tipoConector === 'fibra') {
        document.getElementById('fibraFields').style.display = 'block';
        document.getElementById('cantidadAPC').setAttribute('required', 'true');
        document.getElementById('cantidadUPC').setAttribute('required', 'true');
    } else if (tipoConector === 'inalambrico') {
        document.getElementById('inalambricoFields').style.display = 'block';
        document.getElementById('modeloRJ45').setAttribute('required', 'true');
        document.getElementById('cantidadRJ45').setAttribute('required', 'true');
    }
}

function obtenerTipoProducto(categoria) {
    switch (categoria) {
        case 'cable':
            return document.getElementById('tipoCable').value;
        case 'conector':
            return document.getElementById('tipoConector').value;
        default:
            return 'general';
    }
}

function mostrarNotificacion(mensaje, tipo) {
    alert(`${tipo.toUpperCase()}: ${mensaje}`);
}

function verInstalacion(id) {
    db.collection('instalaciones').doc(id).get()
        .then((doc) => {
            if (doc.exists) {
                const instalacion = doc.data();
                mostrarDetallesInstalacion(instalacion, id);
            } else {
                mostrarNotificacion('Instalación no encontrada', 'error');
            }
        })
        .catch((error) => {
            console.error('Error al obtener instalación:', error);
            mostrarNotificacion('Error al cargar los detalles', 'error');
        });
}

function mostrarDetallesInstalacion(instalacion, id) {
    // Primero obtener los nombres de los productos
    const obtenerNombresProductos = async () => {
        const productosConNombres = [];

        for (const producto of instalacion.productos) {
            try {
                const doc = await db.collection('inventario').doc(producto.productoId).get();
                if (doc.exists) {
                    const productoData = doc.data();
                    productosConNombres.push({
                        nombre: productoData.nombre || 'Producto',
                        cantidad: producto.cantidad,
                        // ✅ CAMBIO IMPORTANTE: Usar modelo de la base de datos
                        modelo: productoData.modelo || productoData.detalles?.modelo || productoData.tipo || 'N/A'
                    });
                } else {
                    productosConNombres.push({
                        nombre: 'Producto eliminado',
                        cantidad: producto.cantidad,
                        modelo: producto.modelo || 'N/A'
                    });
                }
            } catch (error) {
                console.error('Error al obtener producto:', error);
                productosConNombres.push({
                    nombre: 'Error al cargar',
                    cantidad: producto.cantidad,
                    modelo: producto.modelo || 'N/A'
                });
            }
        }

        return productosConNombres;
    };

    // Función para mostrar el modal con los datos
    const mostrarModalConDatos = async () => {
        const productosConNombres = await obtenerNombresProductos();

        const modalContent = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Información del Cliente</h6>
                    <p><strong>Cliente:</strong> ${instalacion.cliente}</p>
                    <p><strong>Cédula:</strong> ${instalacion.cedula || 'N/A'}</p>
                    <p><strong>Teléfono:</strong> ${instalacion.telefono || 'N/A'}</p>
                    <p><strong>Dirección:</strong> ${instalacion.direccion}</p>
                </div>
                <div class="col-md-6">
                    <h6>Detalles Técnicos</h6>
                    <p><strong>Fecha:</strong> ${instalacion.fecha}</p>
                    <p><strong>Tipo:</strong> ${instalacion.tipo}</p>
                    <p><strong>Técnico:</strong> ${instalacion.tecnico}</p>
                    <p><strong>Estado:</strong> ${instalacion.estado}</p>
                    <p><strong>Cable:</strong> ${instalacion.cable}m (${instalacion.tipoCable})</p>
                </div>
            </div>
            
            <h6 class="mt-3">Productos Utilizados</h6>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Modelo</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productosConNombres.map(producto => `
                            <tr>
                                <td>${producto.nombre}</td>
                                <td>${producto.cantidad}</td>
                                <td>${producto.modelo}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            ${instalacion.codigosEquipos && instalacion.codigosEquipos.length > 0 ? `
            <h6>Códigos de Equipos</h6>
            <ul>
                ${instalacion.codigosEquipos.map(codigo => `
                    <li><strong>${codigo.tipo}:</strong> ${codigo.codigo}</li>
                `).join('')}
            </ul>
            ` : ''}

            ${instalacion.observaciones ? `
            <h6>Observaciones</h6>
            <p>${instalacion.observaciones}</p>
            ` : ''}
        `;

        // Usar tu función mostrarModal existente
        mostrarModal('Detalles de Instalación', modalContent);
    };

    // Ejecutar
    mostrarModalConDatos();
}

// --- FUNCIONES GLOBALES PARA INSTALACIONES ---

function cargarInstalaciones() {
    const tablaInstalaciones = document.getElementById('tablaInstalaciones');

    let query = db.collection('instalaciones').orderBy('fechaRegistro', 'desc');

    if (filtroEstadoInstalacion.value !== 'todos') {
        query = query.where('estado', '==', filtroEstadoInstalacion.value);
    }

    if (filtroTipoInstalacion.value !== 'todos') {
        query = query.where('tipo', '==', filtroTipoInstalacion.value);
    }

    query.get().then((snapshot) => {
        let html = '';
        if (snapshot.empty) {
            html = '<tr><td colspan="9">No hay instalaciones registradas</td></tr>';
        } else {
            snapshot.forEach((doc) => {
                const instalacion = doc.data();
                const estadoClass = obtenerClaseEstadoInstalacion(instalacion.estado);

                html += `
                    <tr>
                        <td>${instalacion.fecha}</td>
                        <td>${instalacion.cliente}</td>
                        <td>${instalacion.cedula || 'N/A'}</td>
                        <td>${instalacion.tipo}</td>
                        <td>${instalacion.tecnico}</td>
                        <td>${instalacion.productos.length} productos</td>
                        <td>${instalacion.cable}m (${instalacion.tipoCable})</td>
                        <td><span class="badge badge-${estadoClass}">${instalacion.estado}</span></td>
                        <td>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-info ver-btn" data-id="${doc.id}" title="Ver detalles">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-danger eliminar-btn" data-id="${doc.id}" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                                <button class="btn btn-sm btn-secondary dropdown-toggle" type="button" 
                                        data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="fas fa-cog"></i>
                                </button>
                                <div class="dropdown-menu">
                                    <h6 class="dropdown-header">Cambiar estado</h6>
                                    <a class="dropdown-item estado-btn" href="#" data-id="${doc.id}" data-estado="programada">
                                        <span class="badge badge-secondary">Programada</span>
                                    </a>
                                    <a class="dropdown-item estado-btn" href="#" data-id="${doc.id}" data-estado="en-proceso">
                                        <span class="badge badge-warning">En Proceso</span>
                                    </a>
                                    <a class="dropdown-item estado-btn" href="#" data-id="${doc.id}" data-estado="completada">
                                        <span class="badge badge-success">Completada</span>
                                    </a>
                                    <a class="dropdown-item estado-btn" href="#" data-id="${doc.id}" data-estado="cancelada">
                                        <span class="badge badge-danger">Cancelada</span>
                                    </a>
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }
        if (tablaInstalaciones) {
            tablaInstalaciones.querySelector('tbody').innerHTML = html;

            // 🔥 INICIALIZAR DROPDOWNS DE BOOTSTRAP 🔥
            const dropdowns = tablaInstalaciones.querySelectorAll('.dropdown-toggle');
            dropdowns.forEach(dropdown => {
                new bootstrap.Dropdown(dropdown);
            });
        }
    });
}

function eliminarInstalacion(id) {
    if (confirm('¿Está seguro de que desea eliminar esta instalación? Esta acción no se puede deshacer.')) {
        db.collection('instalaciones').doc(id).delete()
            .then(() => {
                mostrarNotificacion('Instalación eliminada correctamente', 'success');
                cargarInstalaciones(); // Recargar la tabla
            })
            .catch((error) => {
                console.error('Error al eliminar instalación:', error);
                mostrarNotificacion('Error al eliminar la instalación', 'error');
            });
    }
}

function cambiarEstadoInstalacion(id, nuevoEstado) {
    db.collection('instalaciones').doc(id).update({
        estado: nuevoEstado,
        fechaActualizacion: new Date()
    })
        .then(() => {
            mostrarNotificacion(`Estado cambiado a ${nuevoEstado} correctamente`, 'success');
            cargarInstalaciones(); // Recargar la tabla
        })
        .catch((error) => {
            console.error('Error al cambiar estado:', error);
            mostrarNotificacion('Error al cambiar el estado', 'error');
        });
}

function obtenerClaseEstadoInstalacion(estado) {
    const estados = {
        'programada': 'secondary',
        'en-proceso': 'warning',
        'completada': 'success',
        'cancelada': 'danger'
    };
    return estados[estado] || 'secondary';
}

// --- FIN FUNCIONES GLOBALES ---

document.addEventListener('DOMContentLoaded', function () {
    // ... (el resto de tu código dentro del DOMContentLoaded)
});

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', function () {
    // db ya está inicializado en firebase/config.js

    // Referencias a elementos del DOM
    const formProducto = document.getElementById('formProducto');
    const formInstalacion = document.getElementById('formInstalacion');
    const btnLimpiarProducto = document.getElementById('btnLimpiarProducto');
    const btnLimpiarInstalacion = document.getElementById('btnLimpiarInstalacion');
    const btnAgregarProducto = document.getElementById('btnAgregarProducto');
    const productosInstalacion = document.getElementById('productosInstalacion');
    const filtroCategoria = document.getElementById('filtroCategoria');
    const filtroEstadoInstalacion = document.getElementById('filtroEstadoInstalacion');
    const filtroTipoInstalacion = document.getElementById('filtroTipoInstalacion');
    const tipoInstalacionSelect = document.getElementById('tipoInstalacion');
    const equipoSelector = document.getElementById('equipoSelector');
    const btnAgregarEquipo = document.getElementById('btnAgregarEquipo');
    const inputBuscarInstalaciones = document.getElementById('inputBuscarInstalaciones');

    // Inicializar fecha actual
    document.getElementById('fechaInstalacion').value = new Date().toISOString().split('T')[0];

    // Cargar productos en el select de instalaciones
    cargarProductosParaSelect();

    // Actualizar selector de equipos según tipo de instalación
    tipoInstalacionSelect.addEventListener('change', actualizarEquiposPorTipo);
    actualizarEquiposPorTipo();

    // Agregar campo de producto en instalación
    btnAgregarProducto.addEventListener('click', function () {
        agregarProductoManual();
    });

    // Agregar nuevo equipo personalizado
    btnAgregarEquipo.addEventListener('click', function () {
        agregarEquipoPersonalizado();
    });

    // Buscar instalaciones
    inputBuscarInstalaciones.addEventListener('input', function () {
        buscarInstalaciones(this.value);
    });


    // Registrar nuevo producto
    formProducto.addEventListener('submit', function (e) {
        e.preventDefault();

        const categoria = document.getElementById('categoriaProducto').value;
        let esValido = true;

        // Validación manual según la categoría
        if (categoria === 'cable') {
            const metraje = document.getElementById('metrajeProducto').value;
            if (!metraje || parseFloat(metraje) <= 0) {
                mostrarNotificacion('Por favor ingrese el metraje del cable', 'error');
                document.getElementById('metrajeProducto').focus();
                esValido = false;
            }
        }
        else if (categoria === 'conector') {
            const tipoConector = document.getElementById('tipoConector').value;
            if (!tipoConector) {
                mostrarNotificacion('Por favor seleccione el tipo de conector', 'error');
                document.getElementById('tipoConector').focus();
                esValido = false;
            } else if (tipoConector === 'fibra') {
                const apc = document.getElementById('cantidadAPC').value || 0;
                const upc = document.getElementById('cantidadUPC').value || 0;
                if ((parseInt(apc) + parseInt(upc)) <= 0) {
                    mostrarNotificacion('Por favor ingrese la cantidad de conectores de fibra', 'error');
                    document.getElementById('cantidadAPC').focus();
                    esValido = false;
                }
            } else if (tipoConector === 'inalambrico') {
                const cantidad = document.getElementById('cantidadRJ45').value;
                const modelo = document.getElementById('modeloRJ45').value;

                if (!cantidad || parseInt(cantidad) <= 0) {
                    mostrarNotificacion('Por favor ingrese la cantidad de conectores', 'error');
                    document.getElementById('cantidadRJ45').focus();
                    esValido = false;
                }
                else if (!modelo) {
                    mostrarNotificacion('Por favor ingrese el modelo del conector RJ45', 'error');
                    document.getElementById('modeloRJ45').focus();
                    esValido = false;
                }
            }
        }
        else if (categoria === 'otro') {
            const cantidad = document.getElementById('cantidadOtro').value;
            if (!cantidad || parseInt(cantidad) <= 0) {
                mostrarNotificacion('Por favor ingrese la cantidad', 'error');
                document.getElementById('cantidadOtro').focus();
                esValido = false;
            }
        }
        else {
            const cantidad = document.getElementById('cantidadProducto').value;
            if (!cantidad || parseInt(cantidad) <= 0) {
                mostrarNotificacion('Por favor ingrese la cantidad', 'error');
                document.getElementById('cantidadProducto').focus();
                esValido = false;
            }
        }

        // Validación del nombre del producto (solo para categorías que no son cable o conector)
        if (categoria !== 'cable' && categoria !== 'conector') {
            const nombre = document.getElementById('nombreProducto').value;
            if (!nombre) {
                mostrarNotificacion('Por favor ingrese el nombre del producto', 'error');
                document.getElementById('nombreProducto').focus();
                esValido = false;
            }
        }

        if (!esValido) return;

        const tipo = obtenerTipoProducto(categoria);
        let cantidad;
        let detalles = {};
        let modelo = '';

        if (categoria === 'cable') {
            cantidad = parseFloat(document.getElementById('metrajeProducto').value);
            modelo = document.getElementById('tipoCable').value;
            detalles = {
                tipo: modelo,
                metraje: cantidad
            };
        }
        else if (categoria === 'conector') {
            const tipoConector = document.getElementById('tipoConector').value;

            if (tipoConector === 'fibra') {
                const cantidadAPC = parseInt(document.getElementById('cantidadAPC').value) || 0;
                const cantidadUPC = parseInt(document.getElementById('cantidadUPC').value) || 0;
                cantidad = cantidadAPC + cantidadUPC;

                detalles = {
                    tipo: 'fibra',
                    cantidadAPC: cantidadAPC,
                    cantidadUPC: cantidadUPC
                };
            }
            else if (tipoConector === 'inalambrico') {
                cantidad = parseInt(document.getElementById('cantidadRJ45').value) || 0;
                modelo = document.getElementById('modeloRJ45').value;
                detalles = {
                    tipo: 'inalambrico',
                    modelo: modelo
                };
            }
        }
        else if (categoria === 'otro') {
            cantidad = parseInt(document.getElementById('cantidadOtro').value);
            modelo = document.getElementById('modeloOtro').value;
            detalles = {
                marca: document.getElementById('marcaOtro').value,
                serie: document.getElementById('serieOtro').value,
                caracteristicas: document.getElementById('caracteristicasOtro').value
            };
        }
        else {
            cantidad = parseInt(document.getElementById('cantidadProducto').value);
            modelo = document.getElementById('modeloProducto').value || '';
        }

        // Validación final de cantidad
        if (cantidad <= 0) {
            mostrarNotificacion('La cantidad debe ser mayor a cero', 'error');
            return;
        }

        const producto = {
            categoria: categoria,
            tipo: tipo,
            nombre: categoria === 'cable' ? 'Cable' :
                categoria === 'conector' ? 'Conector' :
                    document.getElementById('nombreProducto').value,
            modelo: modelo,
            cantidad: cantidad,
            minimo: 0,
            descripcion: document.getElementById('descripcionProducto').value,
            detalles: detalles,
            fechaRegistro: new Date()
        };

        // Verificar si estamos editando o creando nuevo
        const editingId = formProducto.dataset.editingId;

        if (editingId) {
            db.collection('inventario').doc(editingId).update(producto)
                .then(() => {
                    mostrarNotificacion('Producto actualizado correctamente', 'success');
                    limpiarFormularioProducto();
                    cargarInventario();
                })
                .catch((error) => {
                    console.error('Error al actualizar producto:', error);
                    mostrarNotificacion('Error al actualizar producto', 'error');
                });
        } else {
            db.collection('inventario').add(producto)
                .then(() => {
                    mostrarNotificacion('Producto registrado correctamente', 'success');
                    limpiarFormularioProducto();
                    cargarInventario();
                    actualizarTodosLosSelectsProducto();
                })
                .catch((error) => {
                    console.error('Error al registrar producto:', error);
                    mostrarNotificacion('Error al registrar producto', 'error');
                });
        }
    });


    // Event listeners para las acciones de instalaciones
    // Event listeners para las acciones de instalaciones - VERSIÓN CORREGIDA
    function initInstalacionesEventListeners() {
        // Delegación de eventos para elementos dinámicos
        document.addEventListener('click', function (e) {
            // Eliminar instalación
            const eliminarBtn = e.target.closest('.eliminar-btn');
            if (eliminarBtn) {
                e.preventDefault();
                const id = eliminarBtn.dataset.id;
                eliminarInstalacion(id);
                return;
            }

            // Ver instalación
            const verBtn = e.target.closest('.ver-btn');
            if (verBtn) {
                e.preventDefault();
                const id = verBtn.dataset.id;
                verInstalacion(id);
                return;
            }

            // Cambiar estado
            const estadoBtn = e.target.closest('.estado-btn');
            if (estadoBtn) {
                e.preventDefault();
                const id = estadoBtn.dataset.id;
                const estado = estadoBtn.dataset.estado;
                cambiarEstadoInstalacion(id, estado);

                // Cerrar el dropdown
                const dropdown = estadoBtn.closest('.dropdown-menu');
                if (dropdown) {
                    dropdown.classList.remove('show');
                }
                // También cerrar el dropdown padre
                const dropdownToggle = dropdown?.previousElementSibling;
                if (dropdownToggle && dropdownToggle.classList.contains('dropdown-toggle')) {
                    dropdownToggle.setAttribute('aria-expanded', 'false');
                }
                return;
            }
        });
    }

    // Llama a esta función después de cargar la tabla
    initInstalacionesEventListeners();


    // Registrar nueva instalación
    // Registrar nueva instalación
    formInstalacion.addEventListener('submit', async function (e) {
        e.preventDefault();

        try {
            // Obtener productos utilizados
            const productosUtilizados = [];
            const productItems = productosInstalacion.querySelectorAll('.producto-item');

            productItems.forEach(item => {
                const productoId = item.querySelector('.select-producto').value;
                const cantidad = parseInt(item.querySelector('.cantidad-producto').value);
                const modelo = item.querySelector('.modelo-producto') ? item.querySelector('.modelo-producto').value : '';

                if (productoId && cantidad) {
                    productosUtilizados.push({
                        productoId: productoId,
                        cantidad: cantidad,
                        modelo: modelo
                    });
                }
            });

            // Obtener códigos de equipos si existen
            const codigosEquipos = [];
            const codigosItems = document.querySelectorAll('.codigo-item');
            codigosItems.forEach(item => {
                const tipo = item.querySelector('.tipo-codigo').value;
                const codigo = item.querySelector('.codigo-equipo').value;
                if (tipo && codigo) {
                    codigosEquipos.push({ tipo, codigo });
                }
            });

            // Obtener información del cable
            const metrosCable = parseFloat(document.getElementById('cableInstalacion').value);
            const tipoCable = document.getElementById('tipoCableInstalacion').value;

            // Buscar el cable en el inventario
            const cableSnapshot = await db.collection('inventario')
                .where('categoria', '==', 'cable')
                .where('tipo', '==', tipoCable)
                .get();

            if (!cableSnapshot.empty) {
                const cableDoc = cableSnapshot.docs[0];
                productosUtilizados.push({
                    productoId: cableDoc.id,
                    cantidad: metrosCable,
                    modelo: tipoCable
                });
            }

            const instalacion = {
                fecha: document.getElementById('fechaInstalacion').value,
                cliente: document.getElementById('clienteInstalacion').value,
                cedula: document.getElementById('cedulaInstalacion').value,
                direccion: document.getElementById('direccionInstalacion').value,
                telefono: document.getElementById('telefonoInstalacion').value,
                tipo: document.getElementById('tipoInstalacion').value,
                tecnico: document.getElementById('tecnicoInstalacion').value,
                productos: productosUtilizados,
                codigosEquipos: codigosEquipos,
                cable: metrosCable,
                tipoCable: tipoCable,
                observaciones: document.getElementById('observacionesInstalacion').value,
                estado: document.getElementById('estadoInstalacion').value,
                fechaRegistro: new Date()
            };

            // Primero verificar stock disponible
            const stockDisponible = await verificarStockDisponible(productosUtilizados);
            if (!stockDisponible) {
                mostrarNotificacion('No hay suficiente stock para algunos productos', 'error');
                return;
            }

            // Registrar instalación y actualizar inventario
            await db.collection('instalaciones').add(instalacion);
            await actualizarStockProductos(productosUtilizados);

            mostrarNotificacion('Instalación registrada correctamente', 'success');
            limpiarFormularioInstalacion();
            cargarInstalaciones();
            cargarInventario();

        } catch (error) {
            console.error('Error al registrar instalación:', error);
            mostrarNotificacion('Error al registrar instalación', 'error');
        }
    });



    function buscarInstalaciones(termino) {
        const tablaInstalaciones = document.getElementById('tablaInstalaciones');

        if (!termino) {
            cargarInstalaciones();
            return;
        }

        // Convertir término a minúsculas para búsqueda case-insensitive
        const terminoLower = termino.toLowerCase();

        // Obtener TODAS las instalaciones y filtrar en el cliente
        db.collection('instalaciones').orderBy('fechaRegistro', 'desc').get()
            .then((snapshot) => {
                let html = '';
                if (snapshot.empty) {
                    html = '<tr><td colspan="9">No se encontraron instalaciones</td></tr>';
                } else {
                    snapshot.forEach((doc) => {
                        const instalacion = doc.data();

                        // ✅ BÚSQUEDA EN MÚLTIPLES CAMPOS
                        const coincide =
                            // Búsqueda en campos principales
                            (instalacion.cliente && instalacion.cliente.toLowerCase().includes(terminoLower)) ||
                            (instalacion.cedula && instalacion.cedula.includes(termino)) ||
                            (instalacion.telefono && instalacion.telefono.includes(termino)) ||
                            (instalacion.direccion && instalacion.direccion.toLowerCase().includes(terminoLower)) ||
                            (instalacion.tecnico && instalacion.tecnico.toLowerCase().includes(terminoLower)) ||
                            (instalacion.tipo && instalacion.tipo.toLowerCase().includes(terminoLower)) ||

                            // Búsqueda en códigos de equipos
                            (instalacion.codigosEquipos && instalacion.codigosEquipos.some(codigo =>
                                codigo.codigo && codigo.codigo.includes(termino)
                            )) ||

                            // Búsqueda en productos
                            (instalacion.productos && instalacion.productos.some(producto =>
                                (producto.nombre && producto.nombre.toLowerCase().includes(terminoLower)) ||
                                (producto.modelo && producto.modelo.toLowerCase().includes(terminoLower))
                            ));

                        if (coincide) {
                            const estadoClass = obtenerClaseEstadoInstalacion(instalacion.estado);

                            html += `
                            <tr>
                                <td>${instalacion.fecha}</td>
                                <td>${instalacion.cliente}</td>
                                <td>${instalacion.cedula || 'N/A'}</td>
                                <td>${instalacion.tipo}</td>
                                <td>${instalacion.tecnico}</td>
                                <td>${instalacion.productos.length} productos</td>
                                <td>${instalacion.cable}m (${instalacion.tipoCable})</td>
                                <td><span class="badge badge-${estadoClass}">${instalacion.estado}</span></td>
                                <td>
                                    <div class="btn-group">
                                        <button class="btn btn-sm btn-info ver-btn" data-id="${doc.id}" title="Ver detalles">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger eliminar-btn" data-id="${doc.id}" title="Eliminar">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                        <button class="btn btn-sm btn-secondary dropdown-toggle" type="button" 
                                                data-bs-toggle="dropdown" aria-expanded="false">
                                            <i class="fas fa-cog"></i>
                                        </button>
                                        <div class="dropdown-menu">
                                            <h6 class="dropdown-header">Cambiar estado</h6>
                                            <a class="dropdown-item estado-btn" href="#" data-id="${doc.id}" data-estado="programada">
                                                <span class="badge badge-secondary">Programada</span>
                                            </a>
                                            <a class="dropdown-item estado-btn" href="#" data-id="${doc.id}" data-estado="en-proceso">
                                                <span class="badge badge-warning">En Proceso</span>
                                            </a>
                                            <a class="dropdown-item estado-btn" href="#" data-id="${doc.id}" data-estado="completada">
                                                <span class="badge badge-success">Completada</span>
                                            </a>
                                            <a class="dropdown-item estado-btn" href="#" data-id="${doc.id}" data-estado="cancelada">
                                                <span class="badge badge-danger">Cancelada</span>
                                            </a>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        `;
                        }
                    });

                    if (html === '') {
                        html = '<tr><td colspan="9">No se encontraron resultados</td></tr>';
                    }
                }
                if (tablaInstalaciones) {
                    tablaInstalaciones.querySelector('tbody').innerHTML = html;
                }
            });
    }

    function cargarProductosParaSelect() {
        // Cargar productos para todos los selects existentes
        const selects = document.querySelectorAll('.select-producto');
        selects.forEach(select => {
            llenarSelectProducto(select);
        });
    }

    function llenarSelectProducto(select, snapshot = null) {
        select.innerHTML = '<option value="">Seleccionar producto</option>';

        // Si no se proporciona snapshot, obtener los productos de la base de datos
        if (!snapshot) {
            db.collection('inventario').get().then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    const producto = doc.data();
                    if (producto.cantidad > 0) {
                        agregarOpcionProducto(select, doc.id, producto);
                    }
                });
            });
        } else {
            // Si se proporciona snapshot, usarlo directamente
            snapshot.forEach((doc) => {
                const producto = doc.data();
                if (producto.cantidad > 0) {
                    agregarOpcionProducto(select, doc.id, producto);
                }
            });
        }
    }

    // NUEVA FUNCIÓN PARA ACTUALIZAR TODOS LOS SELECTS
    function actualizarTodosLosSelectsProducto() {
        // Actualizar todos los selects de productos en el sistema
        const selects = document.querySelectorAll('.select-producto');
        selects.forEach(select => {
            llenarSelectProducto(select);
        });

        // También actualizar selects de modelo si existen
        const selectsModelo = document.querySelectorAll('.modelo-producto');
        selectsModelo.forEach(select => {
            llenarSelectProducto(select);
        });
    }

    // Función auxiliar para agregar opciones al select
    function agregarOpcionProducto(select, docId, producto) {
        const option = document.createElement('option');
        option.value = docId;

        let texto = producto.nombre;
        if (producto.categoria === 'cable') {
            texto += ` (${producto.cantidad}m disponible)`;
        } else {
            texto += ` (Disponible: ${producto.cantidad})`;
        }

        if (producto.modelo) {
            texto += ` - ${producto.modelo}`;
        }

        option.textContent = texto;
        select.appendChild(option);
    }

    // Función auxiliar para agregar opciones al select
    function agregarOpcionProducto(select, docId, producto) {
        const option = document.createElement('option');
        option.value = docId;

        let texto = producto.nombre;
        if (producto.categoria === 'cable') {
            texto += ` (${producto.cantidad}m disponible)`;
        } else {
            texto += ` (Disponible: ${producto.cantidad})`;
        }

        if (producto.modelo) {
            texto += ` - ${producto.modelo}`;
        }

        option.textContent = texto;
        select.appendChild(option);
    }

    async function verificarStockDisponible(productosUtilizados) {
        for (const item of productosUtilizados) {
            const doc = await db.collection('inventario').doc(item.productoId).get();
            if (doc.exists) {
                const producto = doc.data();
                if (producto.cantidad < item.cantidad) {
                    return false;
                }
            } else {
                return false; // Producto no encontrado
            }
        }
        return true;
    }

    async function actualizarStockProductos(productosUtilizados) {
        const batch = db.batch();

        for (const item of productosUtilizados) {
            const productoRef = db.collection('inventario').doc(item.productoId);
            const doc = await productoRef.get();

            if (doc.exists) {
                const nuevaCantidad = doc.data().cantidad - item.cantidad;
                batch.update(productoRef, { cantidad: nuevaCantidad });
            }
        }

        return batch.commit();
    }

    function obtenerClaseEstadoInstalacion(estado) {
        const estados = {
            'programada': 'secondary',
            'en-proceso': 'warning',
            'completada': 'success',
            'cancelada': 'danger'
        };
        return estados[estado] || 'secondary';
    }

    function limpiarFormularioProducto() {
        formProducto.reset();
        delete formProducto.dataset.editingId;
        document.getElementById('btnSubmitProducto').textContent = 'Registrar Producto';

        document.getElementById('tipoCableGroup').style.display = 'none';
        document.getElementById('tipoConectorGroup').style.display = 'none';
        document.getElementById('fibraFields').style.display = 'none';
        document.getElementById('inalambricoFields').style.display = 'none';
        document.getElementById('metrajeGroup').style.display = 'none';
        document.getElementById('formularioOtros').style.display = 'none';
        document.getElementById('formularioBasico').style.display = 'grid';
        document.getElementById('nombreProductoGroup').style.display = 'block';

        document.getElementById('metrajeProducto').removeAttribute('required');
        document.getElementById('modeloRJ45').removeAttribute('required');
        document.getElementById('cantidadRJ45').removeAttribute('required');
        document.getElementById('cantidadAPC').removeAttribute('required');
        document.getElementById('cantidadUPC').removeAttribute('required');
        document.getElementById('cantidadOtro').removeAttribute('required');
    }

    function limpiarFormularioInstalacion() {
        formInstalacion.reset();
        productosInstalacion.innerHTML = '';
        document.getElementById('codigosEquipos').innerHTML = '';
        document.getElementById('fechaInstalacion').value = new Date().toISOString().split('T')[0];
        document.getElementById('tipoCableInstalacion').value = 'utp';
    }

    function actualizarEquiposPorTipo() {
        const tipo = tipoInstalacionSelect.value;
        let html = '';

        if (tipo === 'inalambrico') {
            html = `
                <div class="equipo-option" data-tipo="router" data-nombre="Router">
                    <i class="fas fa-wifi"></i>
                    <span>Router</span>
                </div>
                <div class="equipo-option" data-tipo="antena" data-nombre="Antena">
                    <i class="fas fa-satellite"></i>
                    <span>Antena</span>
                </div>
                <div class="equipo-option" data-tipo="conector" data-nombre="Conector RJ45">
                    <i class="fas fa-plug"></i>
                    <span>Conector RJ45</span>
                </div>
            `;
        } else if (tipo === 'fibra') {
            html = `
                <div class="equipo-option" data-tipo="router" data-nombre="Router">
                    <i class="fas fa-wifi"></i>
                    <span>Router</span>
                </div>
                <div class="equipo-option" data-tipo="onu" data-nombre="ONU">
                    <i class="fas fa-server"></i>
                    <span>ONU</span>
                </div>
                <div class="equipo-option" data-tipo="onurouter" data-nombre="ONU Router">
                    <i class="fa-solid fa-house-signal"></i>
                    <span>ONU Router</span>
                </div>
                <div class="equipo-option" data-tipo="roseta" data-nombre="Roseta">
                    <i class="fas fa-network-wired"></i>
                    <span>Roseta</span>
                </div>
                <div class="equipo-option" data-tipo="pascor" data-nombre="Pascor">
                    <i class="fas fa-box"></i>
                    <span>Pascor</span>
                </div>
                      <!-- NUEVOS CONECTORES DE FIBRA -->
                <div class="equipo-option" data-tipo="conector-apc" data-nombre="Conector APC (Verde)">
                     <i class="fas fa-plug" style="color: green"></i>
                     <span>Conector APC (Verde)</span>
                </div>
                 <div class="equipo-option" data-tipo="conector-upc" data-nombre="Conector UPC (Azul)">
                     <i class="fas fa-plug" style="color: blue"></i>
                     <span>Conector UPC (Azul)</span>
                </div>

            `;
        }

        equipoSelector.innerHTML = html;

        document.querySelectorAll('.equipo-option').forEach(option => {
            option.addEventListener('click', function () {
                agregarEquipoInstalacion(
                    this.getAttribute('data-tipo'),
                    this.getAttribute('data-nombre')
                );
            });
        });
    }

    // FUNCIÓN NUEVA (AGREGAR):
    function agregarEquipoInstalacion(tipo, nombre) {
        // Para conectores de fibra, manejarlos de manera especial
        if (tipo === 'conector-apc' || tipo === 'conector-upc') {
            agregarConectorFibra(tipo, nombre);
            return;
        }

        db.collection('inventario').where('categoria', '==', tipo).get()
            .then((snapshot) => {
                if (!snapshot.empty) {
                    const productoId = snapshot.docs[0].id;
                    const producto = snapshot.docs[0].data();

                    const productoItem = document.createElement('div');
                    productoItem.className = 'producto-item';
                    productoItem.innerHTML = `
                    <input type="hidden" class="select-producto" value="${productoId}">
                    <span class="nombre-producto">${nombre}</span>
                    <select class="form-control modelo-producto">
                        <option value="">Seleccionar modelo</option>
                    </select>
                    <input type="number" class="form-control cantidad-producto" placeholder="Cantidad" min="1" required value="1">
                    <button type="button" class="btn btn-danger remove-producto">✕</button>
                `;

                    llenarSelectProducto(productoItem.querySelector('.modelo-producto'));

                    productoItem.querySelector('.remove-producto').addEventListener('click', function () {
                        productoItem.remove();
                    });

                    productosInstalacion.appendChild(productoItem);

                    if (tipo === 'onu' || tipo === 'onurouter') {
                        agregarCampoCodigo(tipo);
                    }
                }
            });
    }

    // Nueva función para agregar conectores de fibra
    function agregarConectorFibra(tipo, nombre) {
        const productoItem = document.createElement('div');
        productoItem.className = 'producto-item';

        // Buscar conectores de fibra en el inventario
        db.collection('inventario')
            .where('categoria', '==', 'conector')
            .where('detalles.tipo', '==', 'fibra')
            .get()
            .then((snapshot) => {
                if (!snapshot.empty) {
                    const productoId = snapshot.docs[0].id;

                    productoItem.innerHTML = `
                    <input type="hidden" class="select-producto" value="${productoId}">
                    <span class="nombre-producto">${nombre}</span>
                    <input type="hidden" class="modelo-producto" value="${tipo === 'conector-apc' ? 'APC' : 'UPC'}">
                    <input type="number" class="form-control cantidad-producto" placeholder="Cantidad" min="1" required value="1">
                    <button type="button" class="btn btn-danger remove-producto">✕</button>
                `;

                    productoItem.querySelector('.remove-producto').addEventListener('click', function () {
                        productoItem.remove();
                    });

                    productosInstalacion.appendChild(productoItem);
                } else {
                    mostrarNotificacion('No hay conectores de fibra en el inventario', 'error');
                }
            });
    }

    function agregarCampoCodigo(tipo) {
        const codigoItem = document.createElement('div');
        codigoItem.className = 'codigo-item form-group';
        codigoItem.innerHTML = `
            <label>Código del ${tipo === 'onu' ? 'ONU' : 'ONU Router'}</label>
            <input type="hidden" class="tipo-codigo" value="${tipo}">
            <input type="text" class="form-control codigo-equipo" placeholder="Ej: F5C49" required>
        `;
        document.getElementById('codigosEquipos').appendChild(codigoItem);
    }

    function agregarProductoManual() {
        const productoItem = document.createElement('div');
        productoItem.className = 'producto-item';
        productoItem.innerHTML = `
            <select class="form-control select-producto" required>
                <option value="">Seleccionar producto</option>
            </select>
            <input type="number" class="form-control cantidad-producto" placeholder="Cantidad" min="1" required>
            <button type="button" class="btn btn-danger remove-producto">✕</button>
        `;

        llenarSelectProducto(productoItem.querySelector('.select-producto'));

        productoItem.querySelector('.remove-producto').addEventListener('click', function () {
            productoItem.remove();
        });

        productosInstalacion.appendChild(productoItem);
    }

    function agregarEquipoPersonalizado() {
        const nombre = prompt('Ingrese el nombre del nuevo equipo:');
        if (nombre) {
            const icono = prompt('Ingrese el nombre del icono (FontAwesome):', 'fas fa-cube');
            const tipo = 'personalizado';

            const nuevoEquipo = document.createElement('div');
            nuevoEquipo.className = 'equipo-option';
            nuevoEquipo.setAttribute('data-tipo', tipo);
            nuevoEquipo.setAttribute('data-nombre', nombre);
            nuevoEquipo.innerHTML = `
                <i class="${icono}"></i>
                <span>${nombre}</span>
            `;

            nuevoEquipo.addEventListener('click', function () {
                agregarEquipoInstalacion(tipo, nombre);
            });

            equipoSelector.appendChild(nuevoEquipo);
        }
    }

    // Event listeners
    btnLimpiarProducto.addEventListener('click', limpiarFormularioProducto);
    btnLimpiarInstalacion.addEventListener('click', limpiarFormularioInstalacion);
    if (filtroCategoria) {
        filtroCategoria.addEventListener('change', cargarInventario);
    }
    if (filtroEstadoInstalacion) {
        filtroEstadoInstalacion.addEventListener('change', cargarInstalaciones);
    }
    if (filtroTipoInstalacion) {
        filtroTipoInstalacion.addEventListener('change', cargarInstalaciones);
    }

    // Inicializar
    cargarInventario();
    cargarInstalaciones();



});


// Función para cambiar estado de instalación (FUERA del DOMContentLoaded)
function cambiarEstadoInstalacion(id, nuevoEstado) {
    db.collection('instalaciones').doc(id).update({
        estado: nuevoEstado,
        fechaActualizacion: new Date()
    })
        .then(() => {
            mostrarNotificacion(`Estado cambiado a ${nuevoEstado} correctamente`, 'success');
            cargarInstalaciones(); // Recargar la tabla
        })
        .catch((error) => {
            console.error('Error al cambiar estado:', error);
            mostrarNotificacion('Error al cambiar el estado', 'error');
        });
}

document.addEventListener('DOMContentLoaded', function () {
    // ... (todo tu código existente dentro del DOMContentLoaded)
});

// Hacer funciones globales
window.cargarInstalaciones = cargarInstalaciones;
window.eliminarInstalacion = eliminarInstalacion;
window.cambiarEstadoInstalacion = cambiarEstadoInstalacion;
window.verInstalacion = verInstalacion;
