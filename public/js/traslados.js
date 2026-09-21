/* CinePrep - Traslados, Retiros y Devoluciones Module (con Carga de Archivos desde PC) */
const TrasladosModule = {
  activeTab: 'traslados',

  render() {
    if (!App.requireProject()) return '<div class="empty-state"><div class="empty-icon">🚗</div><h3>Crea un proyecto primero</h3><p>Ve al Dashboard para crear un nuevo proyecto.</p><button class="btn btn-primary" onclick="App.navigate(\'dashboard\')">Ir al Dashboard</button></div>';
    const project = Storage.getProject();
    const t = project.traslados || { traslados: [], retiros: [], devoluciones: [] };

    return `
      <div class="page-header">
        <h1><span class="header-icon">🚗</span> Traslados, Retiros y Devoluciones</h1>
        <p class="page-subtitle">Gestión de movilidad de elenco, equipo técnico y logística de rentals (manual o desde PC)</p>
        <div class="page-header-actions">
          <button class="btn btn-secondary btn-sm" id="btnImportTrasladosCSV">📥 Cargar Traslados / Rentals desde PC (.csv)</button>
          <input type="file" id="trasladosCSVInput" accept="*/*" style="display:none">
          <button class="btn btn-primary btn-sm" onclick="TrasladosModule.showTrasladoModal()">+ Nuevo Traslado</button>
        </div>
      </div>
      <div class="page-body">
        <div class="tabs mb-lg" id="trasladosTabs">
          <button class="tab-btn ${this.activeTab === 'traslados' ? 'active' : ''}" data-tab="traslados">🚗 Traslados (${(t.traslados || []).length})</button>
          <button class="tab-btn ${this.activeTab === 'retiros' ? 'active' : ''}" data-tab="retiros">📦 Retiros de Equipos (${(t.retiros || []).length})</button>
          <button class="tab-btn ${this.activeTab === 'devoluciones' ? 'active' : ''}" data-tab="devoluciones">↩️ Devoluciones (${(t.devoluciones || []).length})</button>
        </div>

        <div class="tab-content ${this.activeTab === 'traslados' ? 'active' : ''}" id="tab-traslados">
          <div class="flex justify-between items-center mb-lg">
            <h3>🚗 Traslados de Personal y Elenco</h3>
            <div class="flex gap-sm">
              <button class="btn btn-sm btn-secondary" onclick="document.getElementById('trasladosCSVInput').click()">📥 Cargar CSV desde PC</button>
              <button class="btn btn-sm btn-primary" onclick="TrasladosModule.showTrasladoModal()">+ Nuevo Traslado</button>
            </div>
          </div>
          ${(t.traslados || []).length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">🚗</div>
              <h3>Sin traslados agendados</h3>
              <p>Organiza los itinerarios de vehículos y pasajeros manualmente o cargando un archivo CSV desde tu PC.</p>
              <div class="flex gap-sm justify-center mt-md">
                <button class="btn btn-secondary" onclick="document.getElementById('trasladosCSVInput').click()">📥 Cargar CSV desde PC</button>
                <button class="btn btn-primary" onclick="TrasladosModule.showTrasladoModal()">+ Agendar Traslado Manual</button>
              </div>
            </div>
          ` : `
            <div class="grid-2">
              ${t.traslados.map((item, i) => `
                <div class="transport-card">
                  <div class="transport-icon">🚙</div>
                  <div class="transport-info">
                    <div class="flex justify-between items-center">
                      <div class="transport-route">${item.origen} ➔ ${item.destino}</div>
                      <span class="tag tag-gold">${item.horario || '00:00'}</span>
                    </div>
                    <div style="font-size:0.88rem;color:var(--text-secondary);margin-top:4px">
                      👤 <strong>Pasajeros:</strong> ${item.pasajeros || 'Equipo'}
                    </div>
                    <div class="transport-time">
                      🚘 Vehículo/Chofer: ${item.vehiculo || '-'} | Fecha: ${App.formatDate(item.fecha)}
                    </div>
                  </div>
                  <div class="cell-actions">
                    <button class="btn btn-ghost btn-sm btn-icon" onclick="TrasladosModule.showTrasladoModal(${i})">✏️</button>
                    <button class="btn btn-ghost btn-sm btn-icon" onclick="TrasladosModule.deleteTraslado(${i})">🗑️</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <div class="tab-content ${this.activeTab === 'retiros' ? 'active' : ''}" id="tab-retiros">
          <div class="flex justify-between items-center mb-lg">
            <h3>📦 Retiros de Equipos de Rentals</h3>
            <button class="btn btn-sm btn-primary" onclick="TrasladosModule.showRetiroModal()">+ Registrar Retiro</button>
          </div>
          ${(t.retiros || []).length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">📦</div>
              <h3>Sin retiros registrados</h3>
              <p>Lleva el control de los equipos a retirar de casas de alquiler (Cámara, Luces, Grip, Sonido).</p>
              <button class="btn btn-primary btn-sm" onclick="TrasladosModule.showRetiroModal()">+ Registrar Retiro</button>
            </div>
          ` : `
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Equipo / Items</th>
                    <th>Rental / Proveedor</th>
                    <th>Fecha / Hora Retiro</th>
                    <th>Responsable</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${t.retiros.map((r, i) => `
                    <tr>
                      <td><strong>${r.equipo}</strong></td>
                      <td>${r.rental || '-'}</td>
                      <td style="font-size:0.85rem">${App.formatDate(r.fecha)} ${r.hora || ''}</td>
                      <td>${r.responsable || '-'}</td>
                      <td><span class="tag ${r.estado === 'Retirado' ? 'tag-success' : 'tag-warning'}">${r.estado || 'Pendiente'}</span></td>
                      <td>
                        <div class="cell-actions">
                          <button class="btn btn-ghost btn-sm btn-icon" onclick="TrasladosModule.showRetiroModal(${i})">✏️</button>
                          <button class="btn btn-ghost btn-sm btn-icon" onclick="TrasladosModule.deleteRetiro(${i})">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <div class="tab-content ${this.activeTab === 'devoluciones' ? 'active' : ''}" id="tab-devoluciones">
          <div class="flex justify-between items-center mb-lg">
            <h3>↩️ Devoluciones de Equipos</h3>
            <button class="btn btn-sm btn-primary" onclick="TrasladosModule.showDevolucionModal()">+ Registrar Devolución</button>
          </div>
          ${(t.devoluciones || []).length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">↩️</div>
              <h3>Sin devoluciones agendadas</h3>
              <p>Planifica la devolución post-rodaje para evitar recargos en casas de rental.</p>
              <button class="btn btn-primary btn-sm" onclick="TrasladosModule.showDevolucionModal()">+ Registrar Devolución</button>
            </div>
          ` : `
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Equipo / Items</th>
                    <th>Rental / Destino</th>
                    <th>Fecha Límite Devolución</th>
                    <th>Estado Revisión</th>
                    <th>Responsable</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${t.devoluciones.map((d, i) => `
                    <tr>
                      <td><strong>${d.equipo}</strong></td>
                      <td>${d.rental || '-'}</td>
                      <td style="font-size:0.88rem;color:var(--accent-gold-light);font-weight:600">${App.formatDate(d.fechaLimite)} ${d.hora || ''}</td>
                      <td><span class="tag ${d.estado === 'Devuelto OK' ? 'tag-success' : 'tag-neutral'}">${d.estado || 'Pendiente'}</span></td>
                      <td>${d.responsable || '-'}</td>
                      <td>
                        <div class="cell-actions">
                          <button class="btn btn-ghost btn-sm btn-icon" onclick="TrasladosModule.showDevolucionModal(${i})">✏️</button>
                          <button class="btn btn-ghost btn-sm btn-icon" onclick="TrasladosModule.deleteDevolucion(${i})">🗑️</button>
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
    const tabs = document.getElementById('trasladosTabs');
    if (tabs) {
      tabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;
        this.activeTab = btn.dataset.tab;
        document.querySelectorAll('#trasladosTabs .tab-btn').forEach(b => b.classList.toggle('active', b === btn));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === 'tab-' + btn.dataset.tab));
      });
    }

    const btnCSV = document.getElementById('btnImportTrasladosCSV');
    const inputCSV = document.getElementById('trasladosCSVInput');
    if (btnCSV && inputCSV) {
      btnCSV.addEventListener('click', () => inputCSV.click());
      inputCSV.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const lines = evt.target.result.split(/\r?\n/).filter(l => l.trim());
            const proj = Storage.getProject();
            if (!proj.traslados) proj.traslados = { traslados: [], retiros: [], devoluciones: [] };
            if (!proj.traslados.traslados) proj.traslados.traslados = [];

            let count = 0;
            lines.forEach((line, idx) => {
              if (idx === 0 && line.toLowerCase().includes('origen')) return;
              const cols = line.split(/[,;	]/).map(c => c.trim().replace(/^"/, '').replace(/"$/, ''));
              if (cols.length >= 2) {
                proj.traslados.traslados.push({
                  origen: cols[0],
                  destino: cols[1],
                  fecha: cols[2] || '',
                  horario: cols[3] || '08:00',
                  pasajeros: cols[4] || 'Equipo',
                  vehiculo: cols[5] || 'Combí / Auto'
                });
                count++;
              }
            });
            Storage.saveProject(proj);
            App.toast(`¡Se cargaron ${count} traslados desde la PC!`, 'success');
            App.navigate('traslados');
            this.activeTab = 'traslados';
          };
          reader.readAsText(file);
          e.target.value = '';
        }
      });
    }
  },

  showTrasladoModal(idx) {
    const proj = Storage.getProject();
    const list = (proj.traslados && proj.traslados.traslados) ? proj.traslados.traslados : [];
    const item = idx !== undefined ? list[idx] : {};

    App.showModal(`
      <div class="modal-header"><h2>${idx !== undefined ? 'Editar' : 'Nuevo'} Traslado</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Origen *</label><input class="form-input" id="trOrigen" value="${item.origen || ''}" placeholder="Ej: Hotel Belgrano / Base Producción"></div>
          <div class="form-group"><label class="form-label">Destino *</label><input class="form-input" id="trDestino" value="${item.destino || ''}" placeholder="Ej: Locación 1 - Casa de campo"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Fecha</label><input class="form-input" type="date" id="trFecha" value="${item.fecha || ''}"></div>
          <div class="form-group"><label class="form-label">Horario Pick-up</label><input class="form-input" type="time" id="trHora" value="${item.horario || '07:00'}"></div>
        </div>
        <div class="form-group"><label class="form-label">Pasajeros / Integrantes</label><input class="form-input" id="trPasajeros" value="${item.pasajeros || ''}" placeholder="Ej: Director, DFP, Ana (Actriz)"></div>
        <div class="form-group"><label class="form-label">Vehículo / Chofer / Contacto</label><input class="form-input" id="trVehiculo" value="${item.vehiculo || ''}" placeholder="Ej: Sprinter 1 - Carlos (Tel: 11-2233-4455)"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary modal-close">Cancelar</button>
        <button class="btn btn-primary" id="btnSaveTraslado">💾 Guardar Traslado</button>
      </div>
    `);

    document.getElementById('btnSaveTraslado').addEventListener('click', () => {
      const origen = document.getElementById('trOrigen').value.trim();
      const destino = document.getElementById('trDestino').value.trim();
      if (!origen || !destino) { App.toast('Origen y Destino son obligatorios', 'warning'); return; }

      const data = { origen, destino, fecha: document.getElementById('trFecha').value, horario: document.getElementById('trHora').value, pasajeros: document.getElementById('trPasajeros').value, vehiculo: document.getElementById('trVehiculo').value };

      if (!proj.traslados) proj.traslados = { traslados: [], retiros: [], devoluciones: [] };
      if (!proj.traslados.traslados) proj.traslados.traslados = [];
      if (idx !== undefined) { proj.traslados.traslados[idx] = data; } else { proj.traslados.traslados.push(data); }
      Storage.saveProject(proj);
      App.closeModal();
      App.toast('Traslado guardado', 'success');
      App.navigate('traslados');
      this.activeTab = 'traslados';
    });
  },

  deleteTraslado(idx) {
    const proj = Storage.getProject();
    proj.traslados.traslados.splice(idx, 1);
    Storage.saveProject(proj);
    App.navigate('traslados');
  },

  showRetiroModal(idx) {
    const proj = Storage.getProject();
    const list = (proj.traslados && proj.traslados.retiros) ? proj.traslados.retiros : [];
    const item = idx !== undefined ? list[idx] : {};

    App.showModal(`
      <div class="modal-header"><h2>${idx !== undefined ? 'Editar' : 'Nuevo'} Retiro de Equipos</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">Equipos a Retirar *</label><input class="form-input" id="rEquipo" value="${item.equipo || ''}" placeholder="Ej: Kit Cámara RED + Lentes Prime"></div>
        <div class="form-group"><label class="form-label">Rental / Proveedor</label><input class="form-input" id="rRental" value="${item.rental || ''}" placeholder="Ej: CineRental Palermo"></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Fecha Retiro</label><input class="form-input" type="date" id="rFecha" value="${item.fecha || ''}"></div>
          <div class="form-group"><label class="form-label">Hora Retiro</label><input class="form-input" type="time" id="rHora" value="${item.hora || '09:00'}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Responsable de Retiro</label><input class="form-input" id="rResp" value="${item.responsable || ''}" placeholder="Gaffer / DFP / Asist. Producción"></div>
          <div class="form-group">
            <label class="form-label">Estado</label>
            <select class="form-select" id="rEstado">
              <option ${item.estado === 'Pendiente' ? 'selected' : ''} ${!item.estado ? 'selected' : ''}>Pendiente</option>
              <option ${item.estado === 'Retirado' ? 'selected' : ''}>Retirado</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer"><button class="btn btn-secondary modal-close">Cancelar</button><button class="btn btn-primary" id="btnSaveRetiro">Guardar</button></div>
    `);

    document.getElementById('btnSaveRetiro').addEventListener('click', () => {
      const data = { equipo: document.getElementById('rEquipo').value, rental: document.getElementById('rRental').value, fecha: document.getElementById('rFecha').value, hora: document.getElementById('rHora').value, responsable: document.getElementById('rResp').value, estado: document.getElementById('rEstado').value };
      if (!proj.traslados.retiros) proj.traslados.retiros = [];
      if (idx !== undefined) { proj.traslados.retiros[idx] = data; } else { proj.traslados.retiros.push(data); }
      Storage.saveProject(proj);
      App.closeModal();
      App.navigate('traslados');
      this.activeTab = 'retiros';
    });
  },

  deleteRetiro(idx) {
    const proj = Storage.getProject();
    proj.traslados.retiros.splice(idx, 1);
    Storage.saveProject(proj);
    App.navigate('traslados');
    this.activeTab = 'retiros';
  },

  showDevolucionModal(idx) {
    const proj = Storage.getProject();
    const list = (proj.traslados && proj.traslados.devoluciones) ? proj.traslados.devoluciones : [];
    const item = idx !== undefined ? list[idx] : {};

    App.showModal(`
      <div class="modal-header"><h2>${idx !== undefined ? 'Editar' : 'Nueva'} Devolución de Equipos</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">Equipos a Devolver *</label><input class="form-input" id="dEquipo" value="${item.equipo || ''}"></div>
        <div class="form-group"><label class="form-label">Rental / Destino</label><input class="form-input" id="dRental" value="${item.rental || ''}"></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Fecha Límite</label><input class="form-input" type="date" id="dFecha" value="${item.fechaLimite || ''}"></div>
          <div class="form-group"><label class="form-label">Hora Límite</label><input class="form-input" type="time" id="dHora" value="${item.hora || '18:00'}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Responsable</label><input class="form-input" id="dResp" value="${item.responsable || ''}"></div>
          <div class="form-group">
            <label class="form-label">Estado Revisión</label>
            <select class="form-select" id="dEstado">
              <option ${item.estado === 'Pendiente' ? 'selected' : ''} ${!item.estado ? 'selected' : ''}>Pendiente</option>
              <option ${item.estado === 'Devuelto OK' ? 'selected' : ''}>Devuelto OK</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer"><button class="btn btn-secondary modal-close">Cancelar</button><button class="btn btn-primary" id="btnSaveDev">Guardar</button></div>
    `);

    document.getElementById('btnSaveDev').addEventListener('click', () => {
      const data = { equipo: document.getElementById('dEquipo').value, rental: document.getElementById('dRental').value, fechaLimite: document.getElementById('dFecha').value, hora: document.getElementById('dHora').value, responsable: document.getElementById('dResp').value, estado: document.getElementById('dEstado').value };
      if (!proj.traslados.devoluciones) proj.traslados.devoluciones = [];
      if (idx !== undefined) { proj.traslados.devoluciones[idx] = data; } else { proj.traslados.devoluciones.push(data); }
      Storage.saveProject(proj);
      App.closeModal();
      App.navigate('traslados');
      this.activeTab = 'devoluciones';
    });
  },

  deleteDevolucion(idx) {
    const proj = Storage.getProject();
    proj.traslados.devoluciones.splice(idx, 1);
    Storage.saveProject(proj);
    App.navigate('traslados');
    this.activeTab = 'devoluciones';
  }
};

App.registerModule('traslados', TrasladosModule);
