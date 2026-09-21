/* CinePrep - Guion y Derivados Module (con Visor Interno de PDF/Text y Generación Inteligente) */
const GuionModule = {
  activeTab: 'editor',

  render() {
    if (!App.requireProject()) return '<div class="empty-state"><div class="empty-icon">📝</div><h3>Crea un proyecto primero</h3><p>Ve al Dashboard para crear un nuevo proyecto.</p><button class="btn btn-primary" onclick="App.navigate(\'dashboard\')">Ir al Dashboard</button></div>';
    const project = Storage.getProject();
    const g = project.guion || {};

    return `
      <div class="page-header">
        <h1><span class="header-icon">📝</span> Guión y Derivados</h1>
        <p class="page-subtitle">Editor, sinopsis, logline, escaleta y tarjetas de escena con visor de PDF y autogeneración</p>
        <div class="page-header-actions">
          <button class="btn btn-secondary btn-sm" id="btnImportGuionFile">📂 Cargar Guion desde PC (PDF, DOCS, TXT, Fountain)</button>
          <input type="file" id="guionFileInput" accept="*/*" style="display:none">
          <button class="btn btn-primary btn-sm" id="btnAutoParseGuion">⚡ Generar / Desglosar desde Guion</button>
        </div>
      </div>
      <div class="page-body">
        <div class="tabs mb-lg" id="guionTabs">
          <button class="tab-btn ${this.activeTab === 'editor' ? 'active' : ''}" data-tab="editor">📄 Editor de Guión</button>
          <button class="tab-btn ${this.activeTab === 'logline' ? 'active' : ''}" data-tab="logline">💡 Logline & Tagline</button>
          <button class="tab-btn ${this.activeTab === 'sinopsis' ? 'active' : ''}" data-tab="sinopsis">📖 Sinopsis & Tratamiento</button>
          <button class="tab-btn ${this.activeTab === 'escaleta' ? 'active' : ''}" data-tab="escaleta">📊 Escaleta (${(g.escaleta || []).length})</button>
          <button class="tab-btn ${this.activeTab === 'tarjetas' ? 'active' : ''}" data-tab="tarjetas">🃏 Tarjetas de Escena (${(g.tarjetas || []).length})</button>
        </div>

        <!-- Tab 1: Editor -->
        <div class="tab-content ${this.activeTab === 'editor' ? 'active' : ''}" id="tab-editor">
          <div class="card">
            <div class="flex justify-between items-center mb-md">
              <h3>Texto del Guión Literario</h3>
              <div class="flex gap-sm">
                <button class="btn btn-sm btn-secondary" onclick="GuionModule.viewCurrentScriptInApp()">👁️ Ver en Visor Interno</button>
                <button class="btn btn-sm btn-primary" id="btnSaveScript">💾 Guardar Cambios</button>
              </div>
            </div>
            <div class="form-group">
              <textarea class="form-textarea screenplay-editor" id="guionTexto" placeholder="Escribe tu guión aquí o carga tu archivo (PDF, DOCX, TXT, Fountain) desde tu PC...&#10;&#10;Ejemplo:&#10;INT. CASA DE ANA - DÍA&#10;&#10;ANA (30) camina hacia la ventana con un café en la mano. Mirada perdida.">${g.guionTexto || ''}</textarea>
            </div>
          </div>
        </div>

        <!-- Tab 2: Logline & Tagline -->
        <div class="tab-content ${this.activeTab === 'logline' ? 'active' : ''}" id="tab-logline">
          <div class="grid-2">
            <div class="card">
              <div class="card-header">
                <h3>💡 Logline (Idea Central)</h3>
                <span class="text-muted text-xs">1-2 oraciones que resumen conflicto y protagonista</span>
              </div>
              <div class="form-group">
                <textarea class="form-textarea" id="gLogline" style="min-height:120px" placeholder="Ej: Cuando un astrónomo solitario detecta una señal desconocida desde Marte, debe elegir entre revelar el hallazgo al mundo o proteger a su familia de las consecuencias.">${g.logline || ''}</textarea>
              </div>
              <button class="btn btn-primary btn-sm" id="btnSaveLogline">💾 Guardar Logline</button>
            </div>

            <div class="card">
              <div class="card-header">
                <h3>🔥 Tagline (Frase Gancho / Eslogan)</h3>
                <span class="text-muted text-xs">Frase publicitaria impactante</span>
              </div>
              <div class="form-group">
                <textarea class="form-textarea" id="gTagline" style="min-height:120px" placeholder="Ej: El silencio no es una opción cuando el universo responde.">${g.tagline || ''}</textarea>
              </div>
              <button class="btn btn-primary btn-sm" id="btnSaveTagline">💾 Guardar Tagline</button>
            </div>
          </div>
        </div>

        <!-- Tab 3: Sinopsis & Tratamiento -->
        <div class="tab-content ${this.activeTab === 'sinopsis' ? 'active' : ''}" id="tab-sinopsis">
          <div class="card mb-lg">
            <div class="card-header">
              <h3>📖 Sinopsis Corta (1 Párrafo)</h3>
            </div>
            <div class="form-group">
              <textarea class="form-textarea" id="gSinopsisCorta" style="min-height:100px">${g.sinopsisCorta || ''}</textarea>
            </div>
          </div>

          <div class="card mb-lg">
            <div class="card-header">
              <h3>📚 Sinopsis Argumental Larga</h3>
            </div>
            <div class="form-group">
              <textarea class="form-textarea" id="gSinopsisLarga" style="min-height:160px">${g.sinopsisLarga || ''}</textarea>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3>🎬 Tratamiento Dramático / Nota de Intención</h3>
            </div>
            <div class="form-group">
              <textarea class="form-textarea" id="gTratamiento" style="min-height:180px">${g.tratamiento || ''}</textarea>
            </div>
            <button class="btn btn-primary" id="btnSaveSinopsis">💾 Guardar Textos</button>
          </div>
        </div>

        <!-- Tab 4: Escaleta -->
        <div class="tab-content ${this.activeTab === 'escaleta' ? 'active' : ''}" id="tab-escaleta">
          <div class="card">
            <div class="flex justify-between items-center mb-md">
              <h3>📊 Escaleta de Escenas</h3>
              <div class="flex gap-sm">
                <button class="btn btn-sm btn-secondary" onclick="App.autoParseProjectFile(Storage.getProject().guion)">⚡ Generar desde Guion</button>
                <button class="btn btn-sm btn-primary" onclick="GuionModule.showEscenaModal()">+ Nueva Escena</button>
              </div>
            </div>
            ${(g.escaleta || []).length === 0 ? `
              <div class="empty-state">
                <div class="empty-icon">📊</div>
                <h3>Escaleta vacía</h3>
                <p>Usa el botón "⚡ Generar desde Guion" para desglosar el texto automáticamente o agrega escenas manualmente.</p>
              </div>
            ` : `
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th style="width:60px">Nº</th>
                      <th>Encabezado / Locación</th>
                      <th>Int / Ext</th>
                      <th>Día / Noche</th>
                      <th>Resumen de Acción</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${g.escaleta.map((e, i) => `
                      <tr>
                        <td><strong>${e.numero || i + 1}</strong></td>
                        <td><strong>${e.encabezado || e.locacion}</strong></td>
                        <td><span class="tag tag-gold">${e.interiorExterior || 'INT'}</span></td>
                        <td>${e.diaNoche || 'DÍA'}</td>
                        <td>${e.resumen || '-'}</td>
                        <td>
                          <div class="cell-actions">
                            <button class="btn btn-ghost btn-sm btn-icon" onclick="GuionModule.showEscenaModal(${i})">✏️</button>
                            <button class="btn btn-ghost btn-sm btn-icon" onclick="GuionModule.deleteEscena(${i})">🗑️</button>
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

        <!-- Tab 5: Tarjetas de Escena -->
        <div class="tab-content ${this.activeTab === 'tarjetas' ? 'active' : ''}" id="tab-tarjetas">
          <div class="flex justify-between items-center mb-lg">
            <h3>🃏 Tarjetas de Escenas (Kanban)</h3>
            <button class="btn btn-sm btn-primary" onclick="GuionModule.showTarjetaModal()">+ Nueva Tarjeta</button>
          </div>
          ${(g.tarjetas || []).length === 0 ? `
            <div class="empty-state card">
              <div class="empty-icon">🃏</div>
              <h3>Sin tarjetas de escena</h3>
              <p>Genera las tarjetas automáticamente desde el guión cargado o crea tarjetas individuales.</p>
            </div>
          ` : `
            <div class="grid-3">
              ${g.tarjetas.map((t, i) => `
                <div class="card" style="background:var(--bg-elevated);border-top:3px solid var(--accent-gold);">
                  <div class="flex justify-between items-center mb-xs">
                    <span class="tag tag-gold">Escena ${t.numero || i + 1}</span>
                    <span class="tag tag-neutral">${t.interiorExterior || 'INT'} / ${t.diaNoche || 'DÍA'}</span>
                  </div>
                  <h4 style="color:var(--text-primary);margin:6px 0">${t.titulo || 'Sin título'}</h4>
                  <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:8px">${t.descripcion || ''}</p>
                  <div style="font-size:0.78rem;color:var(--accent-gold-light)">👥 Personajes: ${t.personajes || 'Sin definir'}</div>
                  <div class="divider" style="margin:10px 0"></div>
                  <div class="flex justify-end gap-xs">
                    <button class="btn btn-ghost btn-sm btn-icon" onclick="GuionModule.showTarjetaModal(${i})">✏️</button>
                    <button class="btn btn-ghost btn-sm btn-icon" onclick="GuionModule.deleteTarjeta(${i})">🗑️</button>
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
    const tabs = document.getElementById('guionTabs');
    if (tabs) {
      tabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;
        this.activeTab = btn.dataset.tab;
        document.querySelectorAll('#guionTabs .tab-btn').forEach(b => b.classList.toggle('active', b === btn));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === 'tab-' + btn.dataset.tab));
      });
    }

    const btnSaveScript = document.getElementById('btnSaveScript');
    if (btnSaveScript) {
      btnSaveScript.addEventListener('click', () => {
        const proj = Storage.getProject();
        if (!proj.guion) proj.guion = {};
        proj.guion.guionTexto = document.getElementById('guionTexto').value;
        Storage.saveProject(proj);
        App.toast('Guión guardado', 'success');
      });
    }

    const btnSaveLog = document.getElementById('btnSaveLogline');
    if (btnSaveLog) {
      btnSaveLog.addEventListener('click', () => {
        const proj = Storage.getProject();
        if (!proj.guion) proj.guion = {};
        proj.guion.logline = document.getElementById('gLogline').value;
        Storage.saveProject(proj);
        App.toast('Logline guardado', 'success');
      });
    }

    const btnSaveTag = document.getElementById('btnSaveTagline');
    if (btnSaveTag) {
      btnSaveTag.addEventListener('click', () => {
        const proj = Storage.getProject();
        if (!proj.guion) proj.guion = {};
        proj.guion.tagline = document.getElementById('gTagline').value;
        Storage.saveProject(proj);
        App.toast('Tagline guardado', 'success');
      });
    }

    const btnSaveSin = document.getElementById('btnSaveSinopsis');
    if (btnSaveSin) {
      btnSaveSin.addEventListener('click', () => {
        const proj = Storage.getProject();
        if (!proj.guion) proj.guion = {};
        proj.guion.sinopsisCorta = document.getElementById('gSinopsisCorta').value;
        proj.guion.sinopsisLarga = document.getElementById('gSinopsisLarga').value;
        proj.guion.tratamiento = document.getElementById('gTratamiento').value;
        Storage.saveProject(proj);
        App.toast('Sinopsis y Tratamiento guardados', 'success');
      });
    }

    const btnFile = document.getElementById('btnImportGuionFile');
    const inputFile = document.getElementById('guionFileInput');
    if (btnFile && inputFile) {
      btnFile.addEventListener('click', () => inputFile.click());
      inputFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          App.readFileUniversal(file, (res) => {
            App.toast(`Cargado archivo "${file.name}" (${res.ext.toUpperCase()})`, 'info');
            App.autoParseProjectFile(res);
          });
          e.target.value = '';
        }
      });
    }

    const btnParse = document.getElementById('btnAutoParseGuion');
    if (btnParse) {
      btnParse.addEventListener('click', () => {
        const proj = Storage.getProject();
        if (!proj || !proj.guion || !proj.guion.guionTexto) {
          App.toast('Escribe o carga un guion primero para desglosar', 'warning');
          return;
        }
        App.autoParseProjectFile({ name: 'Guión Actual', ext: 'txt', content: proj.guion.guionTexto });
      });
    }
  },

  viewCurrentScriptInApp() {
    const proj = Storage.getProject();
    const text = (proj && proj.guion) ? proj.guion.guionTexto : '';
    App.showInAppFileViewer({
      name: 'Guión Literario - ' + (proj ? proj.name : 'Proyecto'),
      ext: 'txt',
      type: 'text',
      content: text || 'Sin contenido de guión escrito aún.'
    });
  },

  showEscenaModal(idx) {
    const proj = Storage.getProject();
    const list = (proj.guion && proj.guion.escaleta) ? proj.guion.escaleta : [];
    const e = idx !== undefined ? list[idx] : {};

    App.showModal(`
      <div class="modal-header"><h2>${idx !== undefined ? 'Editar' : 'Nueva'} Escena (Escaleta)</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Nº Escena</label><input class="form-input" id="eNum" value="${e.numero || (list.length + 1)}"></div>
          <div class="form-group"><label class="form-label">INT / EXT</label><input class="form-input" id="eTipo" value="${e.interiorExterior || 'INT'}"></div>
        </div>
        <div class="form-group"><label class="form-label">Encabezado / Locación</label><input class="form-input" id="eEnc" value="${e.encabezado || e.locacion || ''}"></div>
        <div class="form-group"><label class="form-label">DÍA / NOCHE</label><input class="form-input" id="eTiempo" value="${e.diaNoche || 'DÍA'}"></div>
        <div class="form-group"><label class="form-label">Resumen de la Acción</label><textarea class="form-textarea" id="eRes" style="min-height:80px">${e.resumen || ''}</textarea></div>
      </div>
      <div class="modal-footer"><button class="btn btn-secondary modal-close">Cancelar</button><button class="btn btn-primary" id="btnSaveEsc">Guardar Escena</button></div>
    `);

    document.getElementById('btnSaveEsc').addEventListener('click', () => {
      const data = {
        numero: document.getElementById('eNum').value,
        interiorExterior: document.getElementById('eTipo').value,
        encabezado: document.getElementById('eEnc').value,
        diaNoche: document.getElementById('eTiempo').value,
        resumen: document.getElementById('eRes').value
      };

      if (!proj.guion) proj.guion = {};
      if (!proj.guion.escaleta) proj.guion.escaleta = [];
      if (idx !== undefined) { proj.guion.escaleta[idx] = data; } else { proj.guion.escaleta.push(data); }
      Storage.saveProject(proj);
      App.closeModal();
      App.toast('Escena guardada', 'success');
      App.navigate('guion');
      this.activeTab = 'escaleta';
    });
  },

  deleteEscena(idx) {
    const proj = Storage.getProject();
    proj.guion.escaleta.splice(idx, 1);
    Storage.saveProject(proj);
    App.navigate('guion');
    this.activeTab = 'escaleta';
  },

  showTarjetaModal(idx) {
    const proj = Storage.getProject();
    const list = (proj.guion && proj.guion.tarjetas) ? proj.guion.tarjetas : [];
    const t = idx !== undefined ? list[idx] : {};

    App.showModal(`
      <div class="modal-header"><h2>${idx !== undefined ? 'Editar' : 'Nueva'} Tarjeta de Escena</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Nº Escena</label><input class="form-input" id="tNum" value="${t.numero || (list.length + 1)}"></div>
          <div class="form-group"><label class="form-label">Título de la Tarjeta</label><input class="form-input" id="tTit" value="${t.titulo || ''}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">INT / EXT</label><input class="form-input" id="tTipo" value="${t.interiorExterior || 'INT'}"></div>
          <div class="form-group"><label class="form-label">DÍA / NOCHE</label><input class="form-input" id="tTiempo" value="${t.diaNoche || 'DÍA'}"></div>
        </div>
        <div class="form-group"><label class="form-label">Personajes Presentes</label><input class="form-input" id="tPers" value="${t.personajes || ''}"></div>
        <div class="form-group"><label class="form-label">Descripción</label><textarea class="form-textarea" id="tDesc" style="min-height:80px">${t.descripcion || ''}</textarea></div>
      </div>
      <div class="modal-footer"><button class="btn btn-secondary modal-close">Cancelar</button><button class="btn btn-primary" id="btnSaveTarj">Guardar Tarjeta</button></div>
    `);

    document.getElementById('btnSaveTarj').addEventListener('click', () => {
      const data = {
        numero: document.getElementById('tNum').value,
        titulo: document.getElementById('tTit').value,
        interiorExterior: document.getElementById('tTipo').value,
        diaNoche: document.getElementById('tTiempo').value,
        personajes: document.getElementById('tPers').value,
        descripcion: document.getElementById('tDesc').value
      };

      if (!proj.guion) proj.guion = {};
      if (!proj.guion.tarjetas) proj.guion.tarjetas = [];
      if (idx !== undefined) { proj.guion.tarjetas[idx] = data; } else { proj.guion.tarjetas.push(data); }
      Storage.saveProject(proj);
      App.closeModal();
      App.toast('Tarjeta guardada', 'success');
      App.navigate('guion');
      this.activeTab = 'tarjetas';
    });
  },

  deleteTarjeta(idx) {
    const proj = Storage.getProject();
    proj.guion.tarjetas.splice(idx, 1);
    Storage.saveProject(proj);
    App.navigate('guion');
    this.activeTab = 'tarjetas';
  }
};

App.registerModule('guion', GuionModule);
