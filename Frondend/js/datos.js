document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://127.0.0.1:8000/api'; // ¡AJUSTA ESTO A TU URL DE API!

    // Contenedores de vistas principales
    const vistas = document.querySelectorAll('.app-main > .vista');
    const dashboardVista = document.getElementById('dashboard-vista'); // No se usa directamente, se muestra por mostrarVista
    const nuevaRetrospectivaVista = document.getElementById('nuevaRetrospectiva-vista'); // No se usa directamente
    const sprintBoardVista = document.getElementById('sprint-board-vista'); // No se usa directamente

    // Dashboard
    const sprintsGridContainer = document.getElementById('sprints-grid-container');

    // Formulario Nuevo Sprint
    const formNuevaSprint = document.getElementById('form-nueva-sprint');
    const inputSprintNombre = document.getElementById('sprint-nombre');
    const inputSprintFechaInicio = document.getElementById('sprint-fecha-inicio');
    const inputSprintFechaFin = document.getElementById('sprint-fecha-fin');

    // Sprint Board
    const boardSprintNameH2 = document.getElementById('board-sprint-name');
    const boardSprintDatesP = document.getElementById('board-sprint-dates');
    const btnOpenAddItemModal = document.getElementById('btn-open-add-item-modal');
    const retroBoardColumns = {
        logro: document.querySelector('#columna-logro .items-container'),
        impedimento: document.querySelector('#columna-impedimento .items-container'),
        accion: document.querySelector('#columna-accion .items-container'),
    };

    // Modal Añadir Ítem
    const addItemModal = document.getElementById('addItemModal'); // Se usa en abrir/cerrarModal
    const formAddItem = document.getElementById('form-add-item');
    const addItemSprintIdInput = document.getElementById('add-item-sprint-id');
    const addItemCategoriaSelect = document.getElementById('add-item-categoria');
    const addItemDescripcionTextarea = document.getElementById('add-item-descripcion');
    const addItemCamposAccionDiv = document.getElementById('add-item-campos-accion');
    const addItemCumplidaCheckbox = document.getElementById('add-item-cumplida');
    const addItemFechaRevisionInput = document.getElementById('add-item-fecha-revision');

    // Modal Editar Ítem
    const editItemModal = document.getElementById('editItemModal'); // Se usa en abrir/cerrarModal
    const formEditItem = document.getElementById('form-edit-item');
    const editItemIdInput = document.getElementById('edit-item-id');
    const editItemSprintIdContextInput = document.getElementById('edit-item-sprint-id-context');
    const editItemCategoriaSelect = document.getElementById('edit-item-categoria');
    const editItemDescripcionTextarea = document.getElementById('edit-item-descripcion');
    const editItemCamposAccionDiv = document.getElementById('edit-item-campos-accion');
    const editItemCumplidaCheckbox = document.getElementById('edit-item-cumplida');
    const editItemFechaRevisionInput = document.getElementById('edit-item-fecha-revision');

    // Para el historial de actividad de la sesión
    let actividadRecienteSesion = [];
    const actividadSesionModal = document.getElementById('actividadSesionModal'); // Se usa en abrir/cerrarModal
    const actividadSesionLogContainer = document.getElementById('actividad-sesion-log-container');
    const btnVerActividadSesion = document.getElementById('btn-ver-actividad-sesion');

    let todosLosSprints = [];
    let sprintActivo = null;

    // --- FUNCIÓN AUXILIAR API CON AXIOS ---
    async function callApi(method, endpoint, data = null) {
        try {
            const config = {
                method: method,
                url: `${API_BASE_URL}${endpoint}`,
                headers: { 'Accept': 'application/json' }
            };
            if (data) {
                config.data = data;
                config.headers['Content-Type'] = 'application/json';
            }
            const response = await axios(config);
            return response.data;
        } catch (error) {
            console.error(`API Error (${method} ${endpoint}):`, error.response ? error.response.data : error.message);
            const errorMsg = error.response?.data?.message || JSON.stringify(error.response?.data?.errors) || error.message;
            alert(`Error en la operación: ${errorMsg}`);
            return null;
        }
    }

    // --- MANEJO DE VISTAS ---
    window.mostrarVista = (idVista) => {
        vistas.forEach(vista => {
            vista.style.display = vista.id === idVista ? 'block' : 'none';
        });

        if (idVista === 'dashboard-vista') {
            cargarSprintsDashboard();
        } else if (idVista === 'nuevaRetrospectiva-vista') {
            if(formNuevaSprint) formNuevaSprint.reset();
        }
        // El sprint-board-vista se carga a través de cargarSprintBoard()
    };

    // --- MODALES ---
    window.abrirModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'block';
    };
    window.cerrarModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
        // Resetear formularios específicos al cerrar su modal
        if (modalId === 'addItemModal' && formAddItem) {
            formAddItem.reset();
            if(addItemCategoriaSelect) addItemCategoriaSelect.value = "logro"; // Valor por defecto o el primero
            if(addItemCategoriaSelect) addItemCategoriaSelect.dispatchEvent(new Event('change')); // Para actualizar campos dependientes
        }
        if (modalId === 'editItemModal' && formEditItem) {
            formEditItem.reset();
            if(editItemCategoriaSelect) editItemCategoriaSelect.dispatchEvent(new Event('change'));
        }
    };
    // Cerrar modal si se hace clic fuera del contenido (en el overlay oscuro)
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            cerrarModal(event.target.id);
        }
    });

    // --- FUNCIONES PARA REGISTRAR Y MOSTRAR ACTIVIDAD DE SESIÓN ---
    function registrarActividad(tipoAccion, detalles) {
        const ahora = new Date();
        actividadRecienteSesion.unshift({ // Añadir al principio para ver lo más reciente primero
            timestamp: ahora.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium'}), // Formato de fecha/hora localizado
            accion: tipoAccion,
            detalles: detalles
        });
        // Opcional: Limitar el tamaño del log en memoria
        if (actividadRecienteSesion.length > 30) { // Mantener solo las últimas 30 acciones
            actividadRecienteSesion.pop();
        }
        // console.log("Actividad Registrada:", actividadRecienteSesion[0]); // Para depuración
    }

    if (btnVerActividadSesion) {
        btnVerActividadSesion.addEventListener('click', () => {
            renderizarActividadSesion();
            abrirModal('actividadSesionModal');
        });
    }

    function renderizarActividadSesion() {
        if (!actividadSesionLogContainer) return;
        if (actividadRecienteSesion.length === 0) {
            actividadSesionLogContainer.innerHTML = '<p class="empty-state">No hay actividad registrada en esta sesión aún.</p>';
            return;
        }
        actividadSesionLogContainer.innerHTML = '';
        actividadRecienteSesion.forEach(log => {
            const logEntryDiv = document.createElement('div');
            logEntryDiv.className = 'history-entry'; // Reutilizar estilos si son adecuados
            logEntryDiv.innerHTML = `
                <span class="timestamp">${log.timestamp}</span>
                <div class="action-type-label">${log.accion}</div>
                <div class="details">${log.detalles}</div>
            `;
            actividadSesionLogContainer.appendChild(logEntryDiv);
        });
    }

    // --- DASHBOARD (LISTA DE SPRINTS) ---
    async function cargarSprintsDashboard() {
        if (!sprintsGridContainer) return;
        sprintsGridContainer.innerHTML = '<p class="loading-state">Cargando sprints...</p>';
        const response = await callApi('GET', '/sprints');
        if (response && response.success && response.data.data) {
            todosLosSprints = response.data.data;
            if (todosLosSprints.length === 0) {
                sprintsGridContainer.innerHTML = '<p class="empty-state">No hay sprints creados. ¡Crea el primero!</p>';
                return;
            }
            sprintsGridContainer.innerHTML = '';
            todosLosSprints.forEach(sprint => {
                const card = document.createElement('div');
                card.className = 'sprint-card-dashboard';
                // Usar retro_items_count si viene de withCount, sino calcular con retro_items.length
                const itemCount = sprint.retro_items_count !== undefined ? sprint.retro_items_count : (sprint.retro_items?.length || 0);
                card.innerHTML = `
                    <h3>${sprint.nombre}</h3>
                    <p>ID: ${sprint.id}</p>
                    <p>Inicio: ${sprint.fecha_inicio}</p>
                    <p>Fin: ${sprint.fecha_fin}</p>
                    <p><small>${itemCount} ítems</small></p>
                `;
                card.addEventListener('click', () => cargarSprintBoard(sprint.id));
                sprintsGridContainer.appendChild(card);
            });
        } else {
            sprintsGridContainer.innerHTML = '<p class="empty-state">Error al cargar los sprints.</p>';
        }
    }

    // --- CREAR NUEVO SPRINT ---
    if (formNuevaSprint) {
        formNuevaSprint.addEventListener('submit', async (event) => {
            event.preventDefault();
            const nombre = inputSprintNombre.value.trim();
            const fechaInicio = inputSprintFechaInicio.value;
            const fechaFin = inputSprintFechaFin.value;

            if (!nombre || !fechaInicio || !fechaFin) {
                alert('Todos los campos son obligatorios para crear un sprint.'); return;
            }
            if (new Date(fechaFin) < new Date(fechaInicio)) {
                alert('La fecha de fin no puede ser anterior a la fecha de inicio.'); return;
            }
            const sprintData = { nombre, fecha_inicio: fechaInicio, fecha_fin: fechaFin };
            const response = await callApi('POST', '/sprints', sprintData);
            if (response && response.success) {
                alert('Sprint creado exitosamente!');
                registrarActividad('Sprint Creado', `Nombre: "${sprintData.nombre}", Fechas: ${sprintData.fecha_inicio} a ${sprintData.fecha_fin}`);
                formNuevaSprint.reset();
                mostrarVista('dashboard-vista');
            }
        });
    }

    // --- SPRINT BOARD ---
    async function cargarSprintBoard(sprintId) {
        const response = await callApi('GET', `/sprints/${sprintId}`);
        if (response && response.success) {
            sprintActivo = response.data;
            if(boardSprintNameH2) boardSprintNameH2.textContent = sprintActivo.nombre;
            if(boardSprintDatesP) boardSprintDatesP.textContent = `Del ${sprintActivo.fecha_inicio} al ${sprintActivo.fecha_fin}`;
            if(addItemSprintIdInput) addItemSprintIdInput.value = sprintActivo.id; // Para el modal de añadir ítem

            Object.values(retroBoardColumns).forEach(col => {
                if(col) col.innerHTML = ''; // Limpiar columnas solo si existen
            });

            if (sprintActivo.retro_items && sprintActivo.retro_items.length > 0) {
                sprintActivo.retro_items.forEach(item => {
                    const columnContainer = retroBoardColumns[item.categoria];
                    if (columnContainer) {
                        columnContainer.appendChild(crearTarjetaItem(item));
                    } else {
                        // Si hay categorías 'comentario' u 'otro' y no tienes columnas definidas,
                        // podrías decidir dónde ponerlas o ignorarlas si no son principales.
                        // console.warn(`Categoría no mapeada a columna: ${item.categoria}`);
                        // Ejemplo: añadir a una columna por defecto o a la última disponible
                        const fallbackColumn = retroBoardColumns['accion'] || Object.values(retroBoardColumns).find(col => col);
                        if(fallbackColumn) fallbackColumn.appendChild(crearTarjetaItem(item));
                    }
                });
            }
            mostrarVista('sprint-board-vista');
        } else {
            alert('Error al cargar el sprint.');
            mostrarVista('dashboard-vista');
        }
    }

    function crearTarjetaItem(item) {
        const card = document.createElement('div');
        card.className = 'retro-item-card';
        card.dataset.category = item.categoria; // Para aplicar estilo de borde por categoría desde CSS

        let metaHTML = '';
        if (item.categoria === 'accion') {
            metaHTML = `
                <div class="item-meta">
                    <label>
                        <input type="checkbox" ${item.cumplida ? 'checked' : ''} onchange="toggleCumplidaItem('${item.id}', this.checked)">
                        <span></span> ${item.cumplida ? 'Cumplida' : 'Pendiente'}
                    </label>
                    ${item.fecha_revision ? ` | Revisar: ${item.fecha_revision}` : ''}
                </div>`;
        }

        card.innerHTML = `
            <div class="item-description">${item.descripcion.replace(/\n/g, '<br>')}</div>
            ${metaHTML}
            <div class="item-actions-toolbar">
                <button class="btn btn-info btn-sm" onclick="abrirModalEdicionItem('${item.id}')">Editar</button>
                <button class="btn btn-danger btn-sm" onclick="eliminarItem('${item.id}')">Eliminar</button>
            </div>
        `;
        return card;
    }

    // --- AÑADIR ÍTEM (MODAL) ---
    if (btnOpenAddItemModal) {
        btnOpenAddItemModal.addEventListener('click', () => {
            if (sprintActivo) {
                if(addItemSprintIdInput) addItemSprintIdInput.value = sprintActivo.id;
                if(formAddItem) formAddItem.reset();
                if(addItemCategoriaSelect) {
                    addItemCategoriaSelect.value = 'logro'; // Valor por defecto
                    addItemCategoriaSelect.dispatchEvent(new Event('change')); // Para mostrar/ocultar campos de acción
                }
                abrirModal('addItemModal');
            } else {
                alert("Por favor, selecciona o carga un sprint primero desde el dashboard.");
            }
        });
    }

    if (addItemCategoriaSelect) {
        addItemCategoriaSelect.addEventListener('change', () => {
            if(addItemCamposAccionDiv) addItemCamposAccionDiv.style.display = addItemCategoriaSelect.value === 'accion' ? 'block' : 'none';
        });
    }

    if (formAddItem) {
        formAddItem.addEventListener('submit', async (event) => {
            event.preventDefault();
            const sprintId = addItemSprintIdInput.value;
            const categoria = addItemCategoriaSelect.value;
            const descripcion = addItemDescripcionTextarea.value.trim();

            if (!sprintId) { alert('Error interno: ID de Sprint no encontrado.'); return; }
            if (!categoria) { alert('Debe seleccionar una categoría.'); return; }
            if (!descripcion) { alert('La descripción no puede estar vacía.'); return; }

            const itemData = { categoria, descripcion };
            if (categoria === 'accion') {
                itemData.cumplida = addItemCumplidaCheckbox.checked;
                if (addItemFechaRevisionInput.value) itemData.fecha_revision = addItemFechaRevisionInput.value;
            }

            const response = await callApi('POST', `/sprints/${sprintId}/items`, itemData);
            if (response && response.success) {
                alert('Ítem agregado exitosamente.');
                registrarActividad('Ítem Agregado', `"${descripcion.substring(0, 30)}..." (Cat: ${categoria}) al Sprint: "${sprintActivo?.nombre || sprintId}"`);
                cerrarModal('addItemModal');
                cargarSprintBoard(sprintId); // Recargar el tablero del sprint activo
            }
        });
    }


    // --- EDITAR ÍTEM (MODAL) ---
    window.abrirModalEdicionItem = (itemId) => {
        if (!sprintActivo || !sprintActivo.retro_items) return;
        const itemAEditar = sprintActivo.retro_items.find(item => item.id == itemId);

        if (itemAEditar) {
            if(editItemIdInput) editItemIdInput.value = itemAEditar.id;
            if(editItemSprintIdContextInput) editItemSprintIdContextInput.value = sprintActivo.id;
            if(editItemCategoriaSelect) editItemCategoriaSelect.value = itemAEditar.categoria;
            if(editItemDescripcionTextarea) editItemDescripcionTextarea.value = itemAEditar.descripcion;

            if (itemAEditar.categoria === 'accion') {
                if(editItemCamposAccionDiv) editItemCamposAccionDiv.style.display = 'block';
                if(editItemCumplidaCheckbox) editItemCumplidaCheckbox.checked = !!itemAEditar.cumplida;
                if(editItemFechaRevisionInput) editItemFechaRevisionInput.value = itemAEditar.fecha_revision || '';
            } else {
                if(editItemCamposAccionDiv) editItemCamposAccionDiv.style.display = 'none';
            }
            if(editItemCategoriaSelect) editItemCategoriaSelect.dispatchEvent(new Event('change')); // Para asegurar visibilidad correcta
            abrirModal('editItemModal');
        } else {
            alert('Ítem no encontrado para editar.');
        }
    };
    
    if(editItemCategoriaSelect) {
        editItemCategoriaSelect.addEventListener('change', () => { // Para el modal de edición
            if(editItemCamposAccionDiv) editItemCamposAccionDiv.style.display = editItemCategoriaSelect.value === 'accion' ? 'block' : 'none';
        });
    }

    if(formEditItem) {
        formEditItem.addEventListener('submit', async (event) => {
            event.preventDefault();
            const itemId = editItemIdInput.value;
            const sprintIdContexto = editItemSprintIdContextInput.value;
            const categoria = editItemCategoriaSelect.value;
            const descripcion = editItemDescripcionTextarea.value.trim();

            if (!categoria) { alert('Debe seleccionar una categoría.'); return;}
            if (!descripcion) { alert('La descripción no puede estar vacía.'); return;}

            const datosEditados = { categoria, descripcion };
            if (categoria === 'accion') {
                datosEditados.cumplida = editItemCumplidaCheckbox.checked;
                datosEditados.fecha_revision = editItemFechaRevisionInput.value || null;
            }
            const response = await callApi('PUT', `/items/${itemId}`, datosEditados);
            if (response && response.success) {
                alert('Ítem actualizado exitosamente.');
                registrarActividad('Ítem Editado', `ID: ${itemId} - Nueva Desc: "${datosEditados.descripcion.substring(0, 30)}...", Cat: ${datosEditados.categoria}, Sprint: "${sprintActivo?.nombre || sprintIdContexto}"`);
                cerrarModal('editItemModal');
                cargarSprintBoard(sprintIdContexto);
            }
        });
    }

    // --- ACCIONES DE ÍTEM (ELIMINAR, TOGGLE CUMPLIDA) ---
    window.eliminarItem = async (itemId) => {
        if (!confirm('¿Estás seguro de eliminar este ítem?')) return;
        
        let itemDescripcionParaLog = `ID: ${itemId}`;
        let itemCategoriaParaLog = '';
        if(sprintActivo && sprintActivo.retro_items) {
            const item = sprintActivo.retro_items.find(i => i.id == itemId);
            if(item) {
                itemDescripcionParaLog = `"${item.descripcion.substring(0,30)}..."`;
                itemCategoriaParaLog = item.categoria;
            }
        }

        const response = await callApi('DELETE', `/items/${itemId}`);
        if (response && response.success) {
            alert(response.message || 'Ítem eliminado.');
            registrarActividad('Ítem Eliminado', `${itemDescripcionParaLog} (Cat: ${itemCategoriaParaLog}) del Sprint: "${sprintActivo?.nombre || 'N/A'}"`);
            if (sprintActivo) cargarSprintBoard(sprintActivo.id);
        }
    };

    window.toggleCumplidaItem = async (itemId, nuevoEstado) => {
        const response = await callApi('PUT', `/items/${itemId}`, { cumplida: nuevoEstado });
        if (response && response.success) {
            // alert('Estado de acción actualizado.'); // Opcional: quitar para menos interrupciones
            registrarActividad('Estado de Acción Cambiado', `ID: ${itemId} a ${nuevoEstado ? 'Cumplida' : 'Pendiente'} en Sprint: "${sprintActivo?.nombre || 'N/A'}"`);
            if (sprintActivo) cargarSprintBoard(sprintActivo.id);
        } else {
            // Si falla, recargar para revertir el checkbox visualmente
            if (sprintActivo) cargarSprintBoard(sprintActivo.id);
        }
    };

    // --- INICIALIZACIÓN ---
    mostrarVista('dashboard-vista'); // Mostrar el dashboard al cargar la página
});