/* CinePrep - Plan de Producción Module (con Carga de Archivos desde PC) */
const PlanProduccionModule = {
  render() {
    if (!App.requireProject()) return '<div class="empty-state"><div class="empty-icon">📋</div><h3>Crea un proyecto primero</h3><p>Ve al Dashboard para crear un nuevo proyecto.</p><button class="btn btn-primary" onclick="App.navigate(\'dashboard\')">Ir al Dashboard</button></div>';
    const project = Storage.getProject();
    const tareas = (project.planProduccion && project.planProduccion.tareas) ? project.planProduccion.tareas : [];

    return `
      <div class="page-header">
        <h1><span class="header-icon">📋</span> Plan de Producción</h1>
        <p class="page-subtitle">Cronograma y checklist de tareas por departamento pre-rodaje (manual o desde PC)</p>
        <div class="page-header-actions">
          <button class="btn btn-secondary btn-sm" id="btnImportTareasCSV">📥 Cargar Tareas desde PC (.csv)</button>
          <input type="file" id="tareasCSVInput" accept="*/*" style="display:none">
          <button class="btn btn-primary btn-sm" id="btnAddTarea">+ Nueva Tarea</button>
        </div>
      </div>
      <div class="page-body">
        <div class="card mb-lg">
          <div class="flex justify-between items-center mb-md">
            <h3>📊 Resumen de Tareas</h3>
            <span class="tag tag-gold">${tareas.filter(t => t.estado === 'Completada').length} de ${tareas.length} completadas</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar-fill" style="width:${tareas.length ? (tareas.filter(t => t.estado === 'Completada').length / tareas.length * 100) : 0}%"></div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Listado de Tareas Pre-Producción</h3>
          </div>
          ${tareas.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">📋</div>
              <h3>Sin tareas</h3>
              <p>Agrega tareas manualmente o carga una planilla CSV desde tu PC.</p>
              <div class="flex gap-sm justify-center mt-md">
                <button class="btn btn-secondary btn-sm" onclick="document.getElementById('tareasCSVInput').click()">📥 Cargar CSV desde PC</button>
                <button class="btn btn-primary btn-sm" onclick="PlanProduccionModule.showTareaModal()">+ Crear Tarea Manual</button>
              </div>
            </div>
          ` : `
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width:40px"></th>
                    <th>Tarea</th>
                    <th>Departamento</th>
                    <th>Responsable</th>
                    <th>Fecha Límite</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${tareas.map((t, i) => `
                    <tr class="${t.estado === 'Completada' ? 'completed' : ''}">
                      <td>
                        <input type="checkbox" ${t.estado === 'Completada' ? 'checked' : ''} onchange="PlanProduccionModule.toggleState(${i})">
                      </td>
                      <td><strong>${t.titulo}</strong>${t.descripcion ? `<br><small class="text-muted">${t.descripcion}</small>` : ''}</td>
                      <td><span class="tag tag-neutral">${t.departamento || 'Producción'}</span></td>
                      <td>${t.responsable || '-'}</td>
                      <td style="font-size:0.85rem;color:var(--text-muted)">${App.formatDate(t.fechaLimite)}</td>
                      <td>
                        <span class="tag ${t.estado === 'Completada' ? 'tag-success' : (t.estado === 'En Progreso' ? 'tag-warning' : 'tag-neutral')}">
                          ${t.estado || 'Pendiente'}
                        </span>
                      </td>
                      <td>
                        <div class="cell-actions">
                          <button class="btn btn-ghost btn-sm btn-icon" onclick="PlanProduccionModule.showTareaModal(${i})">✏️</button>
                          <button class="btn btn-ghost btn-sm btn-icon" onclick="PlanProduccionModule.deleteTarea(${i})">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;
  },

  afterRender() {
    const btn = document.getElementById('btnAddTarea');
    if (btn) btn.addEventListener('click', () => this.showTareaModal());

    const btnCSV = document.getElementById('btnImportTareasCSV');
    const inputCSV = document.getElementById('tareasCSVInput');
    if (btnCSV && inputCSV) {
      btnCSV.addEventListener('click', () => inputCSV.click());
      inputCSV.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const lines = evt.target.result.split(/\r?\n/).filter(l => l.trim());
            const proj = Storage.getProject();
            if (!proj.planProduccion) proj.planProduccion = { tareas: [] };

            let count = 0;
            lines.forEach((line, idx) => {
              if (idx === 0 && line.toLowerCase().includes('tarea')) return;
              const cols = line.split(/[,;	]/).map(c => c.trim().replace(/^"/, '').replace(/"$/, ''));
              if (cols[0]) {
                proj.planProduccion.tareas.push({
                  titulo: cols[0],
                  departamento: cols[1] || 'Producción',
                  responsable: cols[2] || '',
                  fechaLimite: cols[3] || '',
                  estado: cols[4] || 'Pendiente',
                  descripcion: cols[5] || ''
                });
                count++;
              }
            });
            Storage.saveProject(proj);
            App.toast(`¡Se cargaron ${count} tareas desde la PC!`, 'success');
            App.navigate('plan-produccion');
          };
          reader.readAsText(file);
          e.target.value = '';
        }
      });
    }
  },

  showTareaModal(idx) {
    const project = Storage.getProject();
    const t = (idx !== undefined && project.planProduccion && project.planProduccion.tareas) ? project.planProduccion.tareas[idx] : {};

    App.showModal(`
      <div class="modal-header"><h2>${idx !== undefined ? 'Editar' : 'Nueva'} Tarea</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">Título de Tarea *</label><input class="form-input" id="tTitulo" value="${t.titulo || ''}" placeholder="Ej: Tramitar permisos de locación en plaza"></div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Departamento</label>
            <select class="form-select" id="tDept">
              <option ${t.departamento === 'Dirección' ? 'selected' : ''}>Dirección</option>
              <option ${t.departamento === 'Producción' ? 'selected' : ''} ${!t.departamento ? 'selected' : ''}>Producción</option>
              <option ${t.departamento === 'Fotografía' ? 'selected' : ''}>Fotografía</option>
              <option ${t.departamento === 'Arte' ? 'selected' : ''}>Arte</option>
              <option ${t.departamento === 'Sonido' ? 'selected' : ''}>Sonido</option>
              <option ${t.departamento === 'Vestuario/Maquillaje' ? 'selected' : ''}>Vestuario/Maquillaje</option>
              <option ${t.departamento === 'Logística' ? 'selected' : ''}>Logística</option>
              <option ${t.departamento === 'Legal/Permisos' ? 'selected' : ''}>Legal/Permisos</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Responsable</label><input class="form-input" id="tResp" value="${t.responsable || ''}" placeholder="Nombre de persona"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Fecha Límite</label><input class="form-input" type="date" id="tFecha" value="${t.fechaLimite || ''}"></div>
          <div class="form-group">
            <label class="form-label">Estado</label>
            <select class="form-select" id="tEstado">
              <option ${t.estado === 'Pendiente' ? 'selected' : ''} ${!t.estado ? 'selected' : ''}>Pendiente</option>
              <option ${t.estado === 'En Progreso' ? 'selected' : ''}>En Progreso</option>
              <option ${t.estado === 'Completada' ? 'selected' : ''}>Completada</option>
            </select>
          </div>
        </div>
        <div class="form-group"><label class="form-label">Notas Adicionales</label><textarea class="form-textarea" id="tDesc" style="min-height:70px">${t.descripcion || ''}</textarea></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary modal-close">Cancelar</button>
        <button class="btn btn-primary" id="btnSaveTarea">💾 Guardar Tarea</button>
      </div>
    `);

    document.getElementById('btnSaveTarea').addEventListener('click', () => {
      const titulo = document.getElementById('tTitulo').value.trim();
      if (!titulo) { App.toast('Ingresa un título para la tarea', 'warning'); return; }

      const data = {
        titulo,
        departamento: document.getElementById('tDept').value,
        responsable: document.getElementById('tResp').value,
        fechaLimite: document.getElementById('tFecha').value,
        estado: document.getElementById('tEstado').value,
        descripcion: document.getElementById('tDesc').value
      };

      const proj = Storage.getProject();
      if (!proj.planProduccion) proj.planProduccion = { tareas: [] };
      if (idx !== undefined) { proj.planProduccion.tareas[idx] = data; } else { proj.planProduccion.tareas.push(data); }
      Storage.saveProject(proj);
      App.closeModal();
      App.toast('Tarea guardada', 'success');
      App.navigate('plan-produccion');
    });
  },

  toggleState(idx) {
    const proj = Storage.getProject();
    const t = proj.planProduccion.tareas[idx];
    t.estado = t.estado === 'Completada' ? 'Pendiente' : 'Completada';
    Storage.saveProject(proj);
    App.navigate('plan-produccion');
  },

  deleteTarea(idx) {
    if (!confirm('¿Eliminar esta tarea?')) return;
    const proj = Storage.getProject();
    proj.planProduccion.tareas.splice(idx, 1);
    Storage.saveProject(proj);
    App.toast('Tarea eliminada', 'warning');
    App.navigate('plan-produccion');
  }
};

App.registerModule('plan-produccion', PlanProduccionModule);
