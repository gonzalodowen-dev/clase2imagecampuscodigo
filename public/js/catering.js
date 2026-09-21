/* CinePrep - Catering & Compras Module (con Carga de Archivos desde PC) */
const CateringModule = {
  render() {
    if (!App.requireProject()) return '<div class="empty-state"><div class="empty-icon">🍽️</div><h3>Crea un proyecto primero</h3><p>Ve al Dashboard para crear un nuevo proyecto.</p><button class="btn btn-primary" onclick="App.navigate(\'dashboard\')">Ir al Dashboard</button></div>';
    const project = Storage.getProject();
    const cat = project.catering || { dias: [], restricciones: [], proveedores: [] };

    return `
      <div class="page-header">
        <h1><span class="header-icon">🍽️</span> Compras de Catering y Alimentación</h1>
        <p class="page-subtitle">Planificación de comidas, raciones, restricciones dietarias y compras por día (manual o importando desde PC)</p>
        <div class="page-header-actions">
          <button class="btn btn-secondary btn-sm" id="btnImportCateringCSV">📥 Cargar Catering desde PC (.csv, .txt)</button>
          <input type="file" id="cateringCSVInput" accept="*/*" style="display:none">
          <button class="btn btn-primary btn-sm" onclick="CateringModule.showDiaModal()">+ Planificar Día de Comida</button>
        </div>
      </div>
      <div class="page-body">
        <div class="grid-3 mb-xl">
          <div class="card">
            <div class="card-header"><h3>⚠️ Restricciones Dietarias</h3><button class="btn btn-ghost btn-sm btn-icon" onclick="CateringModule.showRestriccionModal()">+</button></div>
            ${(cat.restricciones || []).length === 0 ? `<div class="text-muted text-sm">Sin restricciones registradas.</div>` : `
              <ul style="list-style:none;font-size:0.85rem">
                ${cat.restricciones.map((r, i) => `<li class="flex justify-between items-center mb-xs"><span>🍎 <strong>${r.persona}</strong>: ${r.tipo}</span><button class="btn btn-ghost btn-sm btn-icon" onclick="CateringModule.deleteRestriccion(${i})">🗑️</button></li>`).join('')}
              </ul>
            `}
          </div>

          <div class="card">
            <div class="card-header"><h3>🏬 Proveedores de Catering</h3><button class="btn btn-ghost btn-sm btn-icon" onclick="CateringModule.showProvModal()">+</button></div>
            ${(cat.proveedores || []).length === 0 ? `<div class="text-muted text-sm">Sin proveedores registrados.</div>` : `
              <ul style="list-style:none;font-size:0.85rem">
                ${cat.proveedores.map((p, i) => `<li class="flex justify-between items-center mb-xs"><span>🏬 <strong>${p.nombre}</strong> (${p.telefono || 'Sin tel'})</span><button class="btn btn-ghost btn-sm btn-icon" onclick="CateringModule.deleteProv(${i})">🗑️</button></li>`).join('')}
              </ul>
            `}
          </div>

          <div class="card card-accent">
            <div class="card-header"><h3>📊 Resumen Alimentación</h3></div>
            <div style="font-size:0.9rem">
              <div>Total Días Planificados: <strong>${(cat.dias || []).length}</strong></div>
              <div>Restricciones Especiales: <strong>${(cat.restricciones || []).length}</strong></div>
            </div>
          </div>
        </div>

        <h3 class="mb-md">📅 Menú y Raciones por Día de Rodaje</h3>
        ${(cat.dias || []).length === 0 ? `
          <div class="empty-state card">
            <div class="empty-icon">🍽️</div>
            <h3>Sin plan de catering por día</h3>
            <p>Planifica desayunos, almuerzos, meriendas y cenas creando días manualmente o cargando una planilla CSV desde tu PC.</p>
            <div class="flex gap-sm justify-center mt-md">
              <button class="btn btn-secondary btn-sm" onclick="document.getElementById('cateringCSVInput').click()">📥 Cargar CSV desde PC</button>
              <button class="btn btn-primary btn-sm" onclick="CateringModule.showDiaModal()">+ Planificar Día Manual</button>
            </div>
          </div>
        ` : `
          <div class="grid-2">
            ${cat.dias.map((d, i) => `
              <div class="meal-card">
                <div class="flex justify-between items-center mb-sm">
                  <h4 style="color:var(--accent-gold-light)">Día ${d.diaNumero || i + 1} (${App.formatDate(d.fecha)})</h4>
                  <div class="cell-actions">
                    <button class="btn btn-ghost btn-sm btn-icon" onclick="CateringModule.showDiaModal(${i})">✏️</button>
                    <button class="btn btn-ghost btn-sm btn-icon" onclick="CateringModule.deleteDia(${i})">🗑️</button>
                  </div>
                </div>
                <div class="meal-details">
                  <div>👥 Personas a alimentar: <strong>${d.cantPersonas || 0}</strong></div>
                  <div class="mt-xs">☕ <strong>Desayuno:</strong> ${d.desayuno || '-'}</div>
                  <div class="mt-xs">🍲 <strong>Almuerzo:</strong> ${d.almuerzo || '-'}</div>
                  <div class="mt-xs">🥪 <strong>Merienda:</strong> ${d.merienda || '-'}</div>
                  <div class="mt-xs">🍕 <strong>Cena:</strong> ${d.cena || '-'}</div>
                  ${d.costoEstimado ? `<div class="mt-sm text-gold"><strong>Costo Est.: ${App.formatCurrency(d.costoEstimado)}</strong></div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  afterRender() {
    const btnCSV = document.getElementById('btnImportCateringCSV');
    const inputCSV = document.getElementById('cateringCSVInput');
    if (btnCSV && inputCSV) {
      btnCSV.addEventListener('click', () => inputCSV.click());
      inputCSV.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const lines = evt.target.result.split(/\r?\n/).filter(l => l.trim());
            const proj = Storage.getProject();
            if (!proj.catering) proj.catering = { dias: [], restricciones: [], proveedores: [] };
            if (!proj.catering.dias) proj.catering.dias = [];

            let count = 0;
            lines.forEach((line, idx) => {
              if (idx === 0 && (line.toLowerCase().includes('dia') || line.toLowerCase().includes('fecha'))) return;
              const cols = line.split(/[,;	]/).map(c => c.trim().replace(/^"/, '').replace(/"$/, ''));
              if (cols.length >= 2) {
                proj.catering.dias.push({
                  diaNumero: cols[0] || (proj.catering.dias.length + 1),
                  fecha: cols[1] || '',
                  cantPersonas: parseInt(cols[2]) || 20,
                  desayuno: cols[3] || '',
                  almuerzo: cols[4] || '',
                  merienda: cols[5] || '',
                  cena: cols[6] || '',
                  costoEstimado: parseFloat(cols[7]) || 0
                });
                count++;
              }
            });
            Storage.saveProject(proj);
            App.toast(`¡Se cargaron ${count} días de catering desde el archivo de la PC!`, 'success');
            App.navigate('catering');
          };
          reader.readAsText(file);
          e.target.value = '';
        }
      });
    }
  },

  showDiaModal(idx) {
    const project = Storage.getProject();
    const cat = project.catering || { dias: [] };
    const d = idx !== undefined ? cat.dias[idx] : {};

    App.showModal(`
      <div class="modal-header"><h2>${idx !== undefined ? 'Editar' : 'Nuevo'} Día de Catering</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Nº Día de Rodaje</label><input class="form-input" id="cDiaNum" value="${d.diaNumero || '1'}"></div>
          <div class="form-group"><label class="form-label">Fecha</label><input class="form-input" type="date" id="cFecha" value="${d.fecha || ''}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Cantidad de Personas</label><input class="form-input" type="number" id="cCant" value="${d.cantPersonas || 20}"></div>
          <div class="form-group"><label class="form-label">Costo Estimado ($)</label><input class="form-input" type="number" id="cCosto" value="${d.costoEstimado || 0}"></div>
        </div>
        <div class="form-group"><label class="form-label">Desayuno / Call Time</label><input class="form-input" id="cDesayuno" value="${d.desayuno || ''}" placeholder="Café, facturas, fruta..."></div>
        <div class="form-group"><label class="form-label">Almuerzo / Plato Principal</label><input class="form-input" id="cAlmuerzo" value="${d.almuerzo || ''}" placeholder="Menú general + Opción Veggie"></div>
        <div class="form-group"><label class="form-label">Merienda / Snack de Tarde</label><input class="form-input" id="cMerienda" value="${d.merienda || ''}"></div>
        <div class="form-group"><label class="form-label">Cena (si aplica)</label><input class="form-input" id="cCena" value="${d.cena || ''}"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary modal-close">Cancelar</button>
        <button class="btn btn-primary" id="btnSaveDiaCat">💾 Guardar Día</button>
      </div>
    `);

    document.getElementById('btnSaveDiaCat').addEventListener('click', () => {
      const data = {
        diaNumero: document.getElementById('cDiaNum').value,
        fecha: document.getElementById('cFecha').value,
        cantPersonas: document.getElementById('cCant').value,
        costoEstimado: document.getElementById('cCosto').value,
        desayuno: document.getElementById('cDesayuno').value,
        almuerzo: document.getElementById('cAlmuerzo').value,
        merienda: document.getElementById('cMerienda').value,
        cena: document.getElementById('cCena').value
      };

      const proj = Storage.getProject();
      if (!proj.catering) proj.catering = { dias: [], restricciones: [], proveedores: [] };
      if (!proj.catering.dias) proj.catering.dias = [];
      if (idx !== undefined) { proj.catering.dias[idx] = data; } else { proj.catering.dias.push(data); }
      Storage.saveProject(proj);
      App.closeModal();
      App.toast('Día guardado', 'success');
      App.navigate('catering');
    });
  },

  deleteDia(idx) {
    if (!confirm('¿Eliminar este día de catering?')) return;
    const proj = Storage.getProject();
    proj.catering.dias.splice(idx, 1);
    Storage.saveProject(proj);
    App.toast('Día eliminado', 'warning');
    App.navigate('catering');
  },

  showRestriccionModal() {
    App.showModal(`
      <div class="modal-header"><h2>Nueva Restricción Dietaria</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">Nombre de la persona</label><input class="form-input" id="rPersona" placeholder="Ej: María López (Sonidista)"></div>
        <div class="form-group"><label class="form-label">Tipo de restricción</label><input class="form-input" id="rTipo" placeholder="Ej: Vegetariana, Celíaca, Sin lactosa, Alergia al maní"></div>
      </div>
      <div class="modal-footer"><button class="btn btn-secondary modal-close">Cancelar</button><button class="btn btn-primary" id="btnSaveRestr">Guardar</button></div>
    `);

    document.getElementById('btnSaveRestr').addEventListener('click', () => {
      const persona = document.getElementById('rPersona').value.trim();
      const tipo = document.getElementById('rTipo').value.trim();
      if (!persona) return;

      const proj = Storage.getProject();
      if (!proj.catering.restricciones) proj.catering.restricciones = [];
      proj.catering.restricciones.push({ persona, tipo });
      Storage.saveProject(proj);
      App.closeModal();
      App.navigate('catering');
    });
  },

  deleteRestriccion(idx) {
    const proj = Storage.getProject();
    proj.catering.restricciones.splice(idx, 1);
    Storage.saveProject(proj);
    App.navigate('catering');
  },

  showProvModal() {
    App.showModal(`
      <div class="modal-header"><h2>Nuevo Proveedor de Catering</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">Nombre del proveedor</label><input class="form-input" id="pvNombre"></div>
        <div class="form-group"><label class="form-label">Teléfono / Contacto</label><input class="form-input" id="pvTel"></div>
      </div>
      <div class="modal-footer"><button class="btn btn-secondary modal-close">Cancelar</button><button class="btn btn-primary" id="btnSaveProv">Guardar</button></div>
    `);

    document.getElementById('btnSaveProv').addEventListener('click', () => {
      const nombre = document.getElementById('pvNombre').value.trim();
      if (!nombre) return;
      const proj = Storage.getProject();
      if (!proj.catering.proveedores) proj.catering.proveedores = [];
      proj.catering.proveedores.push({ nombre, telefono: document.getElementById('pvTel').value });
      Storage.saveProject(proj);
      App.closeModal();
      App.navigate('catering');
    });
  },

  deleteProv(idx) {
    const proj = Storage.getProject();
    proj.catering.proveedores.splice(idx, 1);
    Storage.saveProject(proj);
    App.navigate('catering');
  }
};

App.registerModule('catering', CateringModule);
