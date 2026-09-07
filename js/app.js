/* CinePrep - Core Application Logic, PWA Installer, Excel Engine & Router */
const App = {
  activeModule: 'dashboard',
  modules: {},
  deferredPrompt: null,

  init() {
    this.setupNavigation();
    this.setupMobileMenu();
    this.setupImportExport();
    this.setupPwa();
    this.checkUrlInvites();

    const activeId = Storage.getActiveProjectId();
    if (activeId && Storage.getProject(activeId)) {
      this.navigate('dashboard');
    } else {
      this.navigate('dashboard');
    }
  },

  registerModule(name, moduleObj) {
    this.modules[name] = moduleObj;
  },

  setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const moduleName = item.dataset.module;
        if (moduleName) this.navigate(moduleName);
      });
    });
  },

  setupMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (btn && sidebar && overlay) {
      btn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
      });
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
    }
  },

  setupPwa() {
    // Register Service Worker for Offline & App Installation
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(reg => {
          console.log('CinePrep Service Worker registrado con éxito:', reg.scope);
        }).catch(err => {
          console.log('Error registrando Service Worker:', err);
        });
      });
    }

    // Capture install prompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      const btnSidebar = document.getElementById('btnInstallPwaSidebar');
      const btnMobile = document.getElementById('btnInstallPwaMobile');
      if (btnSidebar) btnSidebar.style.display = 'inline-flex';
      if (btnMobile) btnMobile.style.display = 'inline-flex';
    });

    const btnSidebar = document.getElementById('btnInstallPwaSidebar');
    const btnMobile = document.getElementById('btnInstallPwaMobile');
    if (btnSidebar) btnSidebar.addEventListener('click', () => this.showInstallPwaModal());
    if (btnMobile) btnMobile.addEventListener('click', () => this.showInstallPwaModal());
  },

  showInstallPwaModal() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          this.toast('¡CinePrep instalada como aplicación nativa!', 'success');
        }
        this.deferredPrompt = null;
      });
      return;
    }

    // Modal with instructions for all platforms
    this.showModal(`
      <div class="modal-header"><h2>📲 Instalar CinePrep en tu Dispositivo</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body" style="font-size:0.95rem;line-height:1.6">
        <p class="mb-md">CinePrep se puede instalar como aplicación nativa descargable en <strong>Computadoras (Windows / Mac)</strong>, <strong>Celulares (Android / iPhone)</strong> y <strong>Tablets (iPad)</strong> para funcionar 100% offline sin necesidad de internet.</p>
        
        <div class="card mb-sm" style="background:var(--bg-elevated);border:1px solid var(--border-strong);">
          <h4 style="color:var(--accent-gold);margin-bottom:4px">💻 En Computadoras (Chrome / Edge / Brave)</h4>
          <p style="font-size:0.85rem;color:var(--text-secondary)">Hacé clic en el ícono de instalación <strong>⊕ (Instalar CinePrep)</strong> ubicado en la parte derecha de la barra de direcciones de tu navegador, o hacé clic en los 3 puntos del menú y selecciona <em>"Instalar CinePrep..."</em>.</p>
        </div>

        <div class="card mb-sm" style="background:var(--bg-elevated);border:1px solid var(--border-strong);">
          <h4 style="color:var(--accent-gold);margin-bottom:4px">📱 En Celulares y Tablets Android</h4>
          <p style="font-size:0.85rem;color:var(--text-secondary)">Abrí el menú de 3 puntos (⋮) arriba a la derecha en Chrome y seleccioná <strong>"Agregar a la pantalla principal"</strong> o <strong>"Instalar aplicación"</strong>.</p>
        </div>

        <div class="card" style="background:var(--bg-elevated);border:1px solid var(--border-strong);">
          <h4 style="color:var(--accent-gold);margin-bottom:4px">🍎 En iPhone / iPad (Safari)</h4>
          <p style="font-size:0.85rem;color:var(--text-secondary)">Toca el botón <strong>Compartir (🗍)</strong> en la barra inferior de Safari y selecciona <strong>"Agregar a inicio"</strong> (Add to Home Screen).</p>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary modal-close">Entendido</button>
      </div>
    `);
  },

  setupImportExport() {
    const btnExp = document.getElementById('btnExport');
    const btnImp = document.getElementById('btnImport');
    const fileImp = document.getElementById('importFile');
    const btnPDF = document.getElementById('btnExportPDF');
    const btnInvite = document.getElementById('btnInviteCollabSidebar');

    if (btnExp) {
      btnExp.addEventListener('click', () => {
        const project = Storage.getProject();
        if (!project) { this.toast('No hay ningún proyecto activo para exportar', 'warning'); return; }
        const jsonStr = JSON.stringify(project, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cineprep_${project.name.toLowerCase().replace(/\s+/g, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.toast('Proyecto exportado en JSON', 'success');
      });
    }

    if (btnImp && fileImp) {
      btnImp.addEventListener('click', () => fileImp.click());
      fileImp.addEventListener('change', (e) => {
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
      });
    }

    if (btnPDF) {
      btnPDF.addEventListener('click', () => this.exportProjectPDF());
    }

    if (btnInvite) {
      btnInvite.addEventListener('click', () => {
        if (!this.requireProject()) return;
        ColaboradoresModule.showInviteLinkModal();
      });
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
    if (!this.modules[moduleName]) return;

    this.activeModule = moduleName;
    document.querySelectorAll('.nav-item').forEach(item => {
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
      this.toast('Abre o crea un proyecto para ingresar a este módulo', 'info');
      this.navigate('dashboard');
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

  /* Universal File Reader & Native Excel (.xlsx, .xls, .csv, .txt) Processor */
  readFileUniversal(file, callback) {
    const name = file.name;
    const ext = name.split('.').pop().toLowerCase();

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
        } catch (err) {
          console.warn('SheetJS error, falling back to text reader:', err);
        }

        const textReader = new FileReader();
        textReader.onload = (evt) => callback({ name, ext, type: 'text', content: evt.target.result, dataUrl: evt.target.result });
        textReader.readAsText(file);
      };
      reader.readAsArrayBuffer(file);
    } else if (['txt', 'fountain', 'md', 'json', 'log', 'rtf'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = (e) => callback({ name, ext, type: 'text', content: e.target.result, dataUrl: e.target.result });
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        let type = 'file';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) type = 'image';
        else if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) type = 'video';
        else if (['mp3', 'wav', 'ogg'].includes(ext)) type = 'audio';
        else if (ext === 'pdf') type = 'pdf';
        else if (['doc', 'docx', 'ppt', 'pptx'].includes(ext)) type = 'document';

        callback({ name, ext, type, dataUrl: e.target.result, content: e.target.result });
      };
      reader.readAsDataURL(file);
    }
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
      filename: `dossier_${project.name.toLowerCase().replace(/\s+/g, '_')}.pdf`,
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
