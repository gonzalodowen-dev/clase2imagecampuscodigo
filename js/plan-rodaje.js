/* CinePrep - Plan de Rodaje (Shooting Schedule) Module (con Carga de Archivos desde PC) */
const PlanRodajeModule = {
  render() {
    if (!App.requireProject()) return '<div class="empty-state"><div class="empty-icon">📅</div><h3>Crea un proyecto primero</h3><p>Ve al Dashboard para crear un nuevo proyecto.</p><button class="btn btn-primary" onclick="App.navigate(\'dashboard\')">Ir al Dashboard</button></div>';
    const project = Storage.getProject();
    const dias = (project.planRodaje && project.planRodaje.dias) ? project.planRodaje.dias : [];

    return `
      <div class="page-header">
        <h1><span class="header-icon">📅</span> Plan de Rodaje (Shooting Schedule)</h1>
        <p class="page-subtitle">Organización cronológica día por día de filmación (manual o importando desde PC)</p>
        <div class="page-header-actions">
          <button class="btn btn-secondary btn-sm" id="btnImportRodajeCSV">📥 Cargar Plan de Rodaje desde PC (.csv)</button>
          <input type="file" id="rodajeCSVInput" accept="*/*" style="display:none">
          <button class="btn btn-primary btn-sm" onclick="PlanRodajeModule.showDiaRodajeModal()">+ Agregar Día de Rodaje</button>
        </div>
      </div>
      <div class="page-body">
        ${dias.length === 0 ? `
          <div class="empty-state card">
            <div class="empty-icon">📅</div>
            <h3>Sin plan de rodaje</h3>
            <p>Crea la citación y esquema de rodaje por día manualmente o cargando una planilla CSV desde tu PC.</p>
            <div class="flex gap-sm justify-center mt-md">
              <button class="btn btn-secondary btn-sm" onclick="document.getElementById('rodajeCSVInput').click()">📥 Cargar CSV desde PC</button>
              <button class="btn btn-primary btn-sm" onclick="PlanRodajeModule.showDiaRodajeModal()">+ Crear Día 1 Manual</button>
            </div>
          </div>
        ` : `
          <div>
            ${dias.map((d, dIdx) => `
              <div class="shooting-day">
                <div class="shooting-day-header">
                  <div class="day-title">
                    <span>🎬 DÍA ${d.diaNumero || dIdx + 1}</span>
                    <span style="font-weight:normal;font-size:0.88rem;color:var(--text-muted)">— ${d.locacion || 'Locación N/I'}</span>
                  </div>
                  <div class="flex items-center gap-md">
                    <span class="day-date">📅 ${App.formatDate(d.fecha)} | ⏰ Citación: ${d.callTime || '08:00'}</span>
                    <button class="btn btn-ghost btn-sm btn-icon" onclick="PlanRodajeModule.showDiaRodajeModal(${dIdx})">✏️</button>
                    <button class="btn btn-ghost btn-sm btn-icon" onclick="PlanRodajeModule.deleteDiaRodaje(${dIdx})">🗑️</button>
                  </div>
                </div>
                <div class="shooting-day-body">
                  <div class="flex justify-between items-center mb-sm">
                    <h4 style="font-size:0.85rem;color:var(--text-muted);text-transform:uppercase">Escenas a Filmar</h4>
                    <button class="btn btn-sm btn-secondary" onclick="PlanRodajeModule.showEscenaModal(${dIdx})">+ Agregar Escena</button>
                  </div>
                  ${(d.escenas || []).length === 0 ? `
                    <div style="font-size:0.82rem;color:var(--text-muted);padding:var(--space-sm) 0">Sin escenas asignadas a este día.</div>
                  ` : `
                    <div class="table-container">
                      <table class="data-table">
                        <thead>
                          <tr>
                            <th>Horario</th>
                            <th>Escena</th>
                            <th>INT/EXT</th>
                            <th>Locación / Set</th>
                            <th>Elenco Convocado</th>
                            <th>Páginas</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${d.escenas.map((e, eIdx) => `
                            <tr>
                              <td style="color:var(--accent-gold);font-weight:600;font-size:0.82rem">${e.horario || '-'}</td>
                              <td><strong>Escena ${e.numero}</strong></td>
                              <td><span class="tag tag-neutral">${e.tipo || 'INT'}</span></td>
                              <td>${e.locacion || '-'}</td>
                              <td style="font-size:0.82rem;color:var(--accent-gold-light)">${e.elenco || '-'}</td>
                              <td>${e.paginas || '1/8'}</td>
                              <td>
                                <div class="cell-actions">
                                  <button class="btn btn-ghost btn-sm btn-icon" onclick="PlanRodajeModule.deleteEscena(${dIdx}, ${eIdx})">🗑️</button>
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
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  afterRender() {
    const btnCSV = document.getElementById('btnImportRodajeCSV');
    const inputCSV = document.getElementById('rodajeCSVInput');
    if (btnCSV && inputCSV) {
      btnCSV.addEventListener('click', () => inputCSV.click());
      inputCSV.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const lines = evt.target.result.split(/\r?\n/).filter(l => l.trim());
            const proj = Storage.getProject();
            if (!proj.planRodaje) proj.planRodaje = { dias: [] };
            if (!proj.planRodaje.dias) proj.planRodaje.dias = [];

            let count = 0;
            lines.forEach((line, idx) => {
              if (idx === 0 && line.toLowerCase().includes('dia')) return;
              const cols = line.split(/[,;	]/).map(c => c.trim().replace(/^"/, '').replace(/"$/, ''));
              if (cols.length >= 2) {
                proj.planRodaje.dias.push({
                  diaNumero: cols[0] || (proj.planRodaje.dias.length + 1),
                  fecha: cols[1] || '',
                  locacion: cols[2] || 'Locación Principal',
                  callTime: cols[3] || '08:00',
                  notas: cols[4] || '',
                  escenas: []
                });
                count++;
              }
            });
            Storage.saveProject(proj);
            App.toast(`¡Se cargaron ${count} días de rodaje desde el archivo de tu PC!`, 'success');
            App.navigate('plan-rodaje');
          };
          reader.readAsText(file);
          e.target.value = '';
        }
      });
    }
  },

  showDiaRodajeModal(idx) {
    const proj = Storage.getProject();
    const list = (proj.planRodaje && proj.planRodaje.dias) ? proj.planRodaje.dias : [];
    const d = idx !== undefined ? list[idx] : {};

    App.showModal(`
      <div class="modal-header"><h2>${idx !== undefined ? 'Editar' : 'Nuevo'} Día de Rodaje</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Nº Día</label><input class="form-input" id="rDiaNum" value="${d.diaNumero || (list.length + 1)}"></div>
          <div class="form-group"><label class="form-label">Fecha de Rodaje</label><input class="form-input" type="date" id="rDiaFecha" value="${d.fecha || ''}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Locación Principal</label><input class="form-input" id="rDiaLoc" value="${d.locacion || ''}" placeholder="Ej: Estudio Central / Casa Mansilla"></div>
          <div class="form-group"><label class="form-label">Call Time (Hora Citación Crew)</label><input class="form-input" type="time" id="rDiaCall" value="${d.callTime || '07:30'}"></div>
        </div>
        <div class="form-group"><label class="form-label">Notas del Día / Clima / Requerimientos</label><textarea class="form-textarea" id="rDiaNotas" style="min-height:60px">${d.notas || ''}</textarea></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary modal-close">Cancelar</button>
        <button class="btn btn-primary" id="btnSaveDiaRod">💾 Guardar Día</button>
      </div>
    `);

    document.getElementById('btnSaveDiaRod').addEventListener('click', () => {
      const data = {
        diaNumero: document.getElementById('rDiaNum').value,
        fecha: document.getElementById('rDiaFecha').value,
        locacion: document.getElementById('rDiaLoc').value,
        callTime: document.getElementById('rDiaCall').value,
        notas: document.getElementById('rDiaNotas').value,
        escenas: d.escenas || []
      };

      if (!proj.planRodaje) proj.planRodaje = { dias: [] };
      if (idx !== undefined) { proj.planRodaje.dias[idx] = data; } else { proj.planRodaje.dias.push(data); }
      Storage.saveProject(proj);
      App.closeModal();
      App.toast('Día de rodaje guardado', 'success');
      App.navigate('plan-rodaje');
    });
  },

  deleteDiaRodaje(idx) {
    if (!confirm('¿Eliminar este día de rodaje?')) return;
    const proj = Storage.getProject();
    proj.planRodaje.dias.splice(idx, 1);
    Storage.saveProject(proj);
    App.toast('Día eliminado', 'warning');
    App.navigate('plan-rodaje');
  },

  showEscenaModal(dIdx) {
    const proj = Storage.getProject();
    const dia = proj.planRodaje.dias[dIdx];

    App.showModal(`
      <div class="modal-header"><h2>Agregar Escena a Día ${dia.diaNumero || (dIdx + 1)}</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Horario Previsto</label><input class="form-input" id="eHora" placeholder="09:00 - 11:30"></div>
          <div class="form-group"><label class="form-label">Nº Escena *</label><input class="form-input" id="eNum" placeholder="Ej: 4"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">INT / EXT</label><input class="form-input" id="eTipo" placeholder="INT / EXT"></div>
          <div class="form-group"><label class="form-label">Páginas</label><input class="form-input" id="ePag" placeholder="Ej: 2 4/8"></div>
        </div>
        <div class="form-group"><label class="form-label">Locación Específica</label><input class="form-input" id="eLoc" placeholder="Ej: Habitación de Lucas"></div>
        <div class="form-group"><label class="form-label">Elenco Convocado</label><input class="form-input" id="eElenco" placeholder="Ej: LUCAS (1), SOFIA (2)"></div>
      </div>
      <div class="modal-footer"><button class="btn btn-secondary modal-close">Cancelar</button><button class="btn btn-primary" id="btnSaveEscRod">Guardar Escena</button></div>
    `);

    document.getElementById('btnSaveEscRod').addEventListener('click', () => {
      const numero = document.getElementById('eNum').value.trim();
      if (!numero) return;

      const data = {
        horario: document.getElementById('eHora').value,
        numero,
        tipo: document.getElementById('eTipo').value,
        paginas: document.getElementById('ePag').value,
        locacion: document.getElementById('eLoc').value,
        elenco: document.getElementById('eElenco').value
      };

      if (!dia.escenas) dia.escenas = [];
      dia.escenas.push(data);
      Storage.saveProject(proj);
      App.closeModal();
      App.navigate('plan-rodaje');
    });
  },

  deleteEscena(dIdx, eIdx) {
    const proj = Storage.getProject();
    proj.planRodaje.dias[dIdx].escenas.splice(eIdx, 1);
    Storage.saveProject(proj);
    App.navigate('plan-rodaje');
  }
};

App.registerModule('plan-rodaje', PlanRodajeModule);
