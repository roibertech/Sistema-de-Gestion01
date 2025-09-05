// falla-general.js - Versión corregida
document.addEventListener('DOMContentLoaded', function() {
    const db = firebase.firestore();
    const formFallaGeneral = document.getElementById('formFallaGeneral');
    const tablaFallasGenerales = document.getElementById('tablaFallasGenerales');
    const filtroEstadoFallaGeneral = document.getElementById('filtroEstadoFallaGeneral');
    const filtroTipoFallaGeneral = document.getElementById('filtroTipoFallaGeneral');
    const filtroPrioridadFallaGeneral = document.getElementById('filtroPrioridadFallaGeneral');
    const btnLimpiarFallaGeneral = document.getElementById('btnLimpiarFallaGeneral');
    const submitButton = formFallaGeneral.querySelector('button[type="submit"]');
    
    let editandoId = null;

    // Cargar fallas generales
    function cargarFallasGenerales(filtroEstado = 'todos', filtroTipo = 'todos', filtroPrioridad = 'todos') {
        let query = db.collection('fallas_generales').orderBy('fechaRegistro', 'desc');
        
        tablaFallasGenerales.querySelector('tbody').innerHTML = '<tr><td colspan="7">Cargando...</td></tr>';
        
        query.get().then((querySnapshot) => {
            let html = '';
            if (querySnapshot.empty) {
                html = '<tr><td colspan="7">No hay fallas generales registradas</td></tr>';
            } else {
                querySnapshot.forEach((doc) => {
                    const falla = doc.data();
                    const fechaHora = `${falla.fecha} ${falla.hora}`;
                    
                    // Aplicar filtros
                    if ((filtroEstado === 'todos' || falla.estado === filtroEstado) && 
                        (filtroTipo === 'todos' || falla.tipo === filtroTipo) &&
                        (filtroPrioridad === 'todos' || falla.prioridad === filtroPrioridad)) {
                        
                        // Determinar clase de estado
                        let estadoClass = '';
                        if (falla.estado === 'reportada') estadoClass = 'badge-secondary';
                        if (falla.estado === 'en-proceso') estadoClass = 'badge-info';
                        if (falla.estado === 'resuelta') estadoClass = 'badge-warning';
                        if (falla.estado === 'cerrada') estadoClass = 'badge-success';
                        
                        // Determinar clase de prioridad
                        let prioridadClass = '';
                        if (falla.prioridad === 'baja') prioridadClass = 'badge-secondary';
                        if (falla.prioridad === 'media') prioridadClass = 'badge-info';
                        if (falla.prioridad === 'alta') prioridadClass = 'badge-warning';
                        if (falla.prioridad === 'critica') prioridadClass = 'badge-danger';
                        
                        html += `
                            <tr>
                                <td>${fechaHora}</td>
                                <td>${falla.tipo}</td>
                                <td>${falla.titulo}</td>
                                <td>${falla.personaNotificada}</td>
                                <td><span class="badge ${prioridadClass}">${falla.prioridad}</span></td>
                                <td><span class="badge ${estadoClass}">${falla.estado}</span></td>
                                <td>
                                    <div class="btn-group">
                                        <button class="btn btn-sm btn-info editar-falla-general" data-id="${doc.id}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger eliminar-falla-general" data-id="${doc.id}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                        <button class="btn btn-sm btn-primary ver-falla-general" data-id="${doc.id}">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-sm btn-secondary dropdown-toggle" type="button" data-id="${doc.id}">
                                            <i class="fas fa-cog"></i> 
                                        </button>
                                        <div class="dropdown-menu">
                                            <a class="dropdown-item cambiar-estado" href="#" data-id="${doc.id}" data-estado="reportada">Marcar como Reportada</a>
                                            <a class="dropdown-item cambiar-estado" href="#" data-id="${doc.id}" data-estado="en-proceso">Marcar como En Proceso</a>
                                            <a class="dropdown-item cambiar-estado" href="#" data-id="${doc.id}" data-estado="resuelta">Marcar como Resuelta</a>
                                            <a class="dropdown-item cambiar-estado" href="#" data-id="${doc.id}" data-estado="cerrada">Marcar como Cerrada</a>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }
                });
                
                if (html === '') {
                    html = '<tr><td colspan="7">No hay resultados para los filtros aplicados</td></tr>';
                }
            }
            tablaFallasGenerales.querySelector('tbody').innerHTML = html;
            
            // Configurar eventos para los dropdowns
            configurarDropdowns();
            
            // Configurar eventos para cambiar estado
            configurarEventosCambioEstado();
            
            // Agregar event listeners a los botones
            document.querySelectorAll('.editar-falla-general').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.closest('button').dataset.id;
                    editarFallaGeneral(id);
                });
            });
            
            document.querySelectorAll('.eliminar-falla-general').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.closest('button').dataset.id;
                    eliminarFallaGeneral(id);
                });
            });
            
            document.querySelectorAll('.ver-falla-general').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.closest('button').dataset.id;
                    verDetallesFallaGeneral(id);
                });
            });
            
        }).catch((error) => {
            console.error("Error al cargar fallas generales: ", error);
            mostrarNotificacion('Error al cargar los datos', 'error');
            tablaFallasGenerales.querySelector('tbody').innerHTML = '<tr><td colspan="7">Error al cargar los datos</td></tr>';
        });
    }

    // Función para configurar los dropdowns
    function configurarDropdowns() {
        document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Cerrar todos los dropdowns abiertos
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.classList.remove('show');
                });
                
                // Abrir el dropdown actual
                const dropdownMenu = this.nextElementSibling;
                dropdownMenu.classList.toggle('show');
            });
        });
        
        // Cerrar dropdowns al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!e.target.matches('.dropdown-toggle') && !e.target.closest('.dropdown-menu')) {
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
        });
    }

    // Función para configurar eventos de cambio de estado
    function configurarEventosCambioEstado() {
        document.querySelectorAll('.cambiar-estado').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const id = this.dataset.id;
                const nuevoEstado = this.dataset.estado;
                cambiarEstadoFalla(id, nuevoEstado);
                
                // Cerrar el dropdown después de seleccionar
                this.closest('.dropdown-menu').classList.remove('show');
            });
        });
    }

    // Función para cambiar el estado de una falla
    function cambiarEstadoFalla(id, nuevoEstado) {
        const updates = {
            estado: nuevoEstado,
            fechaActualizacion: new Date()
        };
        
        // Si se marca como resuelta o cerrada, agregar fecha de solución automáticamente
        if (nuevoEstado === 'resuelta' || nuevoEstado === 'cerrada') {
            updates.fechaSolucion = new Date().toISOString().split('T')[0];
        }
        
        db.collection('fallas_generales').doc(id).update(updates)
            .then(() => {
                mostrarNotificacion(`Estado cambiado a ${nuevoEstado} correctamente`, 'success');
                cargarFallasGenerales(
                    filtroEstadoFallaGeneral.value,
                    filtroTipoFallaGeneral.value,
                    filtroPrioridadFallaGeneral.value
                );
            })
            .catch((error) => {
                console.error("Error al cambiar estado: ", error);
                mostrarNotificacion('Error al cambiar el estado', 'error');
            });
    }

    // Función para cargar datos en el formulario de edición
    function cargarDatosEdicion(id) {
        db.collection('fallas_generales').doc(id).get()
            .then((doc) => {
                if (doc.exists) {
                    const falla = doc.data();
                    
                    // Llenar el formulario con los datos
                    document.getElementById('fechaFallaGeneral').value = falla.fecha;
                    document.getElementById('horaFallaGeneral').value = falla.hora;
                    document.getElementById('tipoFallaGeneral').value = falla.tipo;
                    document.getElementById('prioridadFallaGeneral').value = falla.prioridad;
                    document.getElementById('tituloFallaGeneral').value = falla.titulo;
                    document.getElementById('descripcionFallaGeneral').value = falla.descripcion;
                    document.getElementById('personaNotificada').value = falla.personaNotificada;
                    document.getElementById('medioNotificacion').value = falla.medioNotificacion;
                    document.getElementById('accionesTomadas').value = falla.accionesTomadas || '';
                    document.getElementById('solucionAplicada').value = falla.solucionAplicada || '';
                    document.getElementById('estadoFallaGeneral').value = falla.estado;
                    document.getElementById('observacionesFallaGeneral').value = falla.observaciones || '';
                    
                    // Cambiar texto del botón
                    submitButton.innerHTML = '<i class="fas fa-save"></i> Actualizar Falla General';
                    editandoId = id;
                    
                    // Scroll al formulario
                    formFallaGeneral.scrollIntoView({ behavior: 'smooth' });
                } else {
                    mostrarNotificacion('No se encontró la falla general', 'error');
                }
            })
            .catch((error) => {
                console.error("Error al cargar datos para edición: ", error);
                mostrarNotificacion('Error al cargar datos para edición', 'error');
            });
    }

    // Función para ver detalles completos
    function verDetallesFallaGeneral(id) {
        db.collection('fallas_generales').doc(id).get()
            .then((doc) => {
                if (doc.exists) {
                    const falla = doc.data();
                    
                    const detalles = `
                        <strong>Fecha/Hora:</strong> ${falla.fecha} ${falla.hora}<br>
                        <strong>Tipo:</strong> ${falla.tipo}<br>
                        <strong>Prioridad:</strong> ${falla.prioridad}<br>
                        <strong>Título:</strong> ${falla.titulo}<br>
                        <strong>Descripción:</strong> ${falla.descripcion}<br>
                        <strong>Persona Notificada:</strong> ${falla.personaNotificada}<br>
                        <strong>Medio de Notificación:</strong> ${falla.medioNotificacion}<br>
                        <strong>Acciones Tomadas:</strong> ${falla.accionesTomadas || 'N/A'}<br>
                        <strong>Solución Aplicada:</strong> ${falla.solucionAplicada || 'N/A'}<br>
                        <strong>Estado:</strong> ${falla.estado}<br>
                        <strong>Fecha Solución:</strong> ${falla.fechaSolucion || 'N/A'}<br>
                        <strong>Observaciones:</strong> ${falla.observaciones || 'N/A'}
                    `;
                    
                    // Mostrar modal con los detalles
                    if (typeof mostrarModal === 'function') {
                        mostrarModal('Detalles de Falla General', detalles);
                    } else {
                        // Fallback si no hay sistema de modal
                        alert(`Detalles de la falla:\n\n${detalles.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '')}`);
                    }
                } else {
                    mostrarNotificacion('No se encontró la falla general', 'error');
                }
            })
            .catch((error) => {
                console.error("Error al cargar detalles: ", error);
                mostrarNotificacion('Error al cargar detalles', 'error');
            });
    }

    // Función para editar una falla general
    function editarFallaGeneral(id) {
        cargarDatosEdicion(id);
    }

    // Registrar nueva falla general o actualizar existente
    formFallaGeneral.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Obtener valores del formulario
        const fallaGeneralData = {
            fecha: document.getElementById('fechaFallaGeneral').value,
            hora: document.getElementById('horaFallaGeneral').value,
            tipo: document.getElementById('tipoFallaGeneral').value,
            prioridad: document.getElementById('prioridadFallaGeneral').value,
            titulo: document.getElementById('tituloFallaGeneral').value,
            descripcion: document.getElementById('descripcionFallaGeneral').value,
            personaNotificada: document.getElementById('personaNotificada').value,
            medioNotificacion: document.getElementById('medioNotificacion').value,
            accionesTomadas: document.getElementById('accionesTomadas').value,
            solucionAplicada: document.getElementById('solucionAplicada').value,
            estado: document.getElementById('estadoFallaGeneral').value,
            observaciones: document.getElementById('observacionesFallaGeneral').value,
            fechaActualizacion: new Date()
        };
        
        // Si el estado es resuelta o cerrada y no hay fecha de solución, agregarla
        if ((fallaGeneralData.estado === 'resuelta' || fallaGeneralData.estado === 'cerrada')) {
            fallaGeneralData.fechaSolucion = new Date().toISOString().split('T')[0];
        }
        
        // Si estamos editando, agregar también la fecha de registro original
        if (editandoId) {
            db.collection('fallas_generales').doc(editandoId).get()
                .then((doc) => {
                    if (doc.exists) {
                        fallaGeneralData.fechaRegistro = doc.data().fechaRegistro;
                        // Mantener la fecha de solución existente si ya existe
                        if (doc.data().fechaSolucion) {
                            fallaGeneralData.fechaSolucion = doc.data().fechaSolucion;
                        }
                        
                        // Actualizar documento existente
                        db.collection('fallas_generales').doc(editandoId).update(fallaGeneralData)
                            .then(() => {
                                mostrarNotificacion('Falla general actualizada correctamente', 'success');
                                limpiarFormularioFallaGeneral();
                                cargarFallasGenerales(
                                    filtroEstadoFallaGeneral.value,
                                    filtroTipoFallaGeneral.value,
                                    filtroPrioridadFallaGeneral.value
                                );
                                editandoId = null;
                            })
                            .catch((error) => {
                                console.error("Error al actualizar falla general: ", error);
                                mostrarNotificacion('Error al actualizar la falla general', 'error');
                            });
                    }
                });
        } else {
            // Crear nuevo documento
            fallaGeneralData.fechaRegistro = new Date();
            
            db.collection('fallas_generales').add(fallaGeneralData)
                .then(() => {
                    mostrarNotificacion('Falla general registrada correctamente', 'success');
                    limpiarFormularioFallaGeneral();
                    cargarFallasGenerales(
                        filtroEstadoFallaGeneral.value,
                        filtroTipoFallaGeneral.value,
                        filtroPrioridadFallaGeneral.value
                    );
                })
                .catch((error) => {
                    console.error("Error al registrar falla general: ", error);
                    mostrarNotificacion('Error al registrar la falla general', 'error');
                });
        }
    });

    // Limpiar formulario
    btnLimpiarFallaGeneral.addEventListener('click', limpiarFormularioFallaGeneral);
    
    function limpiarFormularioFallaGeneral() {
        formFallaGeneral.reset();
        
        // Restaurar texto del botón
        submitButton.innerHTML = '<i class="fas fa-save"></i> Registrar Falla General';
        editandoId = null;
        
        // Establecer fecha y hora actual
        const now = new Date();
        document.getElementById('fechaFallaGeneral').value = now.toISOString().split('T')[0];
        document.getElementById('horaFallaGeneral').value = now.toTimeString().substring(0, 5);
    }

    // Filtrar fallas cuando cambien los filtros
    filtroEstadoFallaGeneral.addEventListener('change', () => {
        cargarFallasGenerales(
            filtroEstadoFallaGeneral.value,
            filtroTipoFallaGeneral.value,
            filtroPrioridadFallaGeneral.value
        );
    });
    
    filtroTipoFallaGeneral.addEventListener('change', () => {
        cargarFallasGenerales(
            filtroEstadoFallaGeneral.value,
            filtroTipoFallaGeneral.value,
            filtroPrioridadFallaGeneral.value
        );
    });
    
    filtroPrioridadFallaGeneral.addEventListener('change', () => {
        cargarFallasGenerales(
            filtroEstadoFallaGeneral.value,
            filtroTipoFallaGeneral.value,
            filtroPrioridadFallaGeneral.value
        );
    });

    // Eliminar una falla general
    function eliminarFallaGeneral(id) {
        if (confirm('¿Está seguro de que desea eliminar esta falla general?')) {
            db.collection('fallas_generales').doc(id).delete()
                .then(() => {
                    mostrarNotificacion('Falla general eliminada correctamente', 'success');
                    cargarFallasGenerales(
                        filtroEstadoFallaGeneral.value,
                        filtroTipoFallaGeneral.value,
                        filtroPrioridadFallaGeneral.value
                    );
                })
                .catch((error) => {
                    console.error("Error al eliminar falla general: ", error);
                    mostrarNotificacion('Error al eliminar la falla general', 'error');
                });
        }
    }

    // Establecer fecha y hora actual por defecto
    const now = new Date();
    document.getElementById('fechaFallaGeneral').value = now.toISOString().split('T')[0];
    document.getElementById('horaFallaGeneral').value = now.toTimeString().substring(0, 5);
    
    // Cargar datos al iniciar
    cargarFallasGenerales();
});