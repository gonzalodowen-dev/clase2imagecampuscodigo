/* CinePrep - Casting Module (con Carga de Archivos desde PC) */
const CastingModule = {
  activeTab: 'personajes',

  render() {
    if (!App.requireProject()) return '<div class="empty-state"><div class="empty-icon">🎭</div><h3>Crea un proyecto primero</h3><p>Ve al Dashboard para crear un nuevo proyecto.</p><button class="btn btn-primary" onclick="App.navigate(\'dashboard\')">Ir al Dashboard</button></div>';
    const project = Storage.getProject();
    const c = project.casting || { personajes: [], actores: [] };

    return `
      <div class="page-header">
        <h1><span class="header-icon">🎭</span> Casting y Elenco</h1>
        <p class="page-subtitle">Definición de personajes y gestión de audiciones y contratación (manual o desde PC)</p>
        <div class="page-header-actions">
          <button class="btn btn-secondary btn-sm" id="btnImportCastingCSV">📥 Cargar Casting desde PC (.csv)</button>
          <input type="file" id="castingCSVInput" accept="*/*" style="display:none">
          <button class="btn btn-primary btn-sm" onclick="CastingModule.showPersonajeModal()">+ Agregar Personaje</button>
        </div>
      </div>
      <div class="page-body">
        <div class="tabs mb-lg" id="castingTabs">
          <button class="tab-btn ${this.activeTab === 'personajes' ? 'active' : ''}" data-tab="personajes">👤 Personajes (${(c.personajes || []).length})</button>
          <button class="tab-btn ${this.activeTab === 'actores' ? 'active' : ''}" data-tab="actores">🌟 Actores / Audiciones (${(c.actores || []).length})</button>
        </div>

        <div class="tab-content ${this.activeTab === 'personajes' ? 'active' : ''}" id="tab-personajes">
          <div class="flex justify-between items-center mb-lg">
            <h3>Fichas de Personajes</h3>
            <div class="flex gap-sm">
              <button class="btn btn-sm btn-secondary" onclick="document.getElementById('castingCSVInput').click()">📥 Cargar CSV desde PC</button>
              <button class="btn btn-sm btn-primary" onclick="CastingModule.showPersonajeModal()">+ Agregar Personaje</button>
            </div>
          </div>
          ${(c.personajes || []).length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">👤</div>
              <h3>Sin personajes creados</h3>
              <p>Agrega los personajes manualmente o carga una planilla CSV desde tu PC.</p>
              <div class="flex gap-sm justify-center mt-md">
                <button class="btn btn-secondary btn-sm" onclick="document.getElementById('castingCSVInput').click()">📥 Cargar CSV desde PC</button>
                <button class="btn btn-primary btn-sm" onclick="CastingModule.showPersonajeModal()">+ Crear Personaje Manual</button>
              </div>
            </div>
          ` : `
            <div class="grid-3">
              ${c.personajes.map((p, i) => `
                <div class="character-card">
                  <div class="flex justify-between items-center mb-xs">
                    <div class="char-name">${p.nombre}</div>
                    <span class="tag ${p.rol === 'Protagonista' ? 'tag-gold' : 'tag-neutral'}">${p.rol || 'Secundario'}</span>
                  </div>
                  <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:8px">Edad: ${p.edad || 'N/I'} | Género: ${p.genero || 'Cualquiera'}</div>
                  <div class="char-desc">${p.descripcion || 'Sin descripción.'}</div>
                  <div class="divider" style="margin:12px 0"></div>
                  <div class="flex justify-between items-center">
                    <div style="font-size:0.85rem">
                      <span class="text-muted">Actor:</span> 
                      <strong class="text-gold">${p.actorAsignado || 'Sin asignar'}</strong>
                    </div>
                    <div class="cell-actions">
                      <button class="btn btn-ghost btn-sm btn-icon" onclick="CastingModule.showPersonajeModal(${i})">✏️</button>
                      <button class="btn btn-ghost btn-sm btn-icon" onclick="CastingModule.deletePersonaje(${i})">🗑️</button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <div class="tab-content ${this.activeTab === 'actores' ? 'active' : ''}" id="tab-actores">
          <div class="flex justify-between items-center mb-lg">
            <h3>Fichas de Actores / Audiciones</h3>
            <button class="btn btn-sm btn-primary" onclick="CastingModule.showActorModal()">+ Registrar Actor/Audición</button>
          </div>
          ${(c.actores || []).length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">🌟</div>
              <h3>Sin actores registrados</h3>
              <p>Registra postulantes, audiciones, reels y datos de contacto.</p>
              <button class="btn btn-primary btn-sm" onclick="CastingModule.showActorModal()">+ Registrar Actor</button>
            </div>
          ` : `
            <div class="grid-2">
              ${c.actores.map((a, i) => `
                <div class="actor-card">
                  <div class="actor-avatar">${a.nombre ? a.nombre.charAt(0).toUpperCase() : '👤'}</div>
                  <div class="actor-info">
                    <div class="flex justify-between items-center">
                      <div class="actor-name">${a.nombre}</div>
                      <span class="tag ${a.estado === 'Confirmado' ? 'tag-success' : (a.estado === 'Seleccionado' ? 'tag-gold' : 'tag-neutral')}">
                        ${a.estado || 'En Búsqueda'}
                      </span>
                    </div>
                    <div class="actor-role">Para personaje: <strong>${a.personajeId || 'Sin asignar'}</strong></div>
                    <div style="font-size:0.85rem;color:var(--text-muted);margin-top:4px">
                      📞 ${a.telefono || 'Sin tel'} | ✉️ ${a.email || 'Sin email'}
                    </div>
                    ${a.reel ? `<div style="font-size:0.8rem;margin-top:4px"><a href="${a.reel}" target="_blank">🔗 Ver Reel / Demo</a></div>` : ''}
                    ${a.notas ? `<div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px">📝 ${a.notas}</div>` : ''}
                    <div class="flex justify-end gap-xs mt-sm">
                      <button class="btn btn-ghost btn-sm btn-icon" onclick="CastingModule.showActorModal(${i})">✏️</button>
                      <button class="btn btn-ghost btn-sm btn-icon" onclick="CastingModule.deleteActor(${i})">🗑️</button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  },

  afterRender() {
    const tabs = document.getElementById('castingTabs');
    if (tabs) {
      tabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;
        this.activeTab = btn.dataset.tab;
        document.querySelectorAll('#castingTabs .tab-btn').forEach(b => b.classList.toggle('active', b === btn));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === 'tab-' + btn.dataset.tab));
      });
    }

    const btnCSV = document.getElementById('btnImportCastingCSV');
    const inputCSV = document.getElementById('castingCSVInput');
    if (btnCSV && inputCSV) {
      btnCSV.addEventListener('click', () => inputCSV.click());
      inputCSV.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const lines = evt.target.result.split(/\r?\n/).filter(l => l.trim());
            const proj = Storage.getProject();
            if (!proj.casting) proj.casting = { personajes: [], actores: [] };

            let count = 0;
            lines.forEach((line, idx) => {
              if (idx === 0 && line.toLowerCase().includes('nombre')) return;
              const cols = line.split(/[,;	]/).map(c => c.trim().replace(/^"/, '').replace(/"$/, ''));
              if (cols[0]) {
                proj.casting.personajes.push({
                  nombre: cols[0],
                  rol: cols[1] || 'Secundario',
                  edad: cols[2] || '',
                  genero: cols[3] || '',
                  descripcion: cols[4] || '',
                  actorAsignado: cols[5] || ''
                });
                count++;
              }
            });
            Storage.saveProject(proj);
            App.toast(`¡Se cargaron ${count} personajes de casting desde la PC!`, 'success');
            App.navigate('casting');
            this.activeTab = 'personajes';
          };
          reader.readAsText(file);
          e.target.value = '';
        }
      });
    }
  },

  showPersonajeModal(idx) {
    const project = Storage.getProject();
    const list = (project.casting && project.casting.personajes) ? project.casting.personajes : [];
    const p = idx !== undefined ? list[idx] : {};

    App.showModal(`
      <div class="modal-header"><h2>${idx !== undefined ? 'Editar' : 'Nuevo'} Personaje</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Nombre del Personaje *</label><input class="form-input" id="pNombre" value="${p.nombre || ''}" placeholder="Ej: Ana María"></div>
          <div class="form-group">
            <label class="form-label">Rol en la Historia</label>
            <select class="form-select" id="pRol">
              <option ${p.rol === 'Protagonista' ? 'selected' : ''}>Protagonista</option>
              <option ${p.rol === 'Antagonista' ? 'selected' : ''}>Antagonista</option>
              <option ${p.rol === 'Secundario' ? 'selected' : ''} ${!p.rol ? 'selected' : ''}>Secundario</option>
              <option ${p.rol === 'Extra / Bolo' ? 'selected' : ''}>Extra / Bolo</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Rango de Edad</label><input class="form-input" id="pEdad" value="${p.edad || ''}" placeholder="Ej: 25-30 años"></div>
          <div class="form-group"><label class="form-label">Género</label><input class="form-input" id="pGenero" value="${p.genero || ''}" placeholder="Femenino / Masculino / Indistinto"></div>
        </div>
        <div class="form-group"><label class="form-label">Descripción Física & Psicología</label><textarea class="form-textarea" id="pDesc" style="min-height:80px">${p.descripcion || ''}</textarea></div>
        <div class="form-group"><label class="form-label">Actor/Actriz Asignado/a</label><input class="form-input" id="pActor" value="${p.actorAsignado || ''}" placeholder="Nombre del actor confirmado"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary modal-close">Cancelar</button>
        <button class="btn btn-primary" id="btnSavePersonaje">💾 Guardar Personaje</button>
      </div>
    `);

    document.getElementById('btnSavePersonaje').addEventListener('click', () => {
      const nombre = document.getElementById('pNombre').value.trim();
      if (!nombre) { App.toast('Ingresa el nombre del personaje', 'warning'); return; }

      const data = {
        nombre,
        rol: document.getElementById('pRol').value,
        edad: document.getElementById('pEdad').value,
        genero: document.getElementById('pGenero').value,
        descripcion: document.getElementById('pDesc').value,
        actorAsignado: document.getElementById('pActor').value
      };

      const proj = Storage.getProject();
      if (!proj.casting) proj.casting = { personajes: [], actores: [] };
      if (idx !== undefined) { proj.casting.personajes[idx] = data; } else { proj.casting.personajes.push(data); }
      Storage.saveProject(proj);
      App.closeModal();
      App.toast('Personaje guardado', 'success');
      App.navigate('casting');
      this.activeTab = 'personajes';
    });
  },

  deletePersonaje(idx) {
    if (!confirm('¿Eliminar este personaje?')) return;
    const proj = Storage.getProject();
    proj.casting.personajes.splice(idx, 1);
    Storage.saveProject(proj);
    App.toast('Personaje eliminado', 'warning');
    App.navigate('casting');
    this.activeTab = 'personajes';
  },

  showActorModal(idx) {
    const project = Storage.getProject();
    const c = project.casting || { personajes: [], actores: [] };
    const a = idx !== undefined ? c.actores[idx] : {};

    App.showModal(`
      <div class="modal-header"><h2>${idx !== undefined ? 'Editar' : 'Nuevo'} Actor / Postulante</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Nombre Completo *</label><input class="form-input" id="aNombre" value="${a.nombre || ''}"></div>
          <div class="form-group">
            <label class="form-label">Personaje al que postula</label>
            <select class="form-select" id="aPersonaje">
              <option value="">Indistinto / Varios</option>
              ${(c.personajes || []).map(p => `<option value="${p.nombre}" ${a.personajeId === p.nombre ? 'selected' : ''}>${p.nombre}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Teléfono</label><input class="form-input" id="aTel" value="${a.telefono || ''}"></div>
          <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="aEmail" value="${a.email || ''}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Link Reel / Demo / Foto</label><input class="form-input" id="aReel" value="${a.reel || ''}" placeholder="https://youtube.com/..."></div>
          <div class="form-group">
            <label class="form-label">Estado de Casting</label>
            <select class="form-select" id="aEstado">
              <option ${a.estado === 'En Búsqueda' ? 'selected' : ''} ${!a.estado ? 'selected' : ''}>En Búsqueda</option>
              <option ${a.estado === 'Audición' ? 'selected' : ''}>Audición</option>
              <option ${a.estado === 'Seleccionado' ? 'selected' : ''}>Seleccionado</option>
              <option ${a.estado === 'Confirmado' ? 'selected' : ''}>Confirmado</option>
            </select>
          </div>
        </div>
        <div class="form-group"><label class="form-label">Notas de Audición / Observaciones</label><textarea class="form-textarea" id="aNotas" style="min-height:70px">${a.notas || ''}</textarea></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary modal-close">Cancelar</button>
        <button class="btn btn-primary" id="btnSaveActor">💾 Guardar Actor</button>
      </div>
    `);

    document.getElementById('btnSaveActor').addEventListener('click', () => {
      const nombre = document.getElementById('aNombre').value.trim();
      if (!nombre) { App.toast('Ingresa el nombre del actor', 'warning'); return; }

      const data = {
        nombre,
        personajeId: document.getElementById('aPersonaje').value,
        telefono: document.getElementById('aTel').value,
        email: document.getElementById('aEmail').value,
        reel: document.getElementById('aReel').value,
        estado: document.getElementById('aEstado').value,
        notas: document.getElementById('aNotas').value
      };

      const proj = Storage.getProject();
      if (!proj.casting) proj.casting = { personajes: [], actores: [] };
      if (!proj.casting.actores) proj.casting.actores = [];
      if (idx !== undefined) { proj.casting.actores[idx] = data; } else { proj.casting.actores.push(data); }
      Storage.saveProject(proj);
      App.closeModal();
      App.toast('Actor guardado', 'success');
      App.navigate('casting');
      this.activeTab = 'actores';
    });
  },

  deleteActor(idx) {
    if (!confirm('¿Eliminar este actor?')) return;
    const proj = Storage.getProject();
    proj.casting.actores.splice(idx, 1);
    Storage.saveProject(proj);
    App.toast('Actor eliminado', 'warning');
    App.navigate('casting');
    this.activeTab = 'actores';
  }
};

App.registerModule('casting', CastingModule);
