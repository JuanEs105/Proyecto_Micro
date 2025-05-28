document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://127.0.0.1:8000/api'; // ¡AJUSTA ESTO!

    // Contenedores de vistas
    const vistas = document.querySelectorAll('.vista');
    const vistaInicio = document.getElementById('inicio');
    const vistaNuevaRetrospectiva = document.getElementById('nuevaRetrospectiva');
    const vistaAgregarItem = document.getElementById('agregarItem');
    const vistaHistorial = document.getElementById('historial');
    // const vistaReporte = document.getElementById('reporte'); // Si se implementa

    // Formularios
    const formNuevaRetrospectiva = document.getElementById('form-nueva-retrospectiva');
    const formAgregarItem = document.getElementById('form-agregar-item');

    // Elementos del formulario de agregar ítem
    const selectSprintParaItem = document.getElementById('item-sprint-id');
    const selectCategoriaItem = document.getElementById('item-categoria');
    const divCamposDescripcionItem = document.getElementById('item-campos-descripcion');
    const divCamposAccionItem = document.getElementById('item-campos-accion');
    const checkboxItemCumplida = document.getElementById('item-cumplida');
    const inputItemFechaRevision = document.getElementById('item-fecha-revision');
    const btnGuardarItem = document.getElementById('btn-guardar-item');


    // Historial
    const divListaHistorialSprints = document.getElementById('lista-historial-sprints');

    // --- FUNCIÓN AUXILIAR PARA LLAMADAS API CON AXIOS ---
    async function callApi(method, endpoint, data = null) {
        try {
            const config = {
                method: method,
                url: `${API_BASE_URL}${endpoint}`,
                headers: {
                    'Accept': 'application/json',
                }
            };
            if (data) {
                config.data = data;
                config.headers['Content-Type'] = 'application/json';
            }
            const response = await axios(config);
            return response.data; // Axios envuelve la respuesta en 'data'
        } catch (error) {
            console.error(`API Error (${method} ${endpoint}):`, error.response ? error.response.data : error.message);
            const errorMsg = error.response ?
                             (error.response.data.message || JSON.stringify(error.response.data.errors || error.response.data)) :
                             error.message;
            alert(`Error en la operación: ${errorMsg}`);
            return null;
        }
    }

    // --- MANEJO DE VISTAS ---
    window.mostrarVista = (idVista) => {
        vistas.forEach(vista => {
            vista.style.display = vista.id === idVista ? 'block' : 'none';
        });

        // Acciones específicas al mostrar una vista
        if (idVista === 'agregarItem') {
            cargarSprintsParaSelect();
            // Resetear y configurar el form de agregar ítem
            formAgregarItem.reset();
            selectCategoriaItem.value = ""; // Asegurar que no haya categoría seleccionada
            divCamposDescripcionItem.style.display = 'none';
            divCamposAccionItem.style.display = 'none';
            btnGuardarItem.style.display = 'none';
        } else if (idVista === 'historial') {
            cargarHistorialSprints();
        } else if (idVista === 'inicio') {
            // Acciones para la vista de inicio si es necesario
        }
    };

    // --- LÓGICA PARA SPRINTS (RETROSPECTIVAS) ---
    async function cargarSprintsParaSelect() {
        selectSprintParaItem.innerHTML = '<option value="">-- Cargando Sprints... --</option>';
        const response = await callApi('GET', '/sprints');
        if (response && response.success && response.data && response.data.data) {
            const sprints = response.data.data; // Asumiendo paginación de Laravel
            selectSprintParaItem.innerHTML = '<option value="">-- Selecciona un Sprint --</option>';
            if (sprints.length === 0) {
                selectSprintParaItem.innerHTML = '<option value="">-- No hay Sprints creados --</option>';
                return;
            }
            sprints.forEach(sprint => {
                const option = document.createElement('option');
                option.value = sprint.id;
                option.textContent = `${sprint.nombre} (ID: ${sprint.id})`;
                selectSprintParaItem.appendChild(option);
            });
        } else {
            selectSprintParaItem.innerHTML = '<option value="">-- Error al cargar Sprints --</option>';
        }
    }

    formNuevaRetrospectiva.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(formNuevaRetrospectiva);
        const sprintData = {
            nombre: formData.get('nombre'),
            fecha_inicio: formData.get('fecha_inicio'),
            fecha_fin: formData.get('fecha_fin'),
        };

        if (new Date(sprintData.fecha_fin) < new Date(sprintData.fecha_inicio)) {
            alert('La fecha de fin no puede ser anterior a la fecha de inicio.');
            return;
        }

        const response = await callApi('POST', '/sprints', sprintData);
        if (response && response.success) {
            alert('Sprint creado exitosamente!');
            formNuevaRetrospectiva.reset();
            mostrarVista('inicio'); // O a donde quieras redirigir
        }
    });

    // --- LÓGICA PARA ÍTEMS DE RETROSPECTIVA ---
    selectCategoriaItem.addEventListener('change', () => {
        const categoria = selectCategoriaItem.value;
        if (categoria) {
            divCamposDescripcionItem.style.display = 'block';
            btnGuardarItem.style.display = 'block';
            if (categoria === 'accion') {
                divCamposAccionItem.style.display = 'block';
            } else {
                divCamposAccionItem.style.display = 'none';
                // Limpiar campos de acción si no es 'accion'
                checkboxItemCumplida.checked = false;
                inputItemFechaRevision.value = '';
            }
        } else {
            divCamposDescripcionItem.style.display = 'none';
            divCamposAccionItem.style.display = 'none';
            btnGuardarItem.style.display = 'none';
        }
    });

    formAgregarItem.addEventListener('submit', async (event) => {
        event.preventDefault();
        const sprintId = selectSprintParaItem.value;
        const categoria = selectCategoriaItem.value;
        const descripcion = document.getElementById('item-descripcion').value;

        if (!sprintId || !categoria || !descripcion) {
            alert('Por favor, completa todos los campos requeridos.');
            return;
        }

        const itemData = {
            sprint_id: sprintId, // Ya está en el form, pero para claridad
            categoria: categoria,
            descripcion: descripcion,
        };

        if (categoria === 'accion') {
            itemData.cumplida = checkboxItemCumplida.checked;
            if (inputItemFechaRevision.value) {
                itemData.fecha_revision = inputItemFechaRevision.value;
            }
        }
        
        const response = await callApi('POST', `/sprints/${sprintId}/items`, itemData);
        if (response && response.success) {
            alert('Ítem agregado exitosamente al sprint!');
            formAgregarItem.reset();
            selectCategoriaItem.value = ""; // Disparar change para resetear campos extra
            selectCategoriaItem.dispatchEvent(new Event('change'));
            mostrarVista('historial'); // O a donde quieras redirigir
            cargarHistorialSprints(); // Recargar el historial para ver el nuevo ítem
        }
    });

    // --- LÓGICA PARA HISTORIAL ---
    async function cargarHistorialSprints() {
        divListaHistorialSprints.innerHTML = '<p class="loading-state">Cargando historial...</p>';
        const response = await callApi('GET', '/sprints'); // Asume que este endpoint trae los items anidados

        if (response && response.success && response.data && response.data.data) {
            const sprints = response.data.data;
            if (sprints.length === 0) {
                divListaHistorialSprints.innerHTML = '<p class="empty-state">No hay retrospectivas registradas.</p>';
                return;
            }

            divListaHistorialSprints.innerHTML = ''; // Limpiar
            sprints.forEach(sprint => {
                const sprintCard = document.createElement('div');
                sprintCard.className = 'card';
                let itemsHTML = '<p><em>No hay ítems registrados para este sprint.</em></p>';

                if (sprint.retro_items && sprint.retro_items.length > 0) {
                    itemsHTML = sprint.retro_items.map(item => {
                        let itemColor = '#6c757d'; // default 'otro'
                        if (item.categoria === 'logro') itemColor = '#28a745';
                        else if (item.categoria === 'impedimento') itemColor = '#dc3545';
                        else if (item.categoria === 'accion') itemColor = '#007bff';
                        else if (item.categoria === 'comentario') itemColor = '#6c757d';


                        return `
                            <div class="retro-item-card" style="border-left-color: ${itemColor};">
                                <h4>${item.categoria.charAt(0).toUpperCase() + item.categoria.slice(1)}</h4>
                                <p>${item.descripcion}</p>
                                ${item.categoria === 'accion' ? `<p><small>Cumplida: ${item.cumplida ? 'Sí' : 'No'} ${item.fecha_revision ? `| Rev.: ${item.fecha_revision}` : ''}</small></p>` : ''}
                                <div class="item-actions">
                                    ${item.categoria === 'accion' ? `<button class="btn btn-warning btn-sm" onclick="toggleCumplidaItem('${item.id}', ${!item.cumplida})">${item.cumplida ? 'Marcar No Cumplida' : 'Marcar Cumplida'}</button>` : ''}
                                    <button class="btn btn-danger btn-sm" onclick="eliminarRetroItem('${item.id}')">Eliminar Ítem</button>
                                </div>
                            </div>
                        `;
                    }).join('');
                }

                sprintCard.innerHTML = `
                    <h3>${sprint.nombre}</h3>
                    <p><small>ID: ${sprint.id} | Inicio: ${sprint.fecha_inicio} | Fin: ${sprint.fecha_fin}</small></p>
                    <h4>Ítems de Retrospectiva:</h4>
                    ${itemsHTML}
                `;
                divListaHistorialSprints.appendChild(sprintCard);
            });
        } else {
            divListaHistorialSprints.innerHTML = '<p class="empty-state">Error al cargar el historial.</p>';
        }
    }

    // Hacer estas funciones globales para los botones inline (o refactorizar a event delegation)
    window.eliminarRetroItem = async (itemId) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este ítem?')) return;

        const response = await callApi('DELETE', `/items/${itemId}`);
        if (response && (response.success || response.message)) { // DELETE puede no devolver 'success'
            alert(response.message || 'Ítem eliminado exitosamente.');
            cargarHistorialSprints(); // Recargar el historial
        }
    };

    window.toggleCumplidaItem = async (itemId, nuevoEstadoCumplida) => {
        const response = await callApi('PUT', `/items/${itemId}`, { cumplida: nuevoEstadoCumplida });
        if (response && response.success) {
            alert('Estado del ítem actualizado.');
            cargarHistorialSprints(); // Recargar el historial
        }
    };


    // --- INICIALIZACIÓN ---
    mostrarVista('inicio'); // Mostrar la vista de inicio por defecto
});