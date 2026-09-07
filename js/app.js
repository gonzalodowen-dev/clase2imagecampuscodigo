/* CinePrep - Core Application Logic, Native Word DOCX Extractor, Excel Engine & Router */
const App = {
  activeModule: 'dashboard',
  modules: {},

  init() {
    this.setupNavigation();
    this.setupMobileMenu();
    this.setupImportExport();
    this.checkUrlInvites();
    this.navigate('dashboard');
  },

  registerModule(name, moduleObj) {
    this.modules[name] = moduleObj;
  },

  setupNavigation() {
    const bindNav = () => {
      document.querySelectorAll('[data-module]').forEach(item => {
        item.onclick = (e) => {
          e.preventDefault();
          const moduleName = item.dataset.module;
          if (moduleName) this.navigate(moduleName);
        };
      });
    };
    bindNav();
    setTimeout(bindNav, 500);
  },

  setupMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (btn && sidebar && overlay) {
      btn.onclick = (e) => {
        e.preventDefault();
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
      };
      overlay.onclick = (e) => {
        e.preventDefault();
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      };
    }
  },

  setupImportExport() {
    const btnExp = document.getElementById('btnExport');
    const btnImp = document.getElementById('btnImport');
    const fileImp = document.getElementById('importFile');
    const btnPDF = document.getElementById('btnExportPDF');
    const btnInvite = document.getElementById('btnInviteCollabSidebar');

    if (btnExp) {
      btnExp.onclick = () => {
        const project = Storage.getProject();
        if (!project) { this.toast('No hay ningún proyecto activo para exportar', 'warning'); return; }
        const jsonStr = JSON.stringify(project, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cineprep_${(project.name || 'proyecto').toLowerCase().replace(/\s+/g, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.toast('Proyecto exportado en JSON', 'success');
      };
    }

    if (btnImp && fileImp) {
      btnImp.onclick = () => fileImp.click();
      fileImp.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            try {
              const project = JSON.parse(evt.target.result);
              if (!project.id) project.id = 'proj_' + Date.now();
              Storage.saveProject(project);
              Storage.setActiveProjectId(project.id);
              this.toast('¡Proyecto importado exitosamente!', 'success');
              this.navigate('dashboard');
            } catch (err) {
              this.toast('Error al leer archivo JSON', 'danger');
            }
          };
          reader.readAsText(file);
          e.target.value = '';
        }
      };
    }

    if (btnPDF) {
      btnPDF.onclick = () => this.exportProjectPDF();
    }

    if (btnInvite) {
      btnInvite.onclick = () => {
        if (!this.requireProject()) return;
        ColaboradoresModule.showInviteLinkModal();
      };
    }
  },

  checkUrlInvites() {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('invite');
    if (inviteCode) {
      try {
        const payload = JSON.parse(decodeURIComponent(escape(atob(inviteCode))));
        setTimeout(() => {
          this.toast(`¡Invitación recibida para colaborar en "${payload.name}"!`, 'success');
          ColaboradoresModule.showRegisterModal();
        }, 800);
      } catch (e) {}
    }
  },

  navigate(moduleName) {
    if (!this.modules[moduleName]) {
      console.warn(`Modulo "${moduleName}" no registrado.`);
      return;
    }

    this.activeModule = moduleName;
    document.querySelectorAll('[data-module]').forEach(item => {
      item.classList.toggle('active', item.dataset.module === moduleName);
    });

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar && overlay) {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    }

    const main = document.getElementById('mainContent');
    if (main) {
      main.innerHTML = this.modules[moduleName].render();
      if (typeof this.modules[moduleName].afterRender === 'function') {
        this.modules[moduleName].afterRender();
      }
      main.scrollTop = 0;
    }
  },

  requireProject() {
    const project = Storage.getProject();
    if (!project) {
      this.toast('Crea o selecciona un proyecto para acceder', 'info');
      return false;
    }
    return true;
  },

  showModal(contentHtml, sizeClass = '') {
    const modal = document.getElementById('modalContent');
    const overlay = document.getElementById('modalOverlay');

    if (modal && overlay) {
      modal.className = `modal ${sizeClass}`;
      modal.innerHTML = contentHtml;
      overlay.classList.add('active');

      modal.querySelectorAll('.modal-close').forEach(btn => {
        btn.onclick = () => this.closeModal();
      });
    }
  },

  closeModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('active');
  },

  toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✓' : (type === 'warning' ? '⚠️' : (type === 'danger' ? '✕' : 'ℹ️'));
    toast.innerHTML = `<span style="font-weight:bold;margin-right:8px">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  formatCurrency(amount, currency = 'ARS') {
    const num = parseFloat(amount) || 0;
    const symbol = currency === 'EUR' ? '€' : '$';
    return `${symbol} ${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },

  formatDate(dateStr) {
    if (!dateStr) return 'N/I';
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    return `${d}/${m}/${y}`;
  },

  /* Universal File Reader (Handles Word DOCX, Excel, PDF, Text, Videos) */
  readFileUniversal(file, callback) {
    const name = file.name;
    const ext = name.split('.').pop().toLowerCase();

    // 1. Word Document Parser (.docx, .doc) via Mammoth
    if (['docx', 'doc'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        if (window.mammoth) {
          mammoth.extractRawText({ arrayBuffer: arrayBuffer }).then((result) => {
            const cleanText = result.value || '';
            callback({
              name,
              ext,
              type: 'text',
              content: cleanText,
              dataUrl: cleanText
            });
          }).catch((err) => {
            console.warn('Error leyendo DOCX con Mammoth:', err);
            callback({ name, ext, type: 'text', content: 'No se pudo extraer el texto del documento Word.', dataUrl: '' });
          });
        } else {
          callback({ name, ext, type: 'text', content: 'Librería Word no disponible.', dataUrl: '' });
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    // 2. Excel & CSV Parser (.xlsx, .xls, .csv) via SheetJS
    if (['xlsx', 'xls', 'csv', 'tsv'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          if (window.XLSX) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            const csvContent = jsonRows.map(row => row.join(',')).join('\n');
            callback({ name, ext, type: 'excel', rows: jsonRows, content: csvContent, dataUrl: csvContent });
            return;
          }
        } catch (err) {}

        const textReader = new FileReader();
        textReader.onload = (evt) => callback({ name, ext, type: 'text', content: evt.target.result, dataUrl: evt.target.result });
        textReader.readAsText(file);
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    // 3. Plain Text / Fountain / Script / JSON
    if (['txt', 'fountain', 'md', 'json', 'log', 'rtf'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = (e) => callback({ name, ext, type: 'text', content: e.target.result, dataUrl: e.target.result });
      reader.readAsText(file);
      return;
    }

    // 4. Media & PDF Files (DataURL)
    const reader = new FileReader();
    reader.onload = (e) => {
      let type = 'file';
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) type = 'image';
      else if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) type = 'video';
      else if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) type = 'audio';
      else if (ext === 'pdf') type = 'pdf';

      callback({ name, ext, type, dataUrl: e.target.result, content: e.target.result });
    };
    reader.readAsDataURL(file);
  },

  /* In-App Native File Viewer (PDF, DOCX, XLSX, MP4, MOV, Audio, Images) */
  showInAppFileViewer(fileItem) {
    const ext = (fileItem.ext || '').toLowerCase();
    const type = fileItem.type || 'file';
    const name = fileItem.name || 'Archivo';
    const src = fileItem.dataUrl || fileItem.content;

    let bodyHtml = '';

    if (ext === 'pdf' || type === 'pdf') {
      bodyHtml = `
        <div style="width:100%;height:70vh;background:#1a1c29;border-radius:8px;overflow:hidden">
          <iframe src="${src}" style="width:100%;height:100%;border:none;"></iframe>
        </div>
      `;
    } else if (['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext) || type === 'video') {
      bodyHtml = `
        <div style="text-align:center;background:#000;border-radius:8px;overflow:hidden">
          <video controls autoplay src="${src}" style="width:100%;max-height:70vh"></video>
        </div>
      `;
    } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext) || type === 'audio') {
      bodyHtml = `
        <div class="card" style="padding:var(--space-xl);text-align:center">
          <div style="font-size:3rem;margin-bottom:12px">🎵</div>
          <h3>${name}</h3>
          <audio controls autoplay src="${src}" style="width:100%;margin-top:16px"></audio>
        </div>
      `;
    } else if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) || type === 'image') {
      bodyHtml = `
        <div style="text-align:center;background:#000;border-radius:8px;padding:10px">
          <img src="${src}" alt="${name}" style="max-width:100%;max-height:70vh;object-fit:contain">
        </div>
      `;
    } else if (['xls', 'xlsx', 'csv'].includes(ext) || type === 'excel') {
      const rows = fileItem.rows || (fileItem.content ? fileItem.content.split('\n').map(r => r.split(/[,;\t]/)) : []);
      bodyHtml = `
        <div class="table-container" style="max-height:65vh;overflow:auto">
          <table class="data-table">
            <thead>
              <tr>${(rows[0] || ['Col 1', 'Col 2', 'Col 3']).map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rows.slice(1).map(row => `<tr>${row.map(cell => `<td>${cell || ''}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      bodyHtml = `
        <div class="card" style="max-height:65vh;overflow:auto;font-family:Courier, monospace;white-space:pre-wrap;line-height:1.6;background:#161826;color:#e1e4fa;padding:var(--space-lg)">
          ${fileItem.content || 'Sin vista previa textual disponible.'}
        </div>
      `;
    }

    this.showModal(`
      <div class="modal-header">
        <div>
          <h2>👁️ Visor CinePrep: <span class="text-gold">${name}</span></h2>
          <span class="tag tag-neutral" style="font-size:0.75rem;text-transform:uppercase">${ext.toUpperCase()}</span>
        </div>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        ${bodyHtml}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary modal-close">Cerrar Visor</button>
        ${['pdf', 'txt', 'fountain', 'md', 'docx', 'doc', 'csv', 'xlsx'].includes(ext) ? `
          <button class="btn btn-primary" id="btnAutoParseInModal">⚡ Desglosar en Módulos de la App</button>
        ` : ''}
      </div>
    `, 'xl');

    const btnParse = document.getElementById('btnAutoParseInModal');
    if (btnParse) {
      btnParse.onclick = () => {
        this.closeModal();
        this.autoParseProjectFile(fileItem);
      };
    }
  },

  /* Smart Content Auto-Parser (Extracts Logline, Tagline, Synopsis, Scenes & Budget) */
  autoParseProjectFile(fileItem) {
    const proj = Storage.getProject();
    if (!proj) return;

    let text = fileItem.content || '';
    if (fileItem.rows && fileItem.rows.length > 0) {
      if (typeof PresupuestoModule !== 'undefined') {
        PresupuestoModule.importExcelOrCSV(fileItem);
        return;
      }
    }

    if (!proj.guion) proj.guion = {};
    proj.guion.guionTexto = text;

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const firstPara = lines.slice(0, 15).join(' ');

    if (!proj.guion.logline || proj.guion.logline.length < 10) {
      proj.guion.logline = firstPara.slice(0, 160) + '...';
    }

    if (!proj.guion.tagline) {
      proj.guion.tagline = lines[0] ? lines[0].slice(0, 80) : 'Una producción cinematográfica impactante.';
    }

    if (!proj.guion.sinopsisCorta) {
      proj.guion.sinopsisCorta = firstPara.slice(0, 300) + '.';
    }

    const sceneRegex = /(?:INT\.|EXT\.|INT\/EXT\.)\s+([^\n\-]+)(?:\s*-\s*([^\n]+))?/gi;
    let match;
    const scenes = [];
    const tarjetas = [];

    while ((match = sceneRegex.exec(text)) !== null) {
      const loc = match[1] ? match[1].trim() : 'LOCACIÓN';
      const time = match[2] ? match[2].trim() : 'DÍA';
      const num = scenes.length + 1;

      scenes.push({
        numero: num,
        encabezado: match[0],
        locacion: loc,
        tiempo: time,
        resumen: `Escena ${num} en ${loc}`
      });

      tarjetas.push({
        numero: num,
        titulo: `Escena ${num}: ${loc}`,
        interiorExterior: match[0].startsWith('INT') ? 'INT' : 'EXT',
        diaNoche: time,
        personajes: 'Por definir',
        descripcion: `Desglose automático de escena ${num}`
      });
    }

    if (scenes.length > 0) {
      proj.guion.escaleta = scenes;
      proj.guion.tarjetas = tarjetas;
    }

    Storage.saveProject(proj);
    this.toast(`¡Guion y derivados desglosados! Se detectaron ${scenes.length} escenas, logline y sinopsis.`, 'success');
    this.navigate('guion');
  },

  /* Render Media Element Component */
  renderMediaElement(mediaItem) {
    if (!mediaItem || (!mediaItem.dataUrl && !mediaItem.imagen)) return '';
    const src = mediaItem.dataUrl || mediaItem.imagen || mediaItem;
    const type = mediaItem.type || 'image';
    const name = mediaItem.name || 'Archivo adjunto';

    if (type === 'image' || (typeof src === 'string' && src.startsWith('data:image'))) {
      return `<img src="${src}" alt="${name}" style="width:100%;height:100%;object-fit:cover;">`;
    } else if (type === 'video' || (typeof src === 'string' && src.startsWith('data:video'))) {
      return `<video controls src="${src}" style="width:100%;max-height:220px;border-radius:var(--radius-md);"></video>`;
    } else if (type === 'audio' || (typeof src === 'string' && src.startsWith('data:audio'))) {
      return `<audio controls src="${src}" style="width:100%;margin-top:8px;"></audio>`;
    } else {
      return `
        <div class="card" style="padding:var(--space-md);background:var(--bg-elevated);border:1px solid var(--border-strong);">
          <div class="flex items-center gap-sm">
            <span style="font-size:1.8rem">📄</span>
            <div style="overflow:hidden;text-overflow:ellipsis">
              <strong style="font-size:0.9rem;color:#ffffff;display:block">${name}</strong>
              <a href="${src}" download="${name}" class="btn btn-sm btn-ghost" style="padding:2px 0;color:var(--accent-gold-light);font-size:0.8rem">💾 Descargar Documento</a>
            </div>
          </div>
        </div>
      `;
    }
  },

  /* Export Project Dossier to PDF with Embedded Share Link */
  exportProjectPDF() {
    const project = Storage.getProject();
    if (!project) { this.toast('Abre un proyecto para exportar su PDF', 'warning'); return; }

    this.toast('Generando Dossier PDF completo...', 'info');

    const payload = { id: project.id, name: project.name, director: project.director };
    const inviteCode = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    const shareUrl = `${window.location.origin}${window.location.pathname}?invite=${inviteCode}`;

    const pdfHtml = `
      <div style="padding:40px;font-family:Arial,sans-serif;color:#111;background:#fff;line-height:1.6;">
        <div style="border-bottom:4px solid #d4a853;padding-bottom:20px;margin-bottom:30px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h1 style="font-size:28px;margin:0;color:#111;">🎬 ${project.name}</h1>
            <p style="margin:4px 0 0 0;color:#666;font-size:14px;">DOSSIER COMPLETO DE PRE-PRODUCCIÓN</p>
          </div>
          <div style="text-align:right;">
            <span style="background:#f4d068;padding:6px 14px;border-radius:20px;font-weight:bold;font-size:12px;">${project.formato || 'Cortometraje'}</span>
          </div>
        </div>

        <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin-bottom:30px;border:1px solid #eee;">
          <h3 style="margin-top:0;color:#333;">📌 Datos Generales</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:14px;">
            <div><strong>Director/a:</strong> ${project.director || 'N/I'}</div>
            <div><strong>Productora:</strong> ${project.productora || 'N/I'}</div>
            <div><strong>Género:</strong> ${project.genero || 'N/I'}</div>
            <div><strong>Duración Est.:</strong> ${project.duracionEstimada || 'N/I'}</div>
          </div>
        </div>

        <div style="background:#fff9e6;border:2px dashed #d4a853;padding:16px;border-radius:8px;margin-bottom:30px;">
          <h4 style="margin:0 0 6px 0;color:#8a6d1b;">🔗 Enlace de Colaboración e Importación Directa</h4>
          <p style="margin:0 0 6px 0;font-size:12px;color:#555;">Escanea o copia este enlace para abrir y colaborar en este mismo proyecto dentro de CinePrep:</p>
          <div style="font-family:monospace;font-size:11px;word-break:break-all;background:#fff;padding:8px;border:1px solid #e0d0a0;border-radius:4px;color:#333;">${shareUrl}</div>
        </div>

        <div style="margin-bottom:30px;">
          <h3 style="border-bottom:2px solid #ddd;padding-bottom:6px;color:#222;">📝 Guión & Desarrollo</h3>
          <p><strong>Logline:</strong> ${project.guion?.logline || 'Sin logline.'}</p>
          <p><strong>Tagline:</strong> ${project.guion?.tagline || 'Sin tagline.'}</p>
          <p><strong>Sinopsis Corta:</strong> ${project.guion?.sinopsisCorta || 'Sin sinopsis.'}</p>
        </div>

        <div style="margin-bottom:30px;">
          <h3 style="border-bottom:2px solid #ddd;padding-bottom:6px;color:#222;">💰 Resumen de Presupuesto (${project.presupuesto?.moneda || 'ARS'})</h3>
          <table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:13px;">
            <thead>
              <tr style="background:#333;color:#fff;">
                <th style="padding:8px;text-align:left;">Área</th>
                <th style="padding:8px;text-align:right;">Rubros</th>
              </tr>
            </thead>
            <tbody>
              ${(project.presupuesto?.areas || []).map(a => `
                <tr style="border-bottom:1px solid #eee;">
                  <td style="padding:8px;">${a.nombre}</td>
                  <td style="padding:8px;text-align:right;">${(a.items || []).length} items</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="margin-bottom:30px;">
          <h3 style="border-bottom:2px solid #ddd;padding-bottom:6px;color:#222;">📞 Equipo & Colaboradores (${(project.contactos || []).length})</h3>
          <ul style="padding-left:20px;font-size:13px;">
            ${(project.contactos || []).map(c => `<li><strong>${c.nombre}</strong> (${c.rol || 'Crew'} - ${c.departamento || 'General'}) - Tel: ${c.telefono || 'N/I'} | Mail: ${c.email || 'N/I'}</li>`).join('')}
          </ul>
        </div>

        <div style="text-align:center;font-size:11px;color:#888;margin-top:40px;border-top:1px solid #eee;padding-top:10px;">
          Generado automáticamente por CinePrep | Asistente de Pre-Producción Cinematográfica
        </div>
      </div>
    `;

    const opt = {
      margin: 10,
      filename: `dossier_${(project.name || 'proyecto').toLowerCase().replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (window.html2pdf) {
      const element = document.createElement('div');
      element.innerHTML = pdfHtml;
      html2pdf().set(opt).from(element).save().then(() => {
        this.toast('¡Dossier PDF descargado con éxito!', 'success');
      });
    } else {
      const win = window.open('', '_blank');
      win.document.write(pdfHtml);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 500);
      this.toast('Abriendo vista previa de impresión PDF...', 'info');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
