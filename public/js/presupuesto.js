/* CinePrep - Presupuesto Module (con Importación Nativa de Excel .xlsx, .xls y .csv) */
const PresupuestoModule = {
  render() {
    if (!App.requireProject()) return '<div class="empty-state"><div class="empty-icon">💰</div><h3>Crea un proyecto primero</h3><p>Ve al Dashboard para crear un nuevo proyecto.</p><button class="btn btn-primary" onclick="App.navigate(\'dashboard\')">Ir al Dashboard</button></div>';
    const project = Storage.getProject();
    const p = project.presupuesto || { moneda: 'ARS', areas: [] };
    
    if (!p.areas || p.areas.length === 0) {
      p.areas = [
        { id: 'produccion', nombre: 'Producción', items: [], expanded: true },
        { id: 'direccion', nombre: 'Dirección y Guion', items: [], expanded: true },
        { id: 'elenco', nombre: 'Elenco', items: [], expanded: true },
        { id: 'equipo', nombre: 'Equipo Técnico', items: [], expanded: true },
        { id: 'fotografia', nombre: 'Fotografía', items: [], expanded: true },
        { id: 'arte', nombre: 'Arte y Escenografía', items: [], expanded: true },
        { id: 'sonido', nombre: 'Sonido', items: [], expanded: true },
        { id: 'locaciones', nombre: 'Locaciones', items: [], expanded: true },
        { id: 'transporte', nombre: 'Transporte y Catering', items: [], expanded: true },
        { id: 'postproduccion', nombre: 'Post-producción', items: [], expanded: true },
        { id: 'contingencia', nombre: 'Contingencia', items: [], expanded: true }
      ];
      Storage.saveProject(project);
    }

    const areas = p.areas;

    let granTotal = 0;
    const totalsByArea = {};
    areas.forEach(area => {
      let areaTotal = 0;
      (area.items || []).forEach(item => {
        const itemTotal = (parseFloat(item.cantidad) || 1) * (parseFloat(item.precioUnitario) || 0);
        areaTotal += itemTotal;
      });
      totalsByArea[area.id] = areaTotal;
      granTotal += areaTotal;
    });

    return `
      <div class="page-header">
        <h1><span class="header-icon">💰</span> Presupuesto General y por Áreas</h1>
        <p class="page-subtitle">Desglose económico con soporte nativo para importar planillas Excel (.xlsx, .xls) y CSV</p>
        <div class="page-header-actions">
          <button class="btn btn-primary btn-sm" id="btnTopAddRubro">+ Agregar Nuevo Rubro</button>
          <button class="btn btn-secondary btn-sm" id="btnTopAddArea">+ Crear Nueva Área</button>
          <button class="btn btn-secondary btn-sm" id="btnImportBudgetFile">📥 Cargar Excel / CSV desde PC (.xlsx, .xls, .csv)</button>
          <input type="file" id="budgetFileInput" accept="*/*" style="display:none">
          <select class="form-select" id="currencySelect" style="width:auto">
            <option value="ARS" ${p.moneda === 'ARS' ? 'selected' : ''}>ARS ($)</option>
            <option value="USD" ${p.moneda === 'USD' ? 'selected' : ''}>USD ($)</option>
            <option value="EUR" ${p.moneda === 'EUR' ? 'selected' : ''}>EUR (€)</option>
          </select>
        </div>
      </div>
      <div class="page-body">
        <div class="card mb-lg card-accent">
          <div class="flex justify-between items-center">
            <div>
              <span class="text-muted text-xs" style="text-transform:uppercase;letter-spacing:0.05em">Presupuesto Total Estimado</span>
              <h2 style="font-size:2.4rem;color:var(--accent-gold);margin-top:4px">${App.formatCurrency(granTotal, p.moneda)}</h2>
            </div>
            <div class="flex gap-sm items-center">
              <span class="tag tag-gold" style="font-size:0.9rem">${areas.length} Áreas de Rubro</span>
              <button class="btn btn-sm btn-primary" onclick="PresupuestoModule.showGlobalRubroModal()">+ Agregar Rubro</button>
            </div>
          </div>
        </div>

        <div class="card mb-lg">
          <h3 class="mb-md">📊 Distribución de Costos por Área</h3>
          ${areas.map(area => {
            const tot = totalsByArea[area.id] || 0;
            const pct = granTotal > 0 ? (tot / granTotal * 100).toFixed(1) : 0;
            return `
              <div class="budget-bar">
                <div class="bar-label">${area.nombre}</div>
                <div class="bar-track">
                  <div class="bar-fill" style="width:${pct}%;background:var(--accent-gold)"></div>
                </div>
                <div class="bar-value">${App.formatCurrency(tot, p.moneda)} (${pct}%)</div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="flex justify-between items-center mb-md">
          <h3>📁 Desglose por Área y Subdivisiones</h3>
          <div class="flex gap-sm">
            <button class="btn btn-sm btn-ghost" onclick="PresupuestoModule.expandAllAreas(true)">▼ Expandir Todas</button>
            <button class="btn btn-sm btn-ghost" onclick="PresupuestoModule.expandAllAreas(false)">▶ Colapsar Todas</button>
          </div>
        </div>

        <div id="areasAccordion">
          ${areas.map((area, aIdx) => `
            <div class="budget-area card mb-md">
              <div class="budget-area-header" onclick="PresupuestoModule.toggleArea(${aIdx})">
                <div class="area-name">
                  <span>${area.expanded !== false ? '▼' : '▶'}</span>
                  <span style="font-size:1.1rem">${area.nombre}</span>
                  <span class="tag tag-neutral" style="font-size:0.75rem">${(area.items || []).length} rubros</span>
                </div>
                <div class="flex items-center gap-md">
                  <div class="area-total">${App.formatCurrency(totalsByArea[area.id] || 0, p.moneda)}</div>
                  <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); PresupuestoModule.showItemModal('${area.id}')">+ Agregar Rubro</button>
                </div>
              </div>

              <div class="budget-items ${area.expanded !== false ? '' : 'hidden'}" style="margin-top:14px">
                ${(area.items || []).length === 0 ? `
                  <div class="empty-state" style="padding:var(--space-md)">
                    <p style="margin-bottom:12px">Sin rubros ingresados en ${area.nombre}.</p>
                    <button class="btn btn-sm btn-primary" onclick="PresupuestoModule.showItemModal('${area.id}')">+ Agregar Primer Rubro en ${area.nombre}</button>
                  </div>
                ` : `
                  <div class="table-container">
                    <table class="data-table">
                      <thead>
                        <tr>
                          <th>Concepto / Rubro</th>
                          <th>Detalle / Subdivisión</th>
                          <th style="text-align:right">Cant.</th>
                          <th style="text-align:right">Precio Unit.</th>
                          <th style="text-align:right">Total</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${area.items.map((item, iIdx) => {
                          const tot = (parseFloat(item.cantidad) || 1) * (parseFloat(item.precioUnitario) || 0);
                          return `
                            <tr>
                              <td><strong>${item.concepto}</strong></td>
                              <td style="font-size:0.85rem;color:var(--text-muted)">${item.subdivision || '-'}</td>
                              <td style="text-align:right">${item.cantidad || 1}</td>
                              <td style="text-align:right">${App.formatCurrency(item.precioUnitario || 0, p.moneda)}</td>
                              <td style="text-align:right;font-weight:700;color:var(--accent-gold-light)">${App.formatCurrency(tot, p.moneda)}</td>
                              <td>
                                <div class="cell-actions">
                                  <button class="btn btn-ghost btn-sm btn-icon" onclick="PresupuestoModule.showItemModal('${area.id}', ${iIdx})">✏️</button>
                                  <button class="btn btn-ghost btn-sm btn-icon" onclick="PresupuestoModule.deleteItem('${area.id}', ${iIdx})">🗑️</button>
                                </div>
                              </td>
                            </tr>
                          `;
                        }).join('')}
                      </tbody>
                    </table>
                  </div>
                `}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  afterRender() {
    const sel = document.getElementById('currencySelect');
    if (sel) {
      sel.addEventListener('change', (e) => {
        const proj = Storage.getProject();
        proj.presupuesto.moneda = e.target.value;
        Storage.saveProject(proj);
        App.navigate('presupuesto');
      });
    }

    const btnTopAdd = document.getElementById('btnTopAddRubro');
    if (btnTopAdd) btnTopAdd.addEventListener('click', () => this.showGlobalRubroModal());

    const btnTopArea = document.getElementById('btnTopAddArea');
    if (btnTopArea) btnTopArea.addEventListener('click', () => this.showAddAreaModal());

    const btnFile = document.getElementById('btnImportBudgetFile');
    const inputFileInput = document.getElementById('budgetFileInput');
    if (btnFile && inputFileInput) {
      btnFile.addEventListener('click', () => inputFileInput.click());
      inputFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          App.readFileUniversal(file, (res) => {
            this.importExcelOrCSV(res);
          });
          e.target.value = '';
        }
      });
    }
  },

  importExcelOrCSV(res) {
    const proj = Storage.getProject();
    let count = 0;

    // Case 1: SheetJS parsed Excel rows
    if (res.rows && res.rows.length > 0) {
      res.rows.forEach((row, idx) => {
        if (idx === 0) return; // Skip headers
        if (!row || row.length < 2) return;
        const areaName = String(row[0] || 'Producción').trim();
        const concepto = String(row[1] || '').trim();
        const subdivision = String(row[2] || '').trim();
        const cantidad = parseFloat(row[3]) || 1;
        const precioUnitario = parseFloat(row[4]) || 0;

        if (concepto) {
          let targetArea = proj.presupuesto.areas.find(a => a.nombre.toLowerCase().includes(areaName.toLowerCase()) || areaName.toLowerCase().includes(a.id));
          if (!targetArea) {
            const id = areaName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            targetArea = { id, nombre: areaName, items: [], expanded: true };
            proj.presupuesto.areas.push(targetArea);
          }
          if (!targetArea.items) targetArea.items = [];
          targetArea.items.push({ concepto, subdivision, cantidad, precioUnitario });
          targetArea.expanded = true;
          count++;
        }
      });
    } else if (res.content) {
      // Case 2: Plain CSV / Text fallback
      const lines = res.content.split(/\r?\n/).filter(l => l.trim());
      lines.forEach((line, idx) => {
        if (idx === 0 && line.toLowerCase().includes('concepto')) return;
        const cols = line.split(/[,;	]/).map(c => c.trim().replace(/^"/, '').replace(/"$/, ''));
        if (cols.length >= 2) {
          const areaName = cols[0] || 'Producción';
          const concepto = cols[1];
          const subdivision = cols[2] || '';
          const cantidad = parseFloat(cols[3]) || 1;
          const precioUnitario = parseFloat(cols[4]) || 0;

          let targetArea = proj.presupuesto.areas.find(a => a.nombre.toLowerCase().includes(areaName.toLowerCase()) || areaName.toLowerCase().includes(a.id));
          if (!targetArea) {
            const id = areaName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            targetArea = { id, nombre: areaName, items: [], expanded: true };
            proj.presupuesto.areas.push(targetArea);
          }
          if (!targetArea.items) targetArea.items = [];
          targetArea.items.push({ concepto, subdivision, cantidad, precioUnitario });
          targetArea.expanded = true;
          count++;
        }
      });
    }

    if (count > 0) {
      Storage.saveProject(proj);
      App.toast(`¡Se importaron ${count} rubros desde la planilla Excel / CSV de tu PC!`, 'success');
      App.navigate('presupuesto');
    } else {
      App.toast('No se encontraron filas con concepto válido en el archivo', 'warning');
    }
  },

  showGlobalRubroModal() {
    const proj = Storage.getProject();
    const areas = proj.presupuesto.areas || [];

    App.showModal(`
      <div class="modal-header"><h2>+ Nuevo Rubro de Presupuesto</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Área / Departamento *</label>
          <select class="form-select" id="bAreaSelect">
            ${areas.map(a => `<option value="${a.id}">${a.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Concepto / Item *</label><input class="form-input" id="bConcepto" placeholder="Ej: Honorarios Director de Fotografía / Alquiler Cámara RED"></div>
        <div class="form-group"><label class="form-label">Subdivisión / Categoría</label><input class="form-input" id="bSubdiv" placeholder="Ej: Honorarios / Alquiler Equipos / Insumos"></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Cantidad / Días / Horas</label><input class="form-input" type="number" id="bCant" value="1"></div>
          <div class="form-group"><label class="form-label">Precio Unitario (${proj.presupuesto.moneda || 'ARS'})</label><input class="form-input" type="number" id="bPrecio" value="0"></div>
        </div>
        <div class="form-group"><label class="form-label">Notas o Proveedor Sugerido</label><textarea class="form-textarea" id="bNotas" style="min-height:60px"></textarea></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary modal-close">Cancelar</button>
        <button class="btn btn-primary" id="btnSaveGlobalRubro">💾 Guardar Rubro</button>
      </div>
    `);

    document.getElementById('btnSaveGlobalRubro').addEventListener('click', () => {
      const areaId = document.getElementById('bAreaSelect').value;
      const concepto = document.getElementById('bConcepto').value.trim();
      if (!concepto) { App.toast('Ingresa el concepto del rubro', 'warning'); return; }

      const data = {
        concepto,
        subdivision: document.getElementById('bSubdiv').value,
        cantidad: parseFloat(document.getElementById('bCant').value) || 1,
        precioUnitario: parseFloat(document.getElementById('bPrecio').value) || 0,
        notas: document.getElementById('bNotas').value
      };

      const area = areas.find(a => a.id === areaId);
      if (area) {
        if (!area.items) area.items = [];
        area.items.push(data);
        area.expanded = true;
        Storage.saveProject(proj);
        App.closeModal();
        App.toast(`Rubro agregado a ${area.nombre}`, 'success');
        App.navigate('presupuesto');
      }
    });
  },

  showAddAreaModal() {
    App.showModal(`
      <div class="modal-header"><h2>+ Crear Nueva Área de Presupuesto</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">Nombre del Área / Departamento *</label><input class="form-input" id="newAreaName" placeholder="Ej: Efectos Especiales / VFX / Legales"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary modal-close">Cancelar</button>
        <button class="btn btn-primary" id="btnSaveNewArea">💾 Crear Área</button>
      </div>
    `);

    document.getElementById('btnSaveNewArea').addEventListener('click', () => {
      const name = document.getElementById('newAreaName').value.trim();
      if (!name) return;
      const proj = Storage.getProject();
      const id = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      if (!proj.presupuesto.areas) proj.presupuesto.areas = [];
      proj.presupuesto.areas.push({ id, nombre: name, items: [], expanded: true });
      Storage.saveProject(proj);
      App.closeModal();
      App.toast(`Área "${name}" creada`, 'success');
      App.navigate('presupuesto');
    });
  },

  expandAllAreas(expand) {
    const proj = Storage.getProject();
    (proj.presupuesto.areas || []).forEach(a => { a.expanded = expand; });
    Storage.saveProject(proj);
    App.navigate('presupuesto');
  },

  toggleArea(aIdx) {
    const proj = Storage.getProject();
    proj.presupuesto.areas[aIdx].expanded = !proj.presupuesto.areas[aIdx].expanded;
    Storage.saveProject(proj);
    App.navigate('presupuesto');
  },

  showItemModal(areaId, itemIdx) {
    const proj = Storage.getProject();
    const area = proj.presupuesto.areas.find(a => a.id === areaId);
    const item = itemIdx !== undefined ? area.items[itemIdx] : {};

    App.showModal(`
      <div class="modal-header"><h2>${itemIdx !== undefined ? 'Editar' : 'Nuevo'} Rubro (${area.nombre})</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">Concepto / Item *</label><input class="form-input" id="bConcepto" value="${item.concepto || ''}" placeholder="Ej: Honorarios Director de Fotografía / Alquiler Cámara Alexa"></div>
        <div class="form-group"><label class="form-label">Subdivisión / Categoría</label><input class="form-input" id="bSubdiv" value="${item.subdivision || ''}" placeholder="Ej: Honorarios / Alquiler Equipos / Insumos"></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Cantidad / Días / Horas</label><input class="form-input" type="number" id="bCant" value="${item.cantidad || 1}"></div>
          <div class="form-group"><label class="form-label">Precio Unitario (${proj.presupuesto.moneda || 'ARS'})</label><input class="form-input" type="number" id="bPrecio" value="${item.precioUnitario || 0}"></div>
        </div>
        <div class="form-group"><label class="form-label">Notas o Proveedor Sugerido</label><textarea class="form-textarea" id="bNotas" style="min-height:60px">${item.notas || ''}</textarea></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary modal-close">Cancelar</button>
        <button class="btn btn-primary" id="btnSaveBudgetItem">💾 Guardar Rubro</button>
      </div>
    `);

    document.getElementById('btnSaveBudgetItem').addEventListener('click', () => {
      const concepto = document.getElementById('bConcepto').value.trim();
      if (!concepto) { App.toast('Ingresa el concepto del rubro', 'warning'); return; }

      const data = {
        concepto,
        subdivision: document.getElementById('bSubdiv').value,
        cantidad: parseFloat(document.getElementById('bCant').value) || 1,
        precioUnitario: parseFloat(document.getElementById('bPrecio').value) || 0,
        notas: document.getElementById('bNotas').value
      };

      if (!area.items) area.items = [];
      if (itemIdx !== undefined) { area.items[itemIdx] = data; } else { area.items.push(data); }
      area.expanded = true;
      Storage.saveProject(proj);
      App.closeModal();
      App.toast('Rubro guardado', 'success');
      App.navigate('presupuesto');
    });
  },

  deleteItem(areaId, itemIdx) {
    if (!confirm('¿Eliminar este rubro?')) return;
    const proj = Storage.getProject();
    const area = proj.presupuesto.areas.find(a => a.id === areaId);
    area.items.splice(itemIdx, 1);
    Storage.saveProject(proj);
    App.toast('Rubro eliminado', 'warning');
    App.navigate('presupuesto');
  }
};

App.registerModule('presupuesto', PresupuestoModule);
