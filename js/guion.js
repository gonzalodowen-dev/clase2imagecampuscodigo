/* CinePrep - Guion y Derivados Module (con Importacion de Archivos y Parser Automatico) */
const GuionModule = {
  activeTab: 'editor',

  render() {
    if (!App.requireProject()) return '<div class="empty-state"><div class="empty-icon">\uD83D\uDCDD</div><h3>Crea un proyecto primero</h3><p>Ve al Dashboard para crear un nuevo proyecto.</p><button class="btn btn-primary" onclick="App.navigate(\'dashboard\')">Ir al Dashboard</button></div>';
    const project = Storage.getProject();
    const g = project.guion || {};

    return `
      <div class="page-header">
        <h1><span class="header-icon">\uD83D\uDCDD</span> Guion y Derivados</h1>
        <p class="page-subtitle">Escribe o carga tu guion desde la PC para generar automáticamente la escaleta y derivados</p>
        <div class="page-header-actions">
          <button class="btn btn-secondary btn-sm" id="btnImportGuionFile">\uD83D\uDCE5 Cargar Guion desde PC (.txt, .fountain, .md)</button>
          <input type="file" id="guionFileInput" accept="*/*" style="display:none">
        </div>
      </div>
      <div class="page-body">
        <div class="tabs mb-lg" id="guionTabs">
          <button class="tab-btn ${this.activeTab === 'editor' ? 'active' : ''}" data-tab="editor">📄 Guion</button>
          <button class="tab-btn ${this.activeTab === 'logline' ? 'active' : ''}" data-tab="logline">🎯 Logline & Tagline</button>
          <button class="tab-btn ${this.activeTab === 'sinopsis' ? 'active' : ''}" data-tab="sinopsis">📋 Sinopsis</button>
          <button class="tab-btn ${this.activeTab === 'tratamiento' ? 'active' : ''}" data-tab="tratamiento">📖 Tratamiento</button>
          <button class="tab-btn ${this.activeTab === 'escaleta' ? 'active' : ''}" data-tab="escaleta">📑 Escaleta</button>
          <button class="tab-btn ${this.activeTab === 'tarjetas' ? 'active' : ''}" data-tab="tarjetas">🃏 Tarjetas</button>
        </div>

        <div class="tab-content ${this.activeTab === 'editor' ? 'active' : ''}" id="tab-editor">
          <div class="card">
            <div class="card-header">
              <h3>📄 Editor de Guion</h3>
              <div class="flex gap-sm">
                <span class="tag tag-neutral" id="wordCount">0 palabras</span>
                <button class="btn btn-sm btn-secondary" onclick="document.getElementById('guionFileInput').click()">\uD83D\uDCE5 Cargar Archivo</button>
                <button class="btn btn-sm btn-primary" id="btnSaveGuion">\uD83D\uDCBE Guardar</button>
              </div>
            </div>
            <textarea class="screenplay-editor" id="guionEditor" placeholder="Escribe aquí tu guion o usa el botón 'Cargar Archivo desde PC' arriba.&#10;&#10;Ejemplo de formato:&#10;INT. CASA DE ANA - DÍA&#10;&#10;Ana camina hacia la ventana.&#10;&#10;ANA&#10;No podemos esperar más.">${g.guionTexto || ''}</textarea>
          </div>
        </div>

        <div class="tab-content ${this.activeTab === 'logline' ? 'active' : ''}" id="tab-logline">
          <div class="grid-2">
            <div class="card">
              <div class="card-header"><h3>🎯 Logline</h3></div>
              <p style="font-size:0.9rem;color:var(--text-muted);margin-bottom:var(--space-md)">Resume tu historia en 1-2 oraciones. Incluye personaje principal, conflicto y objetivo.</p>
              <textarea class="form-textarea" id="loglineInput" placeholder="Un/a [protagonista] debe [acción/objetivo] antes de que [consecuencia/antagonista]...">${g.logline || ''}</textarea>
              <button class="btn btn-sm btn-primary mt-md" id="btnSaveLogline">\uD83D\uDCBE Guardar</button>
            </div>
            <div class="card">
              <div class="card-header"><h3>💬 Tagline</h3></div>
              <p style="font-size:0.9rem;color:var(--text-muted);margin-bottom:var(--space-md)">Frase de marketing impactante para promocionar tu pieza. Debe ser memorable.</p>
              <input class="form-input" id="taglineInput" value="${g.tagline || ''}" placeholder="Ej: En el espacio nadie puede oír tus gritos...">
              <button class="btn btn-sm btn-primary mt-md" id="btnSaveTagline">\uD83D\uDCBE Guardar</button>
            </div>
          </div>
        </div>

        <div class="tab-content ${this.activeTab === 'sinopsis' ? 'active' : ''}" id="tab-sinopsis">
          <div class="card mb-lg">
            <div class="card-header"><h3>📋 Sinopsis Corta</h3></div>
            <p style="font-size:0.9rem;color:var(--text-muted);margin-bottom:var(--space-md)">Resumen de 3-5 líneas. Incluye inicio, conflicto principal y resolución.</p>
            <textarea class="form-textarea" id="sinopsisCortaInput" style="min-height:90px">${g.sinopsisCorta || ''}</textarea>
            <button class="btn btn-sm btn-primary mt-md" id="btnSaveSinopsisCorta">\uD83D\uDCBE Guardar</button>
          </div>
          <div class="card">
            <div class="card-header"><h3>📋 Sinopsis Larga</h3></div>
            <p style="font-size:0.9rem;color:var(--text-muted);margin-bottom:var(--space-md)">Descripción detallada de la trama (1-2 páginas). Cuenta toda la historia incluyendo el final.</p>
            <textarea class="form-textarea" id="sinopsisLargaInput" style="min-height:220px">${g.sinopsisLarga || ''}</textarea>
            <button class="btn btn-sm btn-primary mt-md" id="btnSaveSinopsisLarga">\uD83D\uDCBE Guardar</button>
          </div>
        </div>

        <div class="tab-content ${this.activeTab === 'tratamiento' ? 'active' : ''}" id="tab-tratamiento">
          <div class="card">
            <div class="card-header"><h3>📖 Tratamiento</h3></div>
            <p style="font-size:0.9rem;color:var(--text-muted);margin-bottom:var(--space-md)">Narrativa detallada escena por escena, en tiempo presente y tercera persona. Describe acciones, emociones y atmósfera sin diálogos.</p>
            <textarea class="form-textarea" id="tratamientoInput" style="min-height:380px">${g.tratamiento || ''}</textarea>
            <button class="btn btn-sm btn-primary mt-md" id="btnSaveTratamiento">\uD83D\uDCBE Guardar</button>
          </div>
        </div>

        <div class="tab-content ${this.activeTab === 'escaleta' ? 'active' : ''}" id="tab-escaleta">
          <div class="card">
            <div class="card-header">
              <h3>📑 Escaleta Automática</h3>
              <div class="flex gap-sm">
                <button class="btn btn-sm btn-secondary" id="btnAutoParseEscaleta">⚡ Generar desde Guion</button>
                <button class="btn btn-sm btn-primary" id="btnAddEscaleta">+ Agregar Escena</button>
              </div>
            </div>
            <div id="escaletaList">
              ${this.renderEscaleta(g.escaleta || [])}
            </div>
          </div>
        </div>

        <div class="tab-content ${this.activeTab === 'tarjetas' ? 'active' : ''}" id="tab-tarjetas">
          <div class="flex justify-between items-center mb-lg">
            <h3>🃏 Tarjetas de Escenas (Kanban)</h3>
            <button class="btn btn-sm btn-primary" id="btnAddTarjeta">+ Nueva Tarjeta</button>
          </div>
          <div class="scene-cards-grid" id="tarjetasGrid">
            ${this.renderTarjetas(g.tarjetas || [])}
          </div>
        </div>
      </div>
    `;
  },

  renderEscaleta(escaleta) {
    if (escaleta.length === 0) return '<div class="empty-state"><div class="empty-icon">📑</div><h3>Sin escenas aún</h3><p>Carga un guion o haz clic en "⚡ Generar desde Guion" para crear la escaleta automáticamente.</p></div>';
    return '<div class="table-container"><table class="data-table"><thead><tr><th>Nº</th><th>INT/EXT</th><th>Locación</th><th>Momento</th><th>Resumen</th><th>Personajes</th><th>Acciones</th></tr></thead><tbody>' +
      escaleta.map((e, i) => `<tr>
        <td style="font-weight:700;color:var(--accent-gold)">${i + 1}</td>
        <td><span class="tag ${e.tipo === 'INT' ? 'tag-info' : 'tag-warning'}">${e.tipo || 'INT'}</span></td>
        <td>${e.locacion || '-'}</td>
        <td>${e.momento || '-'}</td>
        <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.resumen || '-'}</td>
        <td style="font-size:0.85rem;color:var(--text-muted)">${e.personajes || '-'}</td>
        <td><div class="cell-actions">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="GuionModule.editEscaleta(${i})">\u270F\uFE0F</button>
          <button class="btn btn-ghost btn-sm btn-icon" onclick="GuionModule.deleteEscaleta(${i})">\uD83D\uDDD1\uFE0F</button>
        </div></td>
      </tr>`).join('') + '</tbody></table></div>';
  },

  renderTarjetas(tarjetas) {
    if (tarjetas.length === 0) return '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🃏</div><h3>Sin tarjetas</h3><p>Crea tarjetas o genera automáticamente a partir de tu guion</p></div>';
    return tarjetas.map((t, i) => `
      <div class="scene-card" onclick="GuionModule.editTarjeta(${i})">
        <div class="scene-number">Escena ${t.numero || i + 1}</div>
        <div class="scene-title">${t.titulo || 'Sin título'}</div>
        <div class="scene-desc">${t.descripcion || ''}</div>
        <div class="scene-meta">
          ${t.locacion ? '<span class="tag tag-neutral">📍 ' + t.locacion + '</span>' : ''}
          ${t.personajes ? '<span class="tag tag-gold">👤 ' + t.personajes + '</span>' : ''}
        </div>
      </div>
    `).join('');
  },

  afterRender() {
    const tabs = document.getElementById('guionTabs');
    if (tabs) {
      tabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;
        this.activeTab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === 'tab-' + btn.dataset.tab));
      });
    }

    const editor = document.getElementById('guionEditor');
    if (editor) {
      const updateCount = () => {
        const words = editor.value.trim().split(/\s+/).filter(w => w).length;
        const wc = document.getElementById('wordCount');
        if (wc) wc.textContent = words + ' palabras';
      };
      editor.addEventListener('input', updateCount);
      updateCount();
    }

    // File Import Handler
    const btnImport = document.getElementById('btnImportGuionFile');
    const fileInput = document.getElementById('guionFileInput');
    if (btnImport && fileInput) {
      btnImport.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const text = evt.target.result;
            document.getElementById('guionEditor').value = text;
            this.saveField('guionTexto', text);
            this.parseGuionIntoEscaleta(text);
            App.toast(`¡Guion "${file.name}" cargado exitosamente!`, 'success');
          };
          reader.readAsText(file);
          e.target.value = '';
        }
      });
    }

    const btnAutoParse = document.getElementById('btnAutoParseEscaleta');
    if (btnAutoParse) {
      btnAutoParse.addEventListener('click', () => {
        const text = document.getElementById('guionEditor') ? document.getElementById('guionEditor').value : '';
        if (!text.trim()) { App.toast('Escribe o carga un guion primero', 'warning'); return; }
        this.parseGuionIntoEscaleta(text);
      });
    }

    this.bindSave('btnSaveGuion', () => this.saveField('guionTexto', document.getElementById('guionEditor').value));
    this.bindSave('btnSaveLogline', () => this.saveField('logline', document.getElementById('loglineInput').value));
    this.bindSave('btnSaveTagline', () => this.saveField('tagline', document.getElementById('taglineInput').value));
    this.bindSave('btnSaveSinopsisCorta', () => this.saveField('sinopsisCorta', document.getElementById('sinopsisCortaInput').value));
    this.bindSave('btnSaveSinopsisLarga', () => this.saveField('sinopsisLarga', document.getElementById('sinopsisLargaInput').value));
    this.bindSave('btnSaveTratamiento', () => this.saveField('tratamiento', document.getElementById('tratamientoInput').value));

    this.bindSave('btnAddEscaleta', () => this.showEscaletaForm());
    this.bindSave('btnAddTarjeta', () => this.showTarjetaForm());
  },

  parseGuionIntoEscaleta(text) {
    // Regex for screenplay scene headings (e.g., INT. CASA - DIA, EXT. CALLE - NOCHE)
    const sceneRegex = /(?:^|\n)(INT\.?|EXT\.?|INT\/EXT\.?)\s+([^\n\-]+)(?:\s*-\s*([^\n]+))?/gi;
    const project = Storage.getProject();
    const escaleta = [];
    const tarjetas = [];

    let match;
    let sceneNum = 1;
    while ((match = sceneRegex.exec(text)) !== null) {
      const tipo = match[1].replace('.', '').trim().toUpperCase();
      const locacion = match[2].trim();
      const momento = match[3] ? match[3].trim().toUpperCase() : 'DÍA';

      escaleta.push({
        numero: sceneNum,
        tipo,
        locacion,
        momento,
        resumen: `Escena en ${locacion}`,
        personajes: ''
      });

      tarjetas.push({
        numero: sceneNum,
        titulo: `${tipo} ${locacion}`,
        locacion,
        personajes: '',
        descripcion: `Encabezado: ${tipo} ${locacion} - ${momento}`
      });

      sceneNum++;
    }

    if (escaleta.length > 0) {
      project.guion.escaleta = escaleta;
      project.guion.tarjetas = tarjetas;
      Storage.saveProject(project);
      App.toast(`¡Se detectaron ${escaleta.length} escenas para la escaleta y tarjetas!`, 'success');
      App.navigate('guion');
    } else {
      App.toast('Guion guardado. (No se detectaron encabezados tipo INT/EXT para escaleta automática)', 'info');
    }
  },

  bindSave(id, fn) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  },

  saveField(field, value) {
    const project = Storage.getProject();
    if (!project.guion) project.guion = {};
    project.guion[field] = value;
    Storage.saveProject(project);
    App.toast('Guardado correctamente', 'success');
  },

  showEscaletaForm(idx) {
    const project = Storage.getProject();
    const e = (idx !== undefined && project.guion.escaleta) ? project.guion.escaleta[idx] : {};
    App.showModal(`
      <div class="modal-header"><h2>${idx !== undefined ? 'Editar' : 'Nueva'} Escena</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group"><label class="form-label">INT/EXT</label>
            <select class="form-select" id="escTipo"><option ${e.tipo === 'INT' ? 'selected' : ''}>INT</option><option ${e.tipo === 'EXT' ? 'selected' : ''}>EXT</option><option ${e.tipo === 'INT/EXT' ? 'selected' : ''}>INT/EXT</option></select>
          </div>
          <div class="form-group"><label class="form-label">Momento</label>
            <select class="form-select" id="escMomento"><option ${e.momento === 'DÍA' ? 'selected' : ''}>DÍA</option><option ${e.momento === 'NOCHE' ? 'selected' : ''}>NOCHE</option><option ${e.momento === 'ATARDECER' ? 'selected' : ''}>ATARDECER</option><option ${e.momento === 'AMANECER' ? 'selected' : ''}>AMANECER</option></select>
          </div>
        </div>
        <div class="form-group"><label class="form-label">Locación</label><input class="form-input" id="escLocacion" value="${e.locacion || ''}" placeholder="Ej: Casa de Ana - Living"></div>
        <div class="form-group"><label class="form-label">Personajes en escena</label><input class="form-input" id="escPersonajes" value="${e.personajes || ''}" placeholder="Ej: ANA, CARLOS"></div>
        <div class="form-group"><label class="form-label">Resumen de la escena</label><textarea class="form-textarea" id="escResumen" style="min-height:80px">${e.resumen || ''}</textarea></div>
      </div>
      <div class="modal-footer"><button class="btn btn-secondary modal-close">Cancelar</button><button class="btn btn-primary" id="btnSaveEsc">\uD83D\uDCBE Guardar</button></div>
    `);
    document.getElementById('btnSaveEsc').addEventListener('click', () => {
      const data = { tipo: document.getElementById('escTipo').value, momento: document.getElementById('escMomento').value, locacion: document.getElementById('escLocacion').value, personajes: document.getElementById('escPersonajes').value, resumen: document.getElementById('escResumen').value };
      const proj = Storage.getProject();
      if (!proj.guion.escaleta) proj.guion.escaleta = [];
      if (idx !== undefined) { proj.guion.escaleta[idx] = data; } else { proj.guion.escaleta.push(data); }
      Storage.saveProject(proj);
      App.closeModal();
      App.toast('Escena guardada', 'success');
      App.navigate('guion');
      this.activeTab = 'escaleta';
    });
  },

  editEscaleta(idx) { this.showEscaletaForm(idx); },
  deleteEscaleta(idx) {
    if (!confirm('¿Eliminar esta escena?')) return;
    const proj = Storage.getProject();
    proj.guion.escaleta.splice(idx, 1);
    Storage.saveProject(proj);
    App.toast('Escena eliminada', 'warning');
    App.navigate('guion');
    this.activeTab = 'escaleta';
  },

  showTarjetaForm(idx) {
    const project = Storage.getProject();
    const t = (idx !== undefined && project.guion.tarjetas) ? project.guion.tarjetas[idx] : {};
    App.showModal(`
      <div class="modal-header"><h2>${idx !== undefined ? 'Editar' : 'Nueva'} Tarjeta</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Número de Escena</label><input class="form-input" id="tarjNum" value="${t.numero || ''}" placeholder="1"></div>
          <div class="form-group"><label class="form-label">Título</label><input class="form-input" id="tarjTit" value="${t.titulo || ''}" placeholder="Título de la escena"></div>
        </div>
        <div class="form-group"><label class="form-label">Locación</label><input class="form-input" id="tarjLoc" value="${t.locacion || ''}"></div>
        <div class="form-group"><label class="form-label">Personajes</label><input class="form-input" id="tarjPers" value="${t.personajes || ''}"></div>
        <div class="form-group"><label class="form-label">Descripción</label><textarea class="form-textarea" id="tarjDesc">${t.descripcion || ''}</textarea></div>
        <div class="form-group"><label class="form-label">Notas</label><textarea class="form-textarea" id="tarjNotas" style="min-height:60px">${t.notas || ''}</textarea></div>
      </div>
      <div class="modal-footer">
        ${idx !== undefined ? '<button class="btn btn-danger" onclick="GuionModule.deleteTarjeta(' + idx + ')">\uD83D\uDDD1\uFE0F Eliminar</button>' : ''}
        <button class="btn btn-secondary modal-close">Cancelar</button>
        <button class="btn btn-primary" id="btnSaveTarj">\uD83D\uDCBE Guardar</button>
      </div>
    `);
    document.getElementById('btnSaveTarj').addEventListener('click', () => {
      const data = { numero: document.getElementById('tarjNum').value, titulo: document.getElementById('tarjTit').value, locacion: document.getElementById('tarjLoc').value, personajes: document.getElementById('tarjPers').value, descripcion: document.getElementById('tarjDesc').value, notas: document.getElementById('tarjNotas').value };
      const proj = Storage.getProject();
      if (!proj.guion.tarjetas) proj.guion.tarjetas = [];
      if (idx !== undefined) { proj.guion.tarjetas[idx] = data; } else { proj.guion.tarjetas.push(data); }
      Storage.saveProject(proj);
      App.closeModal();
      App.toast('Tarjeta guardada', 'success');
      App.navigate('guion');
      this.activeTab = 'tarjetas';
    });
  },

  editTarjeta(idx) { this.showTarjetaForm(idx); },
  deleteTarjeta(idx) {
    const proj = Storage.getProject();
    proj.guion.tarjetas.splice(idx, 1);
    Storage.saveProject(proj);
    App.closeModal();
    App.toast('Tarjeta eliminada', 'warning');
    App.navigate('guion');
    this.activeTab = 'tarjetas';
  }
};

App.registerModule('guion', GuionModule);
