// reportes.js - Versión corregida y mejorada
document.addEventListener('DOMContentLoaded', function () {
    const db = firebase.firestore();
    const formFiltroReporte = document.getElementById('formFiltroReporte');
    const tablaReportes = document.getElementById('tablaReportes');
    const encabezadoReportes = document.getElementById('encabezadoReportes');
    const resumenEstadisticas = document.getElementById('resumenEstadisticas');
    const paginacionReportes = document.getElementById('paginacionReportes');
    const reporteTipo = document.getElementById('reporteTipo');
    const reporteSubtipo = document.getElementById('reporteSubtipo');
    const reporteFechaDesde = document.getElementById('reporteFechaDesde');
    const reporteFechaHasta = document.getElementById('reporteFechaHasta');
    const reporteEstado = document.getElementById('reporteEstado');
    const reporteOrden = document.getElementById('reporteOrden');
    const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');
    const exportarPDF = document.getElementById('exportarPDF');
    const exportarExcel = document.getElementById('exportarExcel');
    const verGraficos = document.getElementById('verGraficos');

    let datosReporte = [];
    let paginaActual = 1;
    const resultadosPorPagina = 10;

    // Inicializar fecha por defecto (últimos 30 días)
    const fechaHasta = new Date();
    const fechaDesde = new Date();
    fechaDesde.setDate(fechaDesde.getDate() - 30);

    reporteFechaDesde.value = fechaDesde.toISOString().split('T')[0];
    reporteFechaHasta.value = fechaHasta.toISOString().split('T')[0];

    // Configurar opciones de subtipo según el tipo seleccionado
    reporteTipo.addEventListener('change', function () {
        const tipo = this.value;
        let opciones = '<option value="todos">Todos</option>';

        switch (tipo) {
            case 'fallas-clientes':
                opciones += `
                    <option value="queja">Quejas</option>
                    <option value="tecnico">Problemas Técnicos</option>
                    <option value="otro">Otros</option>
                `;
                break;
            case 'fallas-generales':
                opciones += `
                    <option value="vehiculo">Vehículo/Auto</option>
                    <option value="equipo">Equipo de Trabajo</option>
                    <option value="infraestructura">Infraestructura</option>
                    <option value="sistema">Sistema/Software</option>
                    <option value="comunicacion">Comunicación</option>
                    <option value="otro">Otro</option>
                `;
                break;
            case 'combustible':
                opciones += `
                    <option value="entrada">Entradas</option>
                    <option value="salida">Salidas</option>
                `;
                break;
            case 'estadisticas':
                opciones += `
                    <option value="resumen">Resumen General</option>
                    <option value="estados">Por Estados</option>
                    <option value="tipos">Por Tipos</option>
                    <option value="prioridades">Por Prioridades</option>
                `;
                break;
            default:
                opciones = '<option value="todos">Todos</option>';
        }

        reporteSubtipo.innerHTML = opciones;
    });

    // Generar reporte
    formFiltroReporte.addEventListener('submit', function (e) {
        e.preventDefault();
        paginaActual = 1;
        generarReporte();
    });

    // Limpiar filtros
    btnLimpiarFiltros.addEventListener('click', function () {
        formFiltroReporte.reset();

        // Restablecer fechas por defecto
        const fechaHasta = new Date();
        const fechaDesde = new Date();
        fechaDesde.setDate(fechaDesde.getDate() - 30);

        reporteFechaDesde.value = fechaDesde.toISOString().split('T')[0];
        reporteFechaHasta.value = fechaHasta.toISOString().split('T')[0];

        // Limpiar resultados
        encabezadoReportes.innerHTML = '';
        tablaReportes.querySelector('tbody').innerHTML = '';
        resumenEstadisticas.style.display = 'none';
        resumenEstadisticas.innerHTML = '';
        paginacionReportes.style.display = 'none';
    });

    // Exportar a PDF
    exportarPDF.addEventListener('click', function () {
        if (datosReporte.length === 0) {
            mostrarNotificacion('No hay datos para exportar', 'warning');
            return;
        }
        exportarAPDF();
    });

    // Exportar a Excel
    exportarExcel.addEventListener('click', function () {
        if (datosReporte.length === 0) {
            mostrarNotificacion('No hay datos para exportar', 'warning');
            return;
        }
        exportarAExcel();
    });

    // Ver gráficos
    verGraficos.addEventListener('click', function () {
        if (datosReporte.length === 0) {
            mostrarNotificacion('No hay datos para mostrar gráficos', 'warning');
            return;
        }
        mostrarGraficos();
    });

    // Función principal para generar reportes
    async function generarReporte() {
        const tipo = reporteTipo.value;
        const subtipo = reporteSubtipo.value;
        const fechaDesde = reporteFechaDesde.value;
        const fechaHasta = reporteFechaHasta.value;
        const estado = reporteEstado.value;
        const orden = reporteOrden.value;

        try {
            mostrarNotificacion('Generando reporte...', 'info');

            let resultados = [];

            if (tipo === 'todos') {
                // Obtener datos de todas las colecciones
                const [
                    fallasClientes,
                    fallasGenerales,
                    fallasNodos,
                    combustible
                ] = await Promise.all([
                    obtenerFallasClientes(fechaDesde, fechaHasta, estado, subtipo),
                    obtenerFallasGenerales(fechaDesde, fechaHasta, estado, subtipo),
                    obtenerFallasNodos(fechaDesde, fechaHasta, estado, subtipo),
                    obtenerCombustible(fechaDesde, fechaHasta, subtipo)
                ]);

                resultados = [
                    ...fallasClientes.map(item => ({ ...item, tipo: 'Falla Cliente' })),
                    ...fallasGenerales.map(item => ({ ...item, tipo: 'Falla General' })),
                    ...fallasNodos.map(item => ({ ...item, tipo: 'Falla Nodo' })),
                    ...combustible.map(item => ({ ...item, tipo: 'Combustible' }))
                ];
            } else {
                // Obtener datos específicos según el tipo
                switch (tipo) {
                    case 'fallas-clientes':
                        resultados = await obtenerFallasClientes(fechaDesde, fechaHasta, estado, subtipo);
                        break;
                    case 'fallas-generales':
                        resultados = await obtenerFallasGenerales(fechaDesde, fechaHasta, estado, subtipo);
                        break;
                    case 'fallas-nodos':
                        resultados = await obtenerFallasNodos(fechaDesde, fechaHasta, estado, subtipo);
                        break;
                    case 'combustible':
                        resultados = await obtenerCombustible(fechaDesde, fechaHasta, subtipo);
                        break;
                    case 'estadisticas':
                        await generarEstadisticas(fechaDesde, fechaHasta, subtipo);
                        return;
                }
            }

            // Ordenar resultados
            resultados = ordenarResultados(resultados, orden);

            datosReporte = resultados;
            mostrarResultados(resultados);

        } catch (error) {
            console.error('Error al generar reporte:', error);
            mostrarNotificacion('Error al generar el reporte', 'error');
        }
    }

    // Funciones para obtener datos de cada colección
    async function obtenerFallasClientes(fechaDesde, fechaHasta, estado, subtipo) {
        let query = db.collection('fallas');

        // Aplicar filtros - CORREGIDO: usar el campo correcto de fecha
        if (fechaDesde && fechaHasta) {
            const desde = new Date(fechaDesde);
            const hasta = new Date(fechaHasta);
            hasta.setHours(23, 59, 59, 999); // Incluir hasta el último milisegundo del día

            // Usar 'fecha' que es el campo que existe en los documentos
            query = query.where('fecha', '>=', desde)
                        .where('fecha', '<=', hasta);
        }

        if (estado !== 'todos') {
            query = query.where('estado', '==', estado);
        }

        if (subtipo !== 'todos') {
            query = query.where('tipo', '==', subtipo);
        }

        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Mapear los campos al nombre que espera el sistema
            nombreCliente: doc.data().nombre,
            ubicacionCliente: doc.data().ubicacion,
            descripcionFalla: doc.data().descripcion,
            tipo: doc.data().tipo,
            estado: doc.data().estado,
            fechaRegistro: doc.data().fecha  // Usar el campo 'fecha' que existe
        }));
    }

    async function obtenerFallasGenerales(fechaDesde, fechaHasta, estado, subtipo) {
        let query = db.collection('fallas_generales');

        // Aplicar filtros - CORREGIDO: incluir todo el día
        if (fechaDesde && fechaHasta) {
            const desde = new Date(fechaDesde);
            const hasta = new Date(fechaHasta);
            hasta.setHours(23, 59, 59, 999);

            query = query.where('fechaRegistro', '>=', desde)
                        .where('fechaRegistro', '<=', hasta);
        }

        if (estado !== 'todos') {
            query = query.where('estado', '==', estado);
        }

        if (subtipo !== 'todos') {
            query = query.where('tipo', '==', subtipo);
        }

        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async function obtenerFallasNodos(fechaDesde, fechaHasta, estado, subtipo) {
        let query = db.collection('fallas_nodos');

        // Aplicar filtros - CORREGIDO: incluir todo el día
        if (fechaDesde && fechaHasta) {
            const desde = new Date(fechaDesde);
            const hasta = new Date(fechaHasta);
            hasta.setHours(23, 59, 59, 999);

            query = query.where('fechaRegistro', '>=', desde)
                        .where('fechaRegistro', '<=', hasta);
        }

        if (estado !== 'todos') {
            query = query.where('estado', '==', estado);
        }

        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async function obtenerCombustible(fechaDesde, fechaHasta, subtipo) {
        let query = db.collection('combustible');

        // Aplicar filtros - CORREGIDO: incluir todo el día
        if (fechaDesde && fechaHasta) {
            const desde = new Date(fechaDesde);
            const hasta = new Date(fechaHasta);
            hasta.setHours(23, 59, 59, 999);

            query = query.where('fecha', '>=', desde)
                        .where('fecha', '<=', hasta);
        }

        if (subtipo !== 'todos') {
            query = query.where('tipo', '==', subtipo);
        }

        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // Función para ordenar resultados
    function ordenarResultados(resultados, orden) {
        return resultados.sort((a, b) => {
            // Obtener fechas para comparación
            const fechaA = a.fechaRegistro || a.fecha;
            const fechaB = b.fechaRegistro || b.fecha;
            
            // Convertir a objetos Date si es necesario
            const dateA = fechaA && fechaA.toDate ? fechaA.toDate() : new Date(fechaA);
            const dateB = fechaB && fechaB.toDate ? fechaB.toDate() : new Date(fechaB);

            switch (orden) {
                case 'fecha-asc':
                    return dateA - dateB;
                case 'estado':
                    return (a.estado || '').localeCompare(b.estado || '');
                case 'prioridad':
                    return (a.prioridad || '').localeCompare(b.prioridad || '');
                default: // fecha-desc
                    return dateB - dateA;
            }
        });
    }

    // Función para mostrar resultados en la tabla
    function mostrarResultados(resultados) {
        if (resultados.length === 0) {
            encabezadoReportes.innerHTML = '<th colspan="10" class="text-center">No se encontraron resultados</th>';
            tablaReportes.querySelector('tbody').innerHTML = '';
            resumenEstadisticas.style.display = 'none';
            resumenEstadisticas.innerHTML = '';
            paginacionReportes.style.display = 'none';
            mostrarNotificacion('No se encontraron resultados para los filtros aplicados', 'info');
            return;
        }

        // Configurar encabezados según el tipo de reporte
        const tipoReporte = reporteTipo.value;
        let encabezados = '';

        if (tipoReporte === 'todos') {
            encabezados = `
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Prioridad</th>
                <th>Detalles</th>
            `;
        } else {
            switch (tipoReporte) {
                case 'fallas-clientes':
                    encabezados = `
                        <th>Cliente</th>
                        <th>Ubicación</th>
                        <th>Tipo</th>
                        <th>Falla</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                    `;
                    break;
                case 'fallas-generales':
                    encabezados = `
                        <th>Título</th>
                        <th>Tipo</th>
                        <th>Descripción</th>
                        <th>Persona Notificada</th>
                        <th>Prioridad</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                    `;
                    break;
                case 'fallas-nodos':
                    encabezados = `
                        <th>Nodo</th>
                        <th>Ubicación</th>
                        <th>Descripción</th>
                        <th>Técnico</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                    `;
                    break;
                case 'combustible':
                    encabezados = `
                        <th>Tipo</th>
                        <th>Cantidad (L)</th>
                        <th>Fecha</th>
                        <th>Notas</th>
                        <th>Acciones</th>
                    `;
                    break;
            }
        }

        encabezadoReportes.innerHTML = encabezados;

        // Paginación
        const totalPaginas = Math.ceil(resultados.length / resultadosPorPagina);
        mostrarPaginacion(totalPaginas);

        // Mostrar datos de la página actual
        const inicio = (paginaActual - 1) * resultadosPorPagina;
        const fin = inicio + resultadosPorPagina;
        const resultadosPagina = resultados.slice(inicio, fin);

        let html = '';
        resultadosPagina.forEach(item => {
            if (tipoReporte === 'todos') {
                html += generarFilaTodos(item);
            } else {
                switch (tipoReporte) {
                    case 'fallas-clientes':
                        html += generarFilaFallaCliente(item);
                        break;
                    case 'fallas-generales':
                        html += generarFilaFallaGeneral(item);
                        break;
                    case 'fallas-nodos':
                        html += generarFilaFallaNodo(item);
                        break;
                    case 'combustible':
                        html += generarFilaCombustible(item);
                        break;
                }
            }
        });

        tablaReportes.querySelector('tbody').innerHTML = html;

        // Mostrar resumen estadístico (solo para tipos de fallas)
        if (tipoReporte !== 'combustible' && tipoReporte !== 'todos') {
            mostrarResumenEstadisticas(resultados);
        } else {
            resumenEstadisticas.style.display = 'none';
            resumenEstadisticas.innerHTML = '';
        }

        mostrarNotificacion(`Reporte generado con ${resultados.length} registros`, 'success');
    }

    // Función para mostrar resumen estadístico
    function mostrarResumenEstadisticas(resultados) {
        const tipoReporte = reporteTipo.value;
        resumenEstadisticas.style.display = 'grid';

        if (tipoReporte === 'fallas-clientes' || tipoReporte === 'fallas-generales' || tipoReporte === 'fallas-nodos') {
            // Contar por estado
            const conteoEstados = {};
            resultados.forEach(item => {
                const estado = item.estado || 'sin-estado';
                conteoEstados[estado] = (conteoEstados[estado] || 0) + 1;
            });

            let html = '';
            for (const [estado, cantidad] of Object.entries(conteoEstados)) {
                const porcentaje = ((cantidad / resultados.length) * 100).toFixed(1);
                html += `
                    <div class="stat-card">
                        <div class="stat-value">${cantidad}</div>
                        <div class="stat-title">${estado.charAt(0).toUpperCase() + estado.slice(1)} (${porcentaje}%)</div>
                    </div>
                `;
            }

            // Agregar total
            html += `
                <div class="stat-card" style="border-left-color: #007bff;">
                    <div class="stat-value">${resultados.length}</div>
                    <div class="stat-title">Total de registros</div>
                </div>
            `;

            resumenEstadisticas.innerHTML = html;
        }
    }

    // Funciones para generar filas de cada tipo - ACTUALIZADAS para usar formatearFecha
    function generarFilaTodos(item) {
        const fecha = formatearFecha(item.fechaRegistro || item.fecha);
        
        let descripcion = item.descripcion || item.falla || item.titulo || item.notas || 'N/A';
        if (descripcion.length > 50) descripcion = descripcion.substring(0, 50) + '...';

        const estado = item.estado ? `<span class="badge badge-${obtenerClaseEstado(item.estado)}">${item.estado}</span>` : 'N/A';
        const prioridad = item.prioridad ? `<span class="badge badge-${obtenerClasePrioridad(item.prioridad)}">${item.prioridad}</span>` : 'N/A';

        return `
            <tr>
                <td>${item.tipo}</td>
                <td>${fecha}</td>
                <td>${descripcion}</td>
                <td>${estado}</td>
                <td>${prioridad}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="verDetallesReporte('${item.id}', '${item.tipo}')">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </td>
            </tr>
        `;
    }

    function generarFilaFallaCliente(item) {
        const fecha = formatearFecha(item.fechaRegistro || item.fecha);
        const estado = `<span class="badge badge-${obtenerClaseEstado(item.estado)}">${item.estado}</span>`;

        return `
            <tr>
                <td>${item.nombreCliente || 'N/A'}</td>
                <td>${item.ubicacionCliente || 'N/A'}</td>
                <td>${item.tipo || 'N/A'}</td>
                <td>${item.descripcionFalla || 'N/A'}</td>
                <td>${estado}</td>
                <td>${fecha}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="verDetallesReporte('${item.id}', 'Falla Cliente')">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </td>
            </tr>
        `;
    }

    function generarFilaFallaGeneral(item) {
        const fecha = formatearFecha(item.fechaRegistro);
        const estado = `<span class="badge badge-${obtenerClaseEstado(item.estado)}">${item.estado}</span>`;
        const prioridad = `<span class="badge badge-${obtenerClasePrioridad(item.prioridad)}">${item.prioridad}</span>`;

        return `
            <tr>
                <td>${item.titulo || 'N/A'}</td>
                <td>${item.tipo || 'N/A'}</td>
                <td>${item.descripcion || 'N/A'}</td>
                <td>${item.personaNotificada || 'N/A'}</td>
                <td>${prioridad}</td>
                <td>${estado}</td>
                <td>${fecha}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="verDetallesReporte('${item.id}', 'Falla General')">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </td>
            </tr>
        `;
    }

    function generarFilaFallaNodo(item) {
        const fecha = formatearFecha(item.fechaRegistro);
        const estado = `<span class="badge badge-${obtenerClaseEstado(item.estado)}">${item.estado}</span>`;

        return `
            <tr>
                <td>${item.nodo || 'N/A'}</td>
                <td>${item.ubicacion || 'N/A'}</td>
                <td>${item.falla || 'N/A'}</td>
                <td>${item.tecnico || 'N/A'}</td>
                <td>${estado}</td>
                <td>${fecha}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="verDetallesReporte('${item.id}', 'Falla Nodo')">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </td>
            </tr>
        `;
    }

    function generarFilaCombustible(item) {
        const fechaLegible = formatearFecha(item.fecha);
        const tipoClass = item.tipo === 'entrada' ? 'success' : 'danger';
        const tipoText = item.tipo === 'entrada' ? 'Entrada' : 'Salida';
        
        return `
            <tr>
                <td><span class="badge badge-${tipoClass}">${tipoText}</span></td>
                <td>${item.cantidad || 'N/A'} L</td>
                <td>${fechaLegible}</td>
                <td>${item.notas || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="verDetallesReporte('${item.id}', 'Combustible')">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </td>
            </tr>
        `;
    }

    // Función para mostrar paginación
    function mostrarPaginacion(totalPaginas) {
        if (totalPaginas <= 1) {
            paginacionReportes.style.display = 'none';
            return;
        }

        paginacionReportes.style.display = 'block';
        let html = `
            <nav>
                <ul class="pagination">
                    <li class="page-item ${paginaActual === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="cambiarPagina(${paginaActual - 1})">Anterior</a>
                    </li>
        `;

        for (let i = 1; i <= totalPaginas; i++) {
            html += `
                <li class="page-item ${paginaActual === i ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="cambiarPagina(${i})">${i}</a>
                </li>
            `;
        }

        html += `
                    <li class="page-item ${paginaActual === totalPaginas ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="cambiarPagina(${paginaActual + 1})">Siguiente</a>
                    </li>
                </ul>
            </nav>
        `;

        paginacionReportes.innerHTML = html;
    }

    // Función para cambiar de página
    window.cambiarPagina = function (nuevaPagina) {
        paginaActual = nuevaPagina;
        mostrarResultados(datosReporte);
        window.scrollTo(0, document.getElementById('tablaReportes').offsetTop);
    };

    // Función para ver detalles (mejorada)
    window.verDetallesReporte = async function (id, tipo) {
        try {
            let coleccion = '';
            let titulo = '';

            switch (tipo) {
                case 'Falla Cliente':
                    coleccion = 'fallas';
                    titulo = 'Falla de Cliente';
                    break;
                case 'Falla General':
                    coleccion = 'fallas_generales';
                    titulo = 'Falla General';
                    break;
                case 'Falla Nodo':
                    coleccion = 'fallas_nodos';
                    titulo = 'Falla de Nodo';
                    break;
                case 'Combustible':
                    coleccion = 'combustible';
                    titulo = 'Movimiento de Combustible';
                    break;
                default:
                    return;
            }

            // Obtener datos completos
            const docSnapshot = await db.collection(coleccion).doc(id).get();
            if (!docSnapshot.exists) {
                mostrarNotificacion('Registro no encontrado', 'error');
                return;
            }

            const datos = docSnapshot.data();

            // Mapear campos para Falla Cliente (igual que en obtenerFallasClientes)
            if (tipo === 'Falla Cliente') {
                datos.nombreCliente = datos.nombre;
                datos.ubicacionCliente = datos.ubicacion;
                datos.descripcionFalla = datos.descripcion;
                datos.fechaRegistro = datos.fecha;
            }

            let detalles = `<h4>Detalles de ${titulo}</h4>`;

            // Mostrar diferentes campos según el tipo
            if (tipo === 'Falla Cliente') {
                detalles += `
                    <div class="detalle-item">
                        <strong>Cliente:</strong> ${datos.nombreCliente || datos.nombre || 'N/A'}
                    </div>
                    <div class="detalle-item">
                        <strong>Ubicación:</strong> ${datos.ubicacionCliente || datos.ubicacion || 'N/A'}
                    </div>
                    <div class="detalle-item">
                        <strong>Tipo:</strong> ${datos.tipo || 'N/A'}
                    </div>
                    <div class="detalle-item">
                        <strong>Falla:</strong> ${datos.descripcionFalla || datos.descripcion || 'N/A'}
                    </div>
                    <div class="detalle-item">
                        <strong>Estado:</strong> ${datos.estado || 'N/A'}
                    </div>
                    <div class="detalle-item">
                        <strong>Fecha Registro:</strong> ${formatearFecha(datos.fechaRegistro || datos.fecha)}
                    </div>
                `;
            }
            else if (tipo === 'Falla General') {
                detalles += `
                    <div class="detalle-item">
                        <strong>Fecha/Hora:</strong> ${datos.fecha || 'N/A'} ${datos.hora || ''}
                    </div>
                    <div class="detalle-item">
                        <strong>Tipo:</strong> ${datos.tipo || 'N/A'}
                    </div>
                    <div class="detalle-item">
                        <strong>Prioridad:</strong> ${datos.prioridad || 'N/A'}
                    </div>
                    <div class="detalle-item">
                        <strong>Título:</strong> ${datos.titulo || 'N/A'}
                    </div>
                    <div class="detalle-item">
                        <strong>Descripción:</strong> ${datos.descripcion || 'N/A'}
                    </div>
                    <div class="detalle-item">
                        <strong>Persona Notificada:</strong> ${datos.personaNotificada || 'N/A'}
                    </div>
                    <div class="detalle-item">
                        <strong>Medio de Notificación:</strong> ${datos.medioNotificacion || 'N/A'}
                    </div>
                    <div class="detalle-item">
                        <strong>Acciones Tomadas:</strong> ${datos.accionesTomadas || 'N/A'}
                    </div>
                    <div class="detalle-item">
                        <strong>Solución Aplicada:</strong> ${datos.solucionAplicada || 'N/A'}
                    </div>
                    <div class="detalle-item">
                        <strong>Estado:</strong> ${datos.estado || 'N/A'}
                    </div>
                    <div class="detalle-item">
                        <strong>Fecha Solución:</strong> ${datos.fechaSolucion || 'N/A'}
                    </div>
                    <div class="detalle-item">
                        <strong>Observaciones:</strong> ${datos.observaciones || 'N/A'}
                    </div>
                    <div class="detalle-item">
                        <strong>Fecha Registro:</strong> ${formatearFecha(datos.fechaRegistro)}
                    </div>
                `;
            }
            else if (tipo === 'Falla Nodo') {
                detalles += `
                    <div class="detalle-item">
                        <strong>Nodo:</strong> ${datos.nodo || 'N/A'}
                    </div>
                    <div class="detalle-item">
                        <strong>Ubicación:</strong> ${datos.ubicacion || 'N/A'}
                    </div>
                    <div class="detalle-item">
                        <strong>Fecha/Hora:</strong> ${datos.fecha || 'N/A'} ${datos.hora || ''}
                    </div>
                    <div class="detalle-item">
                        <strong>Falla:</strong> ${datos.falla || 'N/A'}
                    </div>
                    <div class="detalle-item">
                        <strong>Técnico Asignado:</strong> ${datos.tecnico || 'N/A'}
                    </div>
                    <div class="detalle-item">
                        <strong>Estado:</strong> ${datos.estado || 'N/A'}
                    </div>
                    <div class="detalle-item">
                        <strong>Observaciones:</strong> ${datos.observaciones || 'N/A'}
                    </div>
                    <div class="detalle-item">
                        <strong>Fecha Registro:</strong> ${formatearFecha(datos.fechaRegistro)}
                    </div>
                    <div class="detalle-item">
                        <strong>Fecha Actualización:</strong> ${formatearFecha(datos.fechaActualizacion)}
                    </div>
                `;

                // Mostrar productos si existen
                if (datos.productos && datos.productos.length > 0) {
                    detalles += `
                        <div class="detalle-item">
                            <strong>Productos Necesarios:</strong>
                            <table class="table-productos">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Cantidad</th>
                                    </tr>
                                </thead>
                                <tbody>
                    `;

                    datos.productos.forEach(producto => {
                        detalles += `
                            <tr>
                                <td>${producto.nombre || 'N/A'}</td>
                                <td>${producto.cantidad || 'N/A'}</td>
                            </tr>
                        `;
                    });

                    detalles += `
                                </tbody>
                            </table>
                        </div>
                    `;
                } else {
                    detalles += `
                        <div class="detalle-item">
                            <strong>Productos Necesarios:</strong> No se especificaron productos
                        </div>
                    `;
                }
            }
            else if (tipo === 'Combustible') {
                detalles += `
                    <div class="detalle-item">
                        <strong>Tipo:</strong> ${datos.tipo || 'N/A'}
                    </div>
                    <div class="detalle-item">
                        <strong>Cantidad:</strong> ${datos.cantidad || 'N/A'} L
                    </div>
                    <div class="detalle-item">
                        <strong>Fecha:</strong> ${formatearFecha(datos.fecha)}
                    </div>
                    <div class="detalle-item">
                        <strong>Notas:</strong> ${datos.notas || 'N/A'}
                    </div>
                    <div class="detalle-item">
                        <strong>Fecha Registro:</strong> ${formatearFecha(datos.fechaRegistro)}
                    </div>
                `;
            }

            // Usar el sistema de modal
            if (typeof mostrarModal === 'function') {
                mostrarModal(`Detalles de ${titulo}`, detalles);
            } else {
                // Fallback
                const textoPlano = detalles.replace(/<[^>]*>/g, '');
                alert(textoPlano);
            }

        } catch (error) {
            console.error('Error al cargar detalles:', error);
            mostrarNotificacion('Error al cargar detalles', 'error');
        }
    };

    // Funciones de exportación
    function exportarAPDF() {
        mostrarNotificacion('Función de exportación PDF en desarrollo', 'info');
    }

    function exportarAExcel() {
        mostrarNotificacion('Función de exportación Excel en desarrollo', 'info');
    }

    function mostrarGraficos() {
        mostrarNotificacion('Función de gráficos en desarrollo', 'info');
    }

    // Funciones auxiliares
    function formatearFecha(fechaFirebase) {
        if (!fechaFirebase) return 'N/A';
        
        try {
            // Si es una marca de tiempo de Firebase (Timestamp)
            if (fechaFirebase.toDate) {
                return fechaFirebase.toDate().toLocaleDateString('es-ES');
            }
            // Si es un objeto Timestamp con seconds
            else if (fechaFirebase.seconds) {
                return new Date(fechaFirebase.seconds * 1000).toLocaleDateString('es-ES');
            }
            // Si ya es un string (formato YYYY-MM-DD)
            else if (typeof fechaFirebase === 'string') {
                // Intentar convertir string a fecha
                const fecha = new Date(fechaFirebase);
                if (!isNaN(fecha.getTime())) {
                    return fecha.toLocaleDateString('es-ES');
                }
                return fechaFirebase; // Devolver el string original si no se puede convertir
            }
            // Si es un objeto Date
            else if (fechaFirebase instanceof Date) {
                return fechaFirebase.toLocaleDateString('es-ES');
            }
        } catch (error) {
            console.error('Error al formatear fecha:', error, fechaFirebase);
        }
        
        return 'N/A';
    }

    function obtenerClaseEstado(estado) {
        const estados = {
            'pendiente': 'warning',
            'en-proceso': 'info',
            'resuelto': 'success',
            'resuelta': 'success',
            'cerrada': 'secondary',
            'reportada': 'secondary'
        };
        return estados[estado] || 'secondary';
    }

    function obtenerClasePrioridad(prioridad) {
        const prioridades = {
            'baja': 'secondary',
            'media': 'info',
            'alta': 'warning',
            'critica': 'danger'
        };
        return prioridades[prioridad] || 'secondary';
    }
});