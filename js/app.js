// Referencias a elementos del DOM
const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
const modules = document.querySelectorAll('.module');
const currentDateElement = document.getElementById('currentDate');

// Mostrar fecha actual
const now = new Date();
currentDateElement.textContent = now.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
});

// Navegación entre módulos
sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        const target = link.getAttribute('data-target');

        // Remover clase active de todos los links y módulos
        sidebarLinks.forEach(l => l.classList.remove('active'));
        modules.forEach(m => m.classList.remove('active'));

        // Agregar clase active al link y módulo seleccionado
        link.classList.add('active');
        document.getElementById(target).classList.add('active');

        // Cargar datos específicos del módulo
        if (target === 'dashboard') {
            cargarDatosDashboard();
        } else if (target === 'fallas') {
            cargarFallas();
        } else if (target === 'combustible') {
            cargarCombustible();
        }
    });
});

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('fechaCombustible').value = new Date().toISOString().slice(0, 16);
    cargarDatosDashboard();
});

// Sistema de Notificaciones
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear contenedor de notificaciones si no existe
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    // Sistema de notificaciones 0.1
    function mostrarNotificacion(mensaje, tipo = 'info', tiempo = 5000) {
        // Crear contenedor si no existe
        let container = document.querySelector('.notification-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        // Crear notificación
        const notification = document.createElement('div');
        notification.className = `notification ${tipo}`;
        notification.innerHTML = `
        <div>${mensaje}</div>
        <button class="close">&times;</button>
    `;

        // Agregar evento para cerrar
        notification.querySelector('.close').addEventListener('click', () => {
            cerrarNotificacion(notification);
        });

        // Agregar al contenedor
        container.appendChild(notification);

        // Cerrar automáticamente después del tiempo especificado
        if (tiempo > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    cerrarNotificacion(notification);
                }
            }, tiempo);
        }

        return notification;
    }

    function cerrarNotificacion(notification) {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // Hacer la función global para que esté disponible en todos los archivos
    window.mostrarNotificacion = mostrarNotificacion;
    window.cerrarNotificacion = cerrarNotificacion;

    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `notification ${tipo}`;

    // Contenido de la notificación
    notification.innerHTML = `
        <div class="notification-content">${mensaje}</div>
        <button class="notification-close">&times;</button>
    `;

    // Agregar al contenedor
    container.appendChild(notification);

    // Configurar cierre automático
    const autoClose = setTimeout(() => {
        closeNotification(notification);
    }, 5000);

    // Configurar cierre manual
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        clearTimeout(autoClose);
        closeNotification(notification);
    });

    // Función para cerrar notificación
    function closeNotification(notif) {
        notif.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notif.parentNode) {
                notif.parentNode.removeChild(notif);
            }
        }, 300);
    }
}

// Función para mostrar modal
function mostrarModal(titulo, contenido) {
    // Crear modal si no existe
    let modal = document.getElementById('modalDetalles');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalDetalles';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modalTitulo"></h3>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body" id="modalContenido"></div>
            </div>
        `;
        document.body.appendChild(modal);

        // Agregar estilos
        const styles = `
            .modal {
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.5);
            }
            .modal-content {
                background-color: #fefefe;
                margin: 10% auto;
                padding: 0;
                border: 1px solid #888;
                width: 80%;
                max-width: 600px;
                border-radius: 5px;
            }
            .modal-header {
                padding: 15px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .modal-header h3 {
                margin: 0;
            }
            .modal-header .close {
                color: #aaa;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
            }
            .modal-body {
                padding: 15px;
            }
        `;
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);

        // Evento para cerrar modal
        modal.querySelector('.close').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Cerrar al hacer clic fuera del contenido
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Llenar modal con contenido
    document.getElementById('modalTitulo').textContent = titulo;
    document.getElementById('modalContenido').innerHTML = contenido;

    // Mostrar modal
    modal.style.display = 'block';
}

// Hacer la función global
window.mostrarModal = mostrarModal;