/* CinePrep - Guion Técnico Module (con Carga CSV) */
const GuionTecnicoModule = {
  render() {
    if (!App.requireProject()) return '<div class="empty-state"><div class="empty-icon">🎥</div><h3>Crea un proyecto primero</h3><p>Ve al Dashboard para crear un nuevo proyecto.</p><button class="btn btn-primary" onclick="App.navigate(\'dashboard\')">Ir al Dashboard</button></div>';
    const project = Storage.getProject();
    const planos = (project.guionTecnico && project.guionTecnico.planos) ? project.guionTecnico.planos : [];

    return `
      <div class="page-header">
        <h1><span class="header-icon">🎥</span> Guión Técnico</h1>
        <p class="page-subtitle">Desglose plano a plano con encuadre, movimiento, lente y opción de carga desde PC (.csv)</p>
        <div class="page-header-actions">
          <button class="btn btn-secondary btn-sm" id="btnImportGTCsv">📥 Cargar Planos desde PC (.csv)</button>
          <input type="file" id="gtCsvInput" accept="*/*" style="display:none">
          <button class="btn btn-primary btn-sm" id="btnAddPlano">+ Agregar Plano</button>
        </div>
      </div>
      <div class="page-body">
        <div class="card">
          <div class="table-container">
            <table class="data-table tech-script-table">
              <thead>
                <tr>
                  <th style="width:60px">Esc.</th>
                  <th style="width:60px">Plano</th>
                  <th>Tipo de Plano</th>
                  <th>Ángulo</th>
                  <th>Movimiento</th>
                  <th style="width:80px">Lente</th>
                  <th>Descripción Visual</th>
                  <th>Audio / Diálogo</th>
                  <th style="width:70px">Seg.</th>
                  <th style="width:80px">Acciones</th>
                </tr>
              </thead>
              <tbody id="planosBody">
                ${this.renderPlanos(planos)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  renderPlanos(planos) {
    if (planos.length === 0) {
      return `<tr><td colspan="10" class="empty-state" style="padding:var(--space-xl)"><div class="empty-icon">🎥</div><p>No hay planos definidos en el guión técnico.</p><div class="flex gap-sm justify-center"><button class="btn btn-sm btn-secondary" onclick="document.getElementById('gtCsvInput').click()">📥 Cargar CSV desde PC</button><button class="btn btn-sm btn-primary" onclick="GuionTecnicoModule.showPlanoModal()">+ Agregar Primer Plano</button></div></td></tr>`;
    }
    return planos.map((p, i) => `
      <tr>
        <td><strong class="text-gold">${p.escena || '1'}</strong></td>
        <td><strong>${p.plano || i + 1}</strong></td>
        <td><span class="tag tag-gold">${p.tipoPlano || 'PM'}</span></td>
        <td>${p.angulo || 'Normal'}</td>
        <td>${p.movimiento || 'Fijo'}</td>
        <td>${p.lente || '50mm'}</td>
        <td style="max-width:200px">${p.descripcion || '-'}</td>
        <td style="max-width:180px">${p.audio || '-'}</td>
        <td>${p.duracion ? p.duracion + 's' : '-'}</td>
        <td>
          <div class="cell-actions">
            <button class="btn btn-ghost btn-sm btn-icon" onclick="GuionTecnicoModule.showPlanoModal(${i})">✏️</button>
            <button class="btn btn-ghost btn-sm btn-icon" onclick="GuionTecnicoModule.deletePlano(${i})">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  afterRender() {
    const btn = document.getElementById('btnAddPlano');
    if (btn) btn.addEventListener('click', () => this.showPlanoModal());

    const btnCsv = document.getElementById('btnImportGTCsv');
    const inputCsv = document.getElementById('gtCsvInput');
    if (btnCsv && inputCsv) {
      btnCsv.addEventListener('click', () => inputCsv.click());
      inputCsv.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const lines = evt.target.result.split(/\r?\n/).filter(l => l.trim());
            const proj = Storage.getProject();
            if (!proj.guionTecnico) proj.guionTecnico = { planos: [] };

            let count = 0;
            lines.forEach((line, idx) => {
              if (idx === 0 && line.toLowerCase().includes('escena')) return;
              const cols = line.split(/[,;	]/).map(c => c.trim().replace(/^"/, '').replace(/"$/, ''));
              if (cols.length >= 2) {
                proj.guionTecnico.planos.push({
                  escena: cols[0] || '1',
                  plano: cols[1] || (proj.guionTecnico.planos.length + 1),
                  tipoPlano: cols[2] || 'PM',
                  angulo: cols[3] || 'Normal',
                  movimiento: cols[4] || 'Fijo',
                  lente: cols[5] || '50mm',
                  descripcion: cols[6] || '',
                  audio: cols[7] || '',
                  duracion: cols[8] || ''
                });
                count++;
              }
            });
            Storage.saveProject(proj);
            App.toast(`¡Se cargaron ${count} planos desde el archivo CSV!`, 'success');
            App.navigate('guion-tecnico');
          };
          reader.readAsText(file);
          e.target.value = '';
        }
      });
    }
  },

  showPlanoModal(idx) {
    const project = Storage.getProject();
    const p = (idx !== undefined && project.guionTecnico && project.guionTecnico.planos) ? project.guionTecnico.planos[idx] : {};
    
    App.showModal(`
      <div class="modal-header"><h2>${idx !== undefined ? 'Editar' : 'Nuevo'} Plano Técnico</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Nº Escena</label><input class="form-input" id="planoEscena" value="${p.escena || '1'}"></div>
          <div class="form-group"><label class="form-label">Nº Plano</label><input class="form-input" id="planoNumero" value="${p.plano || ''}"></div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Tipo de Plano</label>
            <select class="form-select" id="planoTipo">
              <option ${p.tipoPlano === 'GPE (Gran Plano General)' ? 'selected' : ''}>GPE (Gran Plano General)</option>
              <option ${p.tipoPlano === 'PG (Plano General)' ? 'selected' : ''}>PG (Plano General)</option>
              <option ${p.tipoPlano === 'PE (Plano Entero)' ? 'selected' : ''}>PE (Plano Entero)</option>
              <option ${p.tipoPlano === 'PA (Plano Americano)' ? 'selected' : ''}>PA (Plano Americano)</option>
              <option ${p.tipoPlano === 'PM (Plano Medio)' ? 'selected' : ''} ${!p.tipoPlano ? 'selected' : ''}>PM (Plano Medio)</option>
              <option ${p.tipoPlano === 'PMC (Plano Medio Corto)' ? 'selected' : ''}>PMC (Plano Medio Corto)</option>
              <option ${p.tipoPlano === 'PP (Primer Plano)' ? 'selected' : ''}>PP (Primer Plano)</option>
              <option ${p.tipoPlano === 'PPP (Primerísimo Primer Plano)' ? 'selected' : ''}>PPP (Primerísimo Primer Plano)</option>
              <option ${p.tipoPlano === 'PD (Plano Detalle)' ? 'selected' : ''}>PD (Plano Detalle)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Ángulo de Cámara</label>
            <select class="form-select" id="planoAngulo">
              <option ${p.angulo === 'Normal / Neutro' ? 'selected' : ''} ${!p.angulo ? 'selected' : ''}>Normal / Neutro</option>
              <option ${p.angulo === 'Picado' ? 'selected' : ''}>Picado</option>
              <option ${p.angulo === 'Cenital' ? 'selected' : ''}>Cenital</option>
              <option ${p.angulo === 'Contrapicado' ? 'selected' : ''}>Contrapicado</option>
              <option ${p.angulo === 'Nadir' ? 'selected' : ''}>Nadir</option>
              <option ${p.angulo === 'Holandés / Aberrante' ? 'selected' : ''}>Holandés / Aberrante</option>
              <option ${p.angulo === 'Subjetiva' ? 'selected' : ''}>Subjetiva</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Movimiento</label>
            <select class="form-select" id="planoMov">
              <option ${p.movimiento === 'Fijo / Estático' ? 'selected' : ''} ${!p.movimiento ? 'selected' : ''}>Fijo / Estático</option>
              <option ${p.movimiento === 'Panorámica (Pan)' ? 'selected' : ''}>Panorámica (Pan)</option>
              <option ${p.movimiento === 'Tilteo (Tilt)' ? 'selected' : ''}>Tilteo (Tilt)</option>
              <option ${p.movimiento === 'Travelling In / Out' ? 'selected' : ''}>Travelling In / Out</option>
              <option ${p.movimiento === 'Camera Car / Steadicam' ? 'selected' : ''}>Camera Car / Steadicam</option>
              <option ${p.movimiento === 'Cámara en Mano' ? 'selected' : ''}>Cámara en Mano</option>
              <option ${p.movimiento === 'Zoom In / Out' ? 'selected' : ''}>Zoom In / Out</option>
              <option ${p.movimiento === 'Grúa / Drone' ? 'selected' : ''}>Grúa / Drone</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Lente</label><input class="form-input" id="planoLente" value="${p.lente || '50mm'}" placeholder="24mm, 35mm, 50mm, 85mm..."></div>
          <div class="form-group"><label class="form-label">Duración (seg)</label><input class="form-input" type="number" id="planoDur" value="${p.duracion || ''}" placeholder="3"></div>
        </div>
        <div class="form-group"><label class="form-label">Descripción Visual / Acción</label><textarea class="form-textarea" id="planoDesc" style="min-height:70px">${p.descripcion || ''}</textarea></div>
        <div class="form-group"><label class="form-label">Audio / Diálogo / Música</label><textarea class="form-textarea" id="planoAudio" style="min-height:60px">${p.audio || ''}</textarea></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary modal-close">Cancelar</button>
        <button class="btn btn-primary" id="btnSavePlano">💾 Guardar Plano</button>
      </div>
    `, 'lg');

    document.getElementById('btnSavePlano').addEventListener('click', () => {
      const data = {
        escena: document.getElementById('planoEscena').value,
        plano: document.getElementById('planoNumero').value,
        tipoPlano: document.getElementById('planoTipo').value,
        angulo: document.getElementById('planoAngulo').value,
        movimiento: document.getElementById('planoMov').value,
        lente: document.getElementById('planoLente').value,
        duracion: document.getElementById('planoDur').value,
        descripcion: document.getElementById('planoDesc').value,
        audio: document.getElementById('planoAudio').value
      };

      const proj = Storage.getProject();
      if (!proj.guionTecnico) proj.guionTecnico = { planos: [] };
      if (idx !== undefined) { proj.guionTecnico.planos[idx] = data; } else { proj.guionTecnico.planos.push(data); }
      Storage.saveProject(proj);
      App.closeModal();
      App.toast('Plano guardado', 'success');
      App.navigate('guion-tecnico');
    });
  },

  deletePlano(idx) {
    if (!confirm('¿Eliminar este plano?')) return;
    const proj = Storage.getProject();
    proj.guionTecnico.planos.splice(idx, 1);
    Storage.saveProject(proj);
    App.toast('Plano eliminado', 'warning');
    App.navigate('guion-tecnico');
  }
};

App.registerModule('guion-tecnico', GuionTecnicoModule);
