/* CinePrep - Archivos & Nube Drive del Proyecto (Visor Integrado de PDF, DOCX, XLSX, MP4, MOV) */
const DriveModule = {
  render() {
    if (!App.requireProject()) return '<div class="empty-state"><div class="empty-icon">📁</div><h3>Crea un proyecto primero</h3><p>Ve al Dashboard para crear un nuevo proyecto.</p><button class="btn btn-primary" onclick="App.navigate(\'dashboard\')">Ir al Dashboard</button></div>';
    const project = Storage.getProject();
    const archivos = project.archivosDrive || [];

    return `
      <div class="page-header">
        <h1><span class="header-icon">📁</span> Archivos del Proyecto & Nube (Drive)</h1>
        <p class="page-subtitle">Guarda y abre todo tipo de archivos (PDF, Word, Excel, MP4, MOV, Fotos) directamente en la app sin descargarlos</p>
        <div class="page-header-actions">
          <button class="btn btn-primary btn-sm" id="btnUploadDriveFile">📥 Cargar Archivos (PDF, DOCS, EXCEL, MP4, MOV)</button>
          <input type="file" id="driveFileInput" accept="*/*" multiple style="display:none">
          <button class="btn btn-secondary btn-sm" onclick="DriveModule.showLinkDriveModal()">🔗 Vincular Enlace Google Drive</button>
        </div>
      </div>
      <div class="page-body">
        <div class="card mb-lg card-accent">
          <div class="flex justify-between items-center">
            <div>
              <h3>☁️ Nube Integrada del Proyecto: <span class="text-gold">${project.name}</span></h3>
              <p style="font-size:0.9rem;color:var(--text-secondary);margin-top:4px">Todos los archivos cargados se almacenan dentro del proyecto y pueden previsualizarse en tiempo real con el <strong>Visor Interno de CinePrep</strong> (sin descargas) y desglosarse automáticamente en los módulos.</p>
            </div>
            <span class="tag tag-gold" style="font-size:0.9rem">${archivos.length} Archivos Almacenados</span>
          </div>
        </div>

        <h3 class="mb-md">📂 Biblioteca de Archivos del Proyecto</h3>
        ${archivos.length === 0 ? `
          <div class="empty-state card">
            <div class="empty-icon">📁</div>
            <h3>Sin archivos en la nube del proyecto</h3>
            <p>Carga guiones en PDF, planillas de Excel, videos MP4/MOV de locaciones, fotos de casting o documentos de Word.</p>
            <div class="flex gap-sm justify-center mt-md">
              <button class="btn btn-primary" onclick="document.getElementById('driveFileInput').click()">📥 Cargar Archivos desde PC</button>
              <button class="btn btn-secondary" onclick="DriveModule.showLinkDriveModal()">🔗 Vincular Google Drive</button>
            </div>
          </div>
        ` : `
          <div class="grid-3">
            ${archivos.map((file, i) => `
              <div class="card animate-fade-in" style="display:flex;flex-direction:column;justify-space-between;gap:12px;background:var(--bg-elevated);border:1px solid var(--border-strong);">
                <div class="flex items-start gap-sm">
                  <span style="font-size:2.2rem">${this.getFileIcon(file.ext, file.type)}</span>
                  <div style="overflow:hidden;flex:1">
                    <strong style="font-size:0.95rem;color:#ffffff;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${file.name}">${file.name}</strong>
                    <span class="tag tag-neutral mt-xs" style="font-size:0.72rem;text-transform:uppercase">${(file.ext || 'FILE').toUpperCase()}</span>
                    <span style="font-size:0.75rem;color:var(--text-muted);display:block;margin-top:4px">Agregado: ${App.formatDate((file.fecha || '').split('T')[0])}</span>
                  </div>
                </div>

                <div class="divider" style="margin:4px 0"></div>

                <div class="flex justify-between items-center">
                  <button class="btn btn-primary btn-sm" onclick="DriveModule.openFileViewer(${i})" style="flex:1;margin-right:6px;justify-center">👁️ Abrir en CinePrep</button>
                  ${['pdf', 'txt', 'fountain', 'md', 'docx', 'doc', 'csv', 'xlsx', 'xls'].includes((file.ext || '').toLowerCase()) ? `
                    <button class="btn btn-secondary btn-sm btn-icon" title="Desglosar contenido en módulos" onclick="DriveModule.autoParseFile(${i})">⚡</button>
                  ` : ''}
                  <button class="btn btn-ghost btn-sm btn-icon" title="Eliminar" onclick="DriveModule.deleteFile(${i})">🗑️</button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  getFileIcon(ext, type) {
    ext = (ext || '').toLowerCase();
    if (ext === 'pdf') return '📄';
    if (['doc', 'docx'].includes(ext)) return '📑';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext) || type === 'video') return '🎬';
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext) || type === 'audio') return '🎵';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) || type === 'image') return '🖼️';
    return '📁';
  },

  afterRender() {
    const btnUpload = document.getElementById('btnUploadDriveFile');
    const inputUpload = document.getElementById('driveFileInput');

    if (btnUpload && inputUpload) {
      btnUpload.addEventListener('click', () => inputUpload.click());
      inputUpload.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
          let count = 0;
          const proj = Storage.getProject();
          if (!proj.archivosDrive) proj.archivosDrive = [];

          files.forEach(file => {
            App.readFileUniversal(file, (res) => {
              proj.archivosDrive.push({
                name: file.name,
                ext: res.ext,
                type: res.type,
                content: res.content,
                dataUrl: res.dataUrl,
                rows: res.rows || null,
                fecha: new Date().toISOString()
              });
              count++;
              if (count === files.length) {
                Storage.saveProject(proj);
                App.toast(`¡Se agregaron ${files.length} archivos a la Nube del proyecto!`, 'success');
                App.navigate('drive');
              }
            });
          });
          e.target.value = '';
        }
      });
    }
  },

  openFileViewer(idx) {
    const proj = Storage.getProject();
    const file = (proj.archivosDrive || [])[idx];
    if (!file) return;

    App.showInAppFileViewer(file);
  },

  autoParseFile(idx) {
    const proj = Storage.getProject();
    const file = (proj.archivosDrive || [])[idx];
    if (!file) return;

    App.toast(`Analizando contenido de "${file.name}"...`, 'info');
    App.autoParseProjectFile(file);
  },

  deleteFile(idx) {
    if (!confirm('¿Eliminar este archivo de la nube del proyecto?')) return;
    const proj = Storage.getProject();
    proj.archivosDrive.splice(idx, 1);
    Storage.saveProject(proj);
    App.toast('Archivo eliminado', 'warning');
    App.navigate('drive');
  },

  showLinkDriveModal() {
    App.showModal(`
      <div class="modal-header"><h2>🔗 Vincular Enlace Google Drive / Nube External</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">Nombre del Documento / Carpeta</label><input class="form-input" id="driveLinkName" placeholder="Ej: Carpeta de Producción Google Drive / Guión Final"></div>
        <div class="form-group"><label class="form-label">Enlace URL (https://drive.google.com/...)</label><input class="form-input" id="driveLinkUrl" placeholder="https://drive.google.com/file/d/..."></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary modal-close">Cancelar</button>
        <button class="btn btn-primary" id="btnSaveDriveLink">💾 Guardar Enlace</button>
      </div>
    `);

    document.getElementById('btnSaveDriveLink').addEventListener('click', () => {
      const name = document.getElementById('driveLinkName').value.trim();
      const url = document.getElementById('driveLinkUrl').value.trim();
      if (!name || !url) return;

      const proj = Storage.getProject();
      if (!proj.archivosDrive) proj.archivosDrive = [];
      proj.archivosDrive.push({
        name,
        ext: 'drive',
        type: 'document',
        dataUrl: url,
        content: url,
        fecha: new Date().toISOString()
      });

      Storage.saveProject(proj);
      App.closeModal();
      App.toast('Enlace Google Drive guardado', 'success');
      App.navigate('drive');
    });
  }
};

App.registerModule('drive', DriveModule);
