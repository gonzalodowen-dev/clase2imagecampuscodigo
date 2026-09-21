/* CinePrep - Storyboard Module (Acepta todo tipo de archivos: Imágenes, Videos MP4, PDF, Docs) */
const StoryboardModule = {
  render() {
    if (!App.requireProject()) return '<div class="empty-state"><div class="empty-icon">🖼️</div><h3>Crea un proyecto primero</h3><p>Ve al Dashboard para crear un nuevo proyecto.</p><button class="btn btn-primary" onclick="App.navigate(\'dashboard\')">Ir al Dashboard</button></div>';
    const project = Storage.getProject();
    const frames = (project.storyboard && project.storyboard.frames) ? project.storyboard.frames : [];

    return `
      <div class="page-header">
        <h1><span class="header-icon">🖼️</span> Storyboard & Animatic</h1>
        <p class="page-subtitle">Visualización plano a plano (Acepta todo tipo de archivos: Imágenes, Videos MP4, PDF, Word, etc.)</p>
        <div class="page-header-actions">
          <button class="btn btn-secondary btn-sm" id="btnBatchUploadSB">📂 Cargar Archivos desde PC (Todo Formato)</button>
          <input type="file" id="batchSBInput" accept="*/*" multiple style="display:none">
          <button class="btn btn-primary btn-sm" id="btnAddFrame">+ Agregar Frame</button>
        </div>
      </div>
      <div class="page-body">
        ${frames.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">🖼️</div>
            <h3>Sin cuadros en el Storyboard</h3>
            <p>Selecciona archivos desde tu PC (JPG, PNG, MP4, PDF, Word) para cargarlos automáticamente o crea bocetos manualmente.</p>
            <div class="flex gap-sm justify-center mt-md">
              <button class="btn btn-secondary" onclick="document.getElementById('batchSBInput').click()">📂 Cargar Archivos desde PC</button>
              <button class="btn btn-primary" onclick="StoryboardModule.showFrameModal()">+ Crear Frame Manual</button>
            </div>
          </div>
        ` : `
          <div class="storyboard-grid">
            ${frames.map((f, i) => `
              <div class="storyboard-frame">
                <div class="frame-image">
                  ${App.renderMediaElement(f)}
                </div>
                <div class="frame-info">
                  <div class="flex justify-between items-center mb-sm">
                    <div class="frame-number">ESC. ${f.escena || '1'} / PLANO ${f.plano || i + 1}</div>
                    <div class="cell-actions">
                      <button class="btn btn-ghost btn-sm btn-icon" onclick="StoryboardModule.showFrameModal(${i})">✏️</button>
                      <button class="btn btn-ghost btn-sm btn-icon" onclick="StoryboardModule.deleteFrame(${i})">🗑️</button>
                    </div>
                  </div>
                  <div class="frame-desc" style="font-weight:600;margin-bottom:4px">${f.accion || 'Sin descripción de acción'}</div>
                  ${f.dialogo ? `<div style="font-size:0.78rem;color:var(--accent-gold-light);font-style:italic">"${f.dialogo}"</div>` : ''}
                  ${f.notas ? `<div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">📝 ${f.notas}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  afterRender() {
    const btn = document.getElementById('btnAddFrame');
    if (btn) btn.addEventListener('click', () => this.showFrameModal());

    const btnBatch = document.getElementById('btnBatchUploadSB');
    const inputBatch = document.getElementById('batchSBInput');
    if (btnBatch && inputBatch) {
      btnBatch.addEventListener('click', () => inputBatch.click());
      inputBatch.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
          let loaded = 0;
          const proj = Storage.getProject();
          if (!proj.storyboard) proj.storyboard = { frames: [] };

          files.forEach((file) => {
            App.readFileUniversal(file, (res) => {
              proj.storyboard.frames.push({
                escena: '1',
                plano: proj.storyboard.frames.length + 1,
                imagen: res.dataUrl || res.content,
                dataUrl: res.dataUrl,
                type: res.type,
                name: res.name,
                accion: file.name.replace(/\.[^/.]+$/, ""),
                dialogo: '',
                notas: 'Cargado desde PC (' + res.ext.toUpperCase() + ')'
              });
              loaded++;
              if (loaded === files.length) {
                Storage.saveProject(proj);
                App.toast(`¡Se cargaron ${files.length} archivos al Storyboard!`, 'success');
                App.navigate('storyboard');
              }
            });
          });
          e.target.value = '';
        }
      });
    }
  },

  showFrameModal(idx) {
    const project = Storage.getProject();
    const f = (idx !== undefined && project.storyboard && project.storyboard.frames) ? project.storyboard.frames[idx] : {};

    App.showModal(`
      <div class="modal-header"><h2>${idx !== undefined ? 'Editar' : 'Nuevo'} Frame de Storyboard</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Nº Escena</label><input class="form-input" id="sbEscena" value="${f.escena || '1'}"></div>
          <div class="form-group"><label class="form-label">Nº Plano</label><input class="form-input" id="sbPlano" value="${f.plano || ''}"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Archivo de Referencia (Imagen, Video MP4, PDF, Word, etc.)</label>
          <input class="form-input mb-sm" id="sbImagenUrl" value="${f.imagen || ''}" placeholder="https://ejemplo.com/boceto.jpg o selecciona cualquier archivo abajo">
          <input type="file" id="sbImagenFile" accept="*/*" class="form-input" style="padding:6px">
        </div>
        <div class="form-group"><label class="form-label">Acción / Descripción Visual</label><textarea class="form-textarea" id="sbAccion" style="min-height:70px">${f.accion || ''}</textarea></div>
        <div class="form-group"><label class="form-label">Diálogo / Sonido</label><input class="form-input" id="sbDialogo" value="${f.dialogo || ''}"></div>
        <div class="form-group"><label class="form-label">Notas de Cámara / Lente</label><input class="form-input" id="sbNotas" value="${f.notas || ''}" placeholder="Ej: 35mm, movimiento lento hacia la derecha"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary modal-close">Cancelar</button>
        <button class="btn btn-primary" id="btnSaveFrame">💾 Guardar Frame</button>
      </div>
    `);

    const fileInput = document.getElementById('sbImagenFile');
    let loadedFileRes = null;

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        App.readFileUniversal(file, (res) => {
          loadedFileRes = res;
          document.getElementById('sbImagenUrl').value = res.dataUrl || res.content;
          App.toast(`Archivo "${file.name}" cargado (${res.ext.toUpperCase()})`, 'info');
        });
      }
    });

    document.getElementById('btnSaveFrame').addEventListener('click', () => {
      const data = {
        escena: document.getElementById('sbEscena').value,
        plano: document.getElementById('sbPlano').value,
        imagen: document.getElementById('sbImagenUrl').value,
        dataUrl: loadedFileRes ? loadedFileRes.dataUrl : f.dataUrl,
        type: loadedFileRes ? loadedFileRes.type : (f.type || 'image'),
        name: loadedFileRes ? loadedFileRes.name : f.name,
        accion: document.getElementById('sbAccion').value,
        dialogo: document.getElementById('sbDialogo').value,
        notas: document.getElementById('sbNotas').value
      };

      const proj = Storage.getProject();
      if (!proj.storyboard) proj.storyboard = { frames: [] };
      if (idx !== undefined) { proj.storyboard.frames[idx] = data; } else { proj.storyboard.frames.push(data); }
      Storage.saveProject(proj);
      App.closeModal();
      App.toast('Frame guardado', 'success');
      App.navigate('storyboard');
    });
  },

  deleteFrame(idx) {
    if (!confirm('¿Eliminar este frame?')) return;
    const proj = Storage.getProject();
    proj.storyboard.frames.splice(idx, 1);
    Storage.saveProject(proj);
    App.toast('Frame eliminado', 'warning');
    App.navigate('storyboard');
  }
};

App.registerModule('storyboard', StoryboardModule);
