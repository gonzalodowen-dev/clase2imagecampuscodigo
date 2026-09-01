/* CinePrep - Contactos y Equipo Module (con Importación CSV) */
const ContactosModule = {
  render() {
    if (!App.requireProject()) return '<div class="empty-state"><div class="empty-icon">📞</div><h3>Crea un proyecto primero</h3><p>Ve al Dashboard para crear un nuevo proyecto.</p><button class="btn btn-primary" onclick="App.navigate(\'dashboard\')">Ir al Dashboard</button></div>';
    const project = Storage.getProject();
    const contactos = project.contactos || [];

    return `
      <div class="page-header">
        <h1><span class="header-icon">📞</span> Directorio del Equipo y Contactos</h1>
        <p class="page-subtitle">Guía telefónica y de mails del equipo técnico y artístico</p>
        <div class="page-header-actions">
          <button class="btn btn-secondary btn-sm" id="btnImportContactosCSV">📥 Cargar Contactos desde PC (.csv)</button>
          <input type="file" id="contactosCSVInput" accept="*/*" style="display:none">
          <button class="btn btn-primary btn-sm" onclick="ContactosModule.showContactoModal()">+ Nuevo Contacto</button>
        </div>
      </div>
      <div class="page-body">
        ${contactos.length === 0 ? `
          <div class="empty-state card">
            <div class="empty-icon">📞</div>
            <h3>Sin contactos registrados</h3>
            <p>Agrega los datos del equipo técnico y artístico o carga una planilla CSV desde tu PC.</p>
            <div class="flex gap-sm justify-center mt-md">
              <button class="btn btn-secondary" onclick="document.getElementById('contactosCSVInput').click()">📥 Cargar CSV desde PC</button>
              <button class="btn btn-primary" onclick="ContactosModule.showContactoModal()">+ Agregar Contacto Manual</button>
            </div>
          </div>
        ` : `
          <div class="grid-3">
            ${contactos.map((c, i) => `
              <div class="contact-card">
                <div class="contact-avatar">${c.nombre ? c.nombre.charAt(0).toUpperCase() : '👤'}</div>
                <div class="contact-info">
                  <div class="contact-name">${c.nombre}</div>
                  <div class="contact-role">${c.rol || 'Crew'} (${c.departamento || 'General'})</div>
                  <div class="contact-detail mt-xs">📞 ${c.telefono || 'Sin teléfono'}</div>
                  <div class="contact-detail">✉️ ${c.email || 'Sin email'}</div>
                </div>
                <div class="cell-actions">
                  <button class="btn btn-ghost btn-sm btn-icon" onclick="ContactosModule.showContactoModal(${i})">✏️</button>
                  <button class="btn btn-ghost btn-sm btn-icon" onclick="ContactosModule.deleteContacto(${i})">🗑️</button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  afterRender() {
    const btnCSV = document.getElementById('btnImportContactosCSV');
    const inputCSV = document.getElementById('contactosCSVInput');
    if (btnCSV && inputCSV) {
      btnCSV.addEventListener('click', () => inputCSV.click());
      inputCSV.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const lines = evt.target.result.split(/\r?\n/).filter(l => l.trim());
            const proj = Storage.getProject();
            if (!proj.contactos) proj.contactos = [];

            let count = 0;
            lines.forEach((line, idx) => {
              if (idx === 0 && line.toLowerCase().includes('nombre')) return;
              const cols = line.split(/[,;	]/).map(c => c.trim().replace(/^"/, '').replace(/"$/, ''));
              if (cols[0]) {
                proj.contactos.push({
                  nombre: cols[0],
                  rol: cols[1] || 'Crew',
                  departamento: cols[2] || 'General',
                  telefono: cols[3] || '',
                  email: cols[4] || '',
                  notas: cols[5] || ''
                });
                count++;
              }
            });
            Storage.saveProject(proj);
            App.toast(`¡Se cargaron ${count} contactos desde la PC!`, 'success');
            App.navigate('contactos');
          };
          reader.readAsText(file);
          e.target.value = '';
        }
      });
    }
  },

  showContactoModal(idx) {
    const proj = Storage.getProject();
    const list = proj.contactos || [];
    const c = idx !== undefined ? list[idx] : {};

    App.showModal(`
      <div class="modal-header"><h2>${idx !== undefined ? 'Editar' : 'Nuevo'} Contacto</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Nombre Completo *</label><input class="form-input" id="cNombre" value="${c.nombre || ''}"></div>
          <div class="form-group"><label class="form-label">Puesto / Rol</label><input class="form-input" id="cRol" value="${c.rol || ''}" placeholder="Ej: Director de Fotografía, Gaffer, Asist. Dirección"></div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Departamento</label>
            <select class="form-select" id="cDept">
              <option ${c.departamento === 'Dirección' ? 'selected' : ''}>Dirección</option>
              <option ${c.departamento === 'Producción' ? 'selected' : ''}>Producción</option>
              <option ${c.departamento === 'Fotografía' ? 'selected' : ''}>Fotografía</option>
              <option ${c.departamento === 'Arte' ? 'selected' : ''}>Arte</option>
              <option ${c.departamento === 'Sonido' ? 'selected' : ''}>Sonido</option>
              <option ${c.departamento === 'Vestuario/Maquillaje' ? 'selected' : ''}>Vestuario/Maquillaje</option>
              <option ${c.departamento === 'Elenco' ? 'selected' : ''}>Elenco</option>
              <option ${c.departamento === 'Logística' ? 'selected' : ''}>Logística</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Teléfono</label><input class="form-input" id="cTel" value="${c.telefono || ''}"></div>
        </div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="cEmail" value="${c.email || ''}"></div>
        <div class="form-group"><label class="form-label">Notas / Observaciones</label><input class="form-input" id="cNotas" value="${c.notas || ''}"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary modal-close">Cancelar</button>
        <button class="btn btn-primary" id="btnSaveContact">💾 Guardar Contacto</button>
      </div>
    `);

    document.getElementById('btnSaveContact').addEventListener('click', () => {
      const nombre = document.getElementById('cNombre').value.trim();
      if (!nombre) { App.toast('Ingresa el nombre del contacto', 'warning'); return; }

      const data = {
        nombre,
        rol: document.getElementById('cRol').value,
        departamento: document.getElementById('cDept').value,
        telefono: document.getElementById('cTel').value,
        email: document.getElementById('cEmail').value,
        notas: document.getElementById('cNotas').value
      };

      if (!proj.contactos) proj.contactos = [];
      if (idx !== undefined) { proj.contactos[idx] = data; } else { proj.contactos.push(data); }
      Storage.saveProject(proj);
      App.closeModal();
      App.toast('Contacto guardado', 'success');
      App.navigate('contactos');
    });
  },

  deleteContacto(idx) {
    if (!confirm('¿Eliminar este contacto?')) return;
    const proj = Storage.getProject();
    proj.contactos.splice(idx, 1);
    Storage.saveProject(proj);
    App.toast('Contacto eliminado', 'warning');
    App.navigate('contactos');
  }
};

App.registerModule('contactos', ContactosModule);
