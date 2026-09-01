/* CinePrep - Moodboard Module (Acepta todo tipo de archivos: Imágenes, Videos, PDF, Excel, Word) */
const MoodboardModule = {
  activeTab: 'arte',

  render() {
    if (!App.requireProject()) return '<div class="empty-state"><div class="empty-icon">🎨</div><h3>Crea un proyecto primero</h3><p>Ve al Dashboard para crear un nuevo proyecto.</p><button class="btn btn-primary" onclick="App.navigate(\'dashboard\')">Ir al Dashboard</button></div>';
    const project = Storage.getProject();
    const mb = project.moodboards || { vestuario: [], arte: [] };

    return `
      <div class="page-header">
        <h1><span class="header-icon">🎨</span> Moodboards Conceptuales</h1>
        <p class="page-subtitle">Inspiración visual con carga de TODO TIPO de archivos (JPG, PNG, MP4, PDF, Word, Excel, etc.)</p>
        <div class="page-header-actions">
          <button class="btn btn-secondary btn-sm" id="btnBatchUploadMB">📂 Cargar Archivos desde PC (Todo Formato)</button>
          <input type="file" id="batchMBInput" accept="*/*" multiple style="display:none">
        </div>
      </div>
      <div class="page-body">
        <div class="tabs mb-lg" id="moodTabs">
          <button class="tab-btn ${this.activeTab === 'arte' ? 'active' : ''}" data-tab="arte">🏛️ Arte & Escenografía</button>
          <button class="tab-btn ${this.activeTab === 'vestuario' ? 'active' : ''}" data-tab="vestuario">👗 Vestuario & Maquillaje</button>
        </div>

        <div class="tab-content ${this.activeTab === 'arte' ? 'active' : ''}" id="tab-arte">
          <div class="flex justify-between items-center mb-lg">
            <h3>🏛️ Arte & Escenografía</h3>
            <div class="flex gap-sm">
              <button class="btn btn-sm btn-secondary" onclick="document.getElementById('batchMBInput').click()">📂 Cargar Archivos desde PC</button>
              <button class="btn btn-sm btn-primary" onclick="MoodboardModule.showItemModal('arte')">+ Agregar Elemento</button>
            </div>
          </div>
          ${this.renderGrid(mb.arte || [], 'arte')}
        </div>

        <div class="tab-content ${this.activeTab === 'vestuario' ? 'active' : ''}" id="tab-vestuario">
          <div class="flex justify-between items-center mb-lg">
            <h3>👗 Vestuario & Maquillaje</h3>
            <div class="flex gap-sm">
              <button class="btn btn-sm btn-secondary" onclick="document.getElementById('batchMBInput').click()">📂 Cargar Archivos desde PC</button>
              <button class="btn btn-sm btn-primary" onclick="MoodboardModule.showItemModal('vestuario')">+ Agregar Elemento</button>
            </div>
          </div>
          ${this.renderGrid(mb.vestuario || [], 'vestuario')}
        </div>
      </div>
    `;
  },

  renderGrid(items, category) {
    if (items.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">🎨</div>
          <h3>Moodboard vacío</h3>
          <p>Agrega archivos de referencia (Imágenes, Videos, PDFs, Documentos) desde tu PC.</p>
          <div class="flex gap-sm justify-center">
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('batchMBInput').click()">📂 Cargar Archivos desde PC</button>
            <button class="btn btn-primary btn-sm" onclick="MoodboardModule.showItemModal('${category}')">+ Agregar Elemento Manual</button>
          </div>
        </div>
      `;
    }

    return `
      <div class="moodboard-grid">
        ${items.map((item, i) => `
          <div class="mood-item">
            <div class="mood-image">
              ${App.renderMediaElement(item)}
            </div>
            <div class="mood-info">
              <div class="flex justify-between items-center">
                <div class="mood-title">${item.titulo || 'Sin título'}</div>
                <div class="cell-actions">
                  <button class="btn btn-ghost btn-sm btn-icon" onclick="MoodboardModule.showItemModal('${category}', ${i})">✏️</button>
                  <button class="btn btn-ghost btn-sm btn-icon" onclick="MoodboardModule.deleteItem('${category}', ${i})">🗑️</button>
                </div>
              </div>
              ${item.personajeLocacion ? `<div style="font-size:0.78rem;color:var(--accent-gold-light);margin-bottom:4px">📌 ${item.personajeLocacion}</div>` : ''}
              <div class="mood-notes">${item.notas || ''}</div>
              ${item.colores ? `
                <div class="palette-row">
                  ${item.colores.split(',').map(c => `<div class="color-swatch" style="background:${c.trim()}" title="${c.trim()}"></div>`).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  afterRender() {
    const tabs = document.getElementById('moodTabs');
    if (tabs) {
      tabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;
        this.activeTab = btn.dataset.tab;
        document.querySelectorAll('#moodTabs .tab-btn').forEach(b => b.classList.toggle('active', b === btn));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === 'tab-' + btn.dataset.tab));
      });
    }

    const btnBatch = document.getElementById('btnBatchUploadMB');
    const inputBatch = document.getElementById('batchMBInput');
    if (btnBatch && inputBatch) {
      btnBatch.addEventListener('click', () => inputBatch.click());
      inputBatch.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
          let loaded = 0;
          const proj = Storage.getProject();
          if (!proj.moodboards) proj.moodboards = { vestuario: [], arte: [] };
          const category = this.activeTab;
          if (!proj.moodboards[category]) proj.moodboards[category] = [];

          files.forEach((file) => {
            App.readFileUniversal(file, (res) => {
              proj.moodboards[category].push({
                titulo: file.name.replace(/\.[^/.]+$/, ""),
                personajeLocacion: 'Cargado desde PC (' + res.ext.toUpperCase() + ')',
                imagen: res.dataUrl || res.content,
                dataUrl: res.dataUrl,
                type: res.type,
                name: res.name,
                colores: '#1a1c30, #f3c258, #33395c',
                notas: 'Referencia importada'
              });
              loaded++;
              if (loaded === files.length) {
                Storage.saveProject(proj);
                App.toast(`¡Se agregaron ${files.length} archivos al Moodboard de ${category === 'arte' ? 'Arte' : 'Vestuario'}!`, 'success');
                App.navigate('moodboard');
              }
            });
          });
          e.target.value = '';
        }
      });
    }
  },

  showItemModal(category, idx) {
    const project = Storage.getProject();
    const list = (project.moodboards && project.moodboards[category]) ? project.moodboards[category] : [];
    const item = idx !== undefined ? list[idx] : {};

    App.showModal(`
      <div class="modal-header"><h2>${idx !== undefined ? 'Editar' : 'Nuevo'} Elemento (${category === 'arte' ? 'Arte' : 'Vestuario'})</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">Título</label><input class="form-input" id="mbTitulo" value="${item.titulo || ''}" placeholder="Ej: Paleta principal de la sala / Traje de Gala Ana"></div>
        <div class="form-group"><label class="form-label">${category === 'arte' ? 'Locación / Set / Escena' : 'Personaje / Rol'}</label><input class="form-input" id="mbRef" value="${item.personajeLocacion || ''}" placeholder="${category === 'arte' ? 'Ej: Casa Abandonada Escena 4' : 'Ej: Carlos (Protagonista)'}"></div>
        <div class="form-group">
          <label class="form-label">Archivo de Referencia (Imagen, Video, PDF, Word, etc.)</label>
          <input class="form-input mb-sm" id="mbImgUrl" value="${item.imagen || ''}" placeholder="https://...">
          <input type="file" id="mbImgFile" accept="*/*" class="form-input" style="padding:6px">
        </div>
        <div class="form-group"><label class="form-label">Paleta de Colores (hex separados por coma)</label><input class="form-input" id="mbColores" value="${item.colores || '#1a1c30, #f3c258, #33395c'}" placeholder="#ffffff, #000000, #f3c258"></div>
        <div class="form-group"><label class="form-label">Notas y Texturas / Materiales</label><textarea class="form-textarea" id="mbNotas" style="min-height:80px">${item.notas || ''}</textarea></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary modal-close">Cancelar</button>
        <button class="btn btn-primary" id="btnSaveMbItem">💾 Guardar</button>
      </div>
    `);

    const fileInput = document.getElementById('mbImgFile');
    let loadedFileRes = null;

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        App.readFileUniversal(file, (res) => {
          loadedFileRes = res;
          document.getElementById('mbImgUrl').value = res.dataUrl || res.content;
          App.toast(`Archivo "${file.name}" listo (${res.ext.toUpperCase()})`, 'info');
        });
      }
    });

    document.getElementById('btnSaveMbItem').addEventListener('click', () => {
      const data = {
        titulo: document.getElementById('mbTitulo').value,
        personajeLocacion: document.getElementById('mbRef').value,
        imagen: document.getElementById('mbImgUrl').value,
        dataUrl: loadedFileRes ? loadedFileRes.dataUrl : item.dataUrl,
        type: loadedFileRes ? loadedFileRes.type : (item.type || 'image'),
        name: loadedFileRes ? loadedFileRes.name : item.name,
        colores: document.getElementById('mbColores').value,
        notas: document.getElementById('mbNotas').value
      };

      const proj = Storage.getProject();
      if (!proj.moodboards) proj.moodboards = { vestuario: [], arte: [] };
      if (!proj.moodboards[category]) proj.moodboards[category] = [];
      if (idx !== undefined) { proj.moodboards[category][idx] = data; } else { proj.moodboards[category].push(data); }
      Storage.saveProject(proj);
      App.closeModal();
      App.toast('Elemento guardado', 'success');
      App.navigate('moodboard');
      this.activeTab = category;
    });
  },

  deleteItem(category, idx) {
    if (!confirm('¿Eliminar este elemento?')) return;
    const proj = Storage.getProject();
    proj.moodboards[category].splice(idx, 1);
    Storage.saveProject(proj);
    App.toast('Elemento eliminado', 'warning');
    App.navigate('moodboard');
    this.activeTab = category;
  }
};

App.registerModule('moodboard', MoodboardModule);
