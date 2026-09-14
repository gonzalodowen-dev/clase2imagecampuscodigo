/* CinePrep - Core Application Logic, Bulletproof DOCX Extractor, Excel Engine & Router */
const App = {
  activeModule: 'dashboard',
  modules: {},
  THEME_KEY: 'cineprep_theme',

  init() {
    this.loadTheme();
    this.setupThemeToggle();
    this.setupNavigation();
    this.setupMobileMenu();
    this.setupImportExport();
    this.checkUrlInvites();
    this.setupUserAndCodeSystem();
    this.navigate('dashboard');
  },

  /* ========== THEME MANAGEMENT ==========
     Default = NOTEBOOK (light / day mode)
     dark = Homework at Night (screen dimmed)
     */
  loadTheme() {
    try {
      const saved = localStorage.getItem(this.THEME_KEY);
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = saved || (prefersDark ? 'dark' : 'light');
      this.applyTheme(theme);
    } catch (e) {
      this.applyTheme('light');
    }
  },

    applyTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('theme-dark', isDark);
    try { localStorage.setItem(this.THEME_KEY, theme); } catch (e) {}
    const icon = document.getElementById('themeToggleIcon');
    const label = document.getElementById('themeToggleText');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    if (label) label.textContent = isDark ? 'Modo Claro' : 'Modo Oscuro';
  },

  toggleTheme() {
    const isDark = document.body.classList.contains('theme-dark');
    this.applyTheme(isDark ? 'light' : 'dark');
  },

  setupThemeToggle() {
    const bind = () => {
      const btn = document.getElementById('btnThemeToggle');
      if (btn && !btn.dataset.bound) {
        btn.dataset.bound = '1';
        btn.addEventListener('click', () => this.toggleTheme());
      }
    };
    bind();
    setTimeout(bind, 300);
  },

  
  // User Profile & Code Project Sync Logic
  setupUserAndCodeSystem() {
    this.updateUserProfileUI();
    this.updateProjectCodeUI();

    // User Edit Profile
    const btnEdit = document.getElementById('btnEditUserProfile');
    const modalProf = document.getElementById('modalUserProfile');
    const btnCloseProf = document.getElementById('btnCloseUserProfile');
    const btnCancelProf = document.getElementById('btnCancelUserProfile');
    const formProf = document.getElementById('formUserProfile');

    if (btnEdit) {
      btnEdit.addEventListener('click', () => {
        const u = Storage.getUser();
        document.getElementById('profUserName').value = u.name || '';
        document.getElementById('profUserRole').value = u.role || 'Director / Directora';
        modalProf.classList.add('active');
      });
    }
    const closeProf = () => modalProf.classList.remove('active');
    if (btnCloseProf) btnCloseProf.addEventListener('click', closeProf);
    if (btnCancelProf) btnCancelProf.addEventListener('click', closeProf);

    if (formProf) {
      formProf.addEventListener('submit', (e) => {
        e.preventDefault();
        const u = Storage.getUser();
        u.name = document.getElementById('profUserName').value.trim();
        u.role = document.getElementById('profUserRole').value;
        const iconSel = formProf.querySelector('input[name="avatarIcon"]:checked');
        if (iconSel) u.avatar = iconSel.value;
        
        Storage.setUser(u);
        this.updateUserProfileUI();
        closeProf();
        this.showToast('✅ Perfil de usuario actualizado', 'success');

        // Also update project member list
        const p = Storage.getActiveProject();
        if (p) {
          if (!p.members) p.members = [];
          const idx = p.members.findIndex(m => m.id === u.id);
          if (idx >= 0) p.members[idx] = u;
          else p.members.push(u);
          Storage.saveProject(p);
        }
      });
    }

    // Copy Project Code
    const btnCopy = document.getElementById('btnCopyProjectCode');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        const p = Storage.getActiveProject();
        if (p && p.code) {
          navigator.clipboard.writeText(p.code);
          this.showToast(`📋 Código ${p.code} copiado al portapapeles`, 'info');
        }
      });
    }

    // Join Project by Code Modal
    const btnSidebarNew = document.getElementById('btnSidebarNewProject');
    if (btnSidebarNew) {
      btnSidebarNew.addEventListener('click', () => {
        if (typeof DashboardModule !== 'undefined') {
          DashboardModule.showProjectForm();
        }
      });
    }

    const btnJoin = document.getElementById('btnJoinProjectCode');
    const modalJoin = document.getElementById('modalJoinProjectCode');
    const btnCloseJoin = document.getElementById('btnCloseJoinCode');
    const btnCancelJoin = document.getElementById('btnCancelJoinCode');
    const formJoin = document.getElementById('formJoinProjectCode');

    if (btnJoin) {
      btnJoin.addEventListener('click', () => {
        modalJoin.classList.add('active');
      });
    }
    const closeJoin = () => modalJoin.classList.remove('active');
    if (btnCloseJoin) btnCloseJoin.addEventListener('click', closeJoin);
    if (btnCancelJoin) btnCancelJoin.addEventListener('click', closeJoin);

    if (formJoin) {
      formJoin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('inputProjectCode').value.trim().toUpperCase();
        if (!code) return;

        try {
          const res = await fetch(`/api/projects/by-code/${code}`);
          const data = await res.json();
          if (data.success && data.project) {
            const project = data.project;
            const u = Storage.getUser();
            if (!project.members) project.members = [];
            if (!project.members.some(m => m.id === u.id)) {
              project.members.push(u);
            }
            Storage.saveProject(project);
            closeJoin();
            this.showToast(`🎉 Te has unido con éxito al proyecto "${project.name}"!`, 'success');
            this.navigate('dashboard');
            this.updateProjectCodeUI();
          } else {
            this.showToast('❌ Código de proyecto no encontrado. Verifica el código e intenta nuevamente.', 'danger');
          }
        } catch(err) {
          this.showToast('⚠️ Error al buscar proyecto por código.', 'warning');
        }
      });
    }

    // Listen to Room Users updates via Socket.IO
    if (typeof socket !== 'undefined' && socket) {
      socket.on('room-users-updated', (users) => {
        this.renderLiveCollaboratorsBar(users);
      });
    }
  },

  updateUserProfileUI() {
    const u = Storage.getUser();
    const avatarEl = document.getElementById('sidebarUserAvatar');
    const nameEl = document.getElementById('sidebarUserName');
    const roleEl = document.getElementById('sidebarUserRole');
    if (avatarEl) avatarEl.textContent = u.avatar || '🎬';
    if (nameEl) nameEl.textContent = u.name || 'Usuario CinePrep';
    if (roleEl) roleEl.textContent = u.role || 'Director / Creador';
  },

  updateProjectCodeUI() {
    const p = Storage.getActiveProject();
    const codeEl = document.getElementById('sidebarProjectCode');
    if (codeEl) {
      if (p && p.code) {
        codeEl.textContent = p.code;
      } else if (p) {
        p.code = Storage.generateProjectCode();
        Storage.saveProject(p);
        codeEl.textContent = p.code;
      } else {
        codeEl.textContent = 'CP-XXXX';
      }
    }
  },

  renderLiveCollaboratorsBar(usersList) {
    let bar = document.getElementById('liveCollaboratorsBar');
    if (!bar) {
      const header = document.querySelector('.page-header');
      if (header) {
        bar = document.createElement('div');
        bar.id = 'liveCollaboratorsBar';
        bar.className = 'live-collaborators-bar';
        header.appendChild(bar);
      }
    }
    if (!bar) return;

    if (!usersList || usersList.length === 0) {
      bar.innerHTML = '';
      return;
    }

    bar.innerHTML = `
      <span class="live-collab-label">🟢 EN VIVO (${usersList.length}):</span>
      <div class="live-avatars">
        ${usersList.map(u => `
          <div class="collab-avatar-chip" title="${u.name} (${u.role})">
            <span>${u.avatar || '🎬'}</span> ${u.name}
          </div>
        `).join('')}
      </div>
    `;
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
    const btnOutput = document.getElementById('btnOpenOutputView');

    if (btnOutput) {
      btnOutput.onclick = () => {
        window.open('output.html', '_blank');
      };
    }

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
              this.setupUserAndCodeSystem();
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
    this.updateProjectCodeUI();
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

  /* Bulletproof Multi-Layer Word (.docx) Text Extractor */
  extractDocxText(arrayBuffer, callback) {
    // Pipeline 1: Mammoth.js
    if (window.mammoth) {
      mammoth.extractRawText({ arrayBuffer: arrayBuffer }).then(result => {
        if (result.value && result.value.trim().length > 0) {
          callback(result.value);
          return;
        }
        this.extractDocxTextJSZip(arrayBuffer, callback);
      }).catch(err => {
        this.extractDocxTextJSZip(arrayBuffer, callback);
      });
    } else {
      this.extractDocxTextJSZip(arrayBuffer, callback);
    }
  },

  extractDocxTextJSZip(arrayBuffer, callback) {
    // Pipeline 2: JSZip + XML Text extraction from word/document.xml
    if (window.JSZip) {
      JSZip.loadAsync(arrayBuffer).then(zip => {
        const docXml = zip.file("word/document.xml");
        if (docXml) {
          docXml.async("string").then(xmlText => {
            const matches = xmlText.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || [];
            const text = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
            callback(text || 'Documento Word cargado.');
          });
        } else {
          callback('Documento Word cargado.');
        }
      }).catch(err => {
        callback('Documento Word cargado.');
      });
    } else {
      callback('Documento Word cargado.');
    }
  },

  /* Universal File Reader (Handles Word DOCX, Excel, PDF, Text, Videos & ANY file as fallback) */
  readFileUniversal(file, callback) {
    const name = file.name;
    const ext = (name.split('.').pop() || '').toLowerCase();
    const mimeType = file.type || '';

    // 1. Word Document (.docx, .doc)
    if (['docx', 'doc'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.extractDocxText(e.target.result, (extractedText) => {
          callback({
            name,
            ext,
            type: 'text',
            content: extractedText,
            dataUrl: extractedText
          });
        });
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    // 2. Excel & CSV (.xlsx, .xls, .csv, .tsv, .ods)
    if (['xlsx', 'xls', 'csv', 'tsv', 'ods'].includes(ext)) {
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

    // 3. Plain Text / Fountain / Script / JSON / Code files
    const textExts = ['txt', 'fountain', 'md', 'json', 'log', 'rtf', 'xml', 'html', 'htm', 'css', 'js',
                      'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'cs', 'php', 'rb', 'go', 'rs',
                      'swift', 'kt', 'sh', 'bat', 'yaml', 'yml', 'ini', 'conf', 'env', 'sql'];
    if (textExts.includes(ext)) {
      const reader = new FileReader();
      reader.onload = (e) => callback({ name, ext, type: 'text', content: e.target.result, dataUrl: e.target.result });
      reader.readAsText(file);
      return;
    }

    // 4. PDF -> dataUrl (viewer handles it)
    if (ext === 'pdf') {
      const reader = new FileReader();
      reader.onload = (e) => callback({ name, ext, type: 'pdf', dataUrl: e.target.result, content: e.target.result });
      reader.readAsDataURL(file);
      return;
    }

    // 5. Images -> dataUrl
    const imgExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tif', 'tiff', 'avif', 'heic'];
    if (imgExts.includes(ext) || mimeType.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => callback({ name, ext, type: 'image', dataUrl: e.target.result, content: e.target.result });
      reader.readAsDataURL(file);
      return;
    }

    // 6. Videos -> dataUrl
    const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv', 'm4v', 'mpg', 'mpeg', '3gp'];
    if (videoExts.includes(ext) || mimeType.startsWith('video/')) {
      const reader = new FileReader();
      reader.onload = (e) => callback({ name, ext, type: 'video', dataUrl: e.target.result, content: e.target.result });
      reader.readAsDataURL(file);
      return;
    }

    // 7. Audio -> dataUrl
    const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma', 'opus', 'aiff'];
    if (audioExts.includes(ext) || mimeType.startsWith('audio/')) {
      const reader = new FileReader();
      reader.onload = (e) => callback({ name, ext, type: 'audio', dataUrl: e.target.result, content: e.target.result });
      reader.readAsDataURL(file);
      return;
    }

    // === 8. UNIVERSAL FALLBACK: ANY other file type (ZIP, RAR, PSD, AI, Blender, 3D, Premiere, Final Cut, etc.) ===
    // Store as dataUrl binary for download + metadata
    const fallbackReader = new FileReader();
    fallbackReader.onload = (e) => {
      const dataUrl = e.target.result;
      let fallbackType = 'file';
      // Detect common production/professional file types for icon purposes
      if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) fallbackType = 'archive';
      else if (['psd', 'ai', 'indd', 'sketch', 'fig', 'xd'].includes(ext)) fallbackType = 'design';
      else if (['blend', 'fbx', 'obj', '3ds', 'max', 'ma', 'mb', 'abc', 'usd'].includes(ext)) fallbackType = '3d';
      else if (['prproj', 'aep', 'drp', 'fcpbundle', 'fcpxml', 'edl', 'xml'].includes(ext)) fallbackType = 'edit';
      else if (['dwg', 'dxf', 'rvt', 'skp', 'ifc'].includes(ext)) fallbackType = 'cad';
      else if (['srt', 'vtt', 'ass', 'ssa', 'sub'].includes(ext)) fallbackType = 'subs';

      callback({
        name,
        ext,
        type: fallbackType,
        dataUrl,
        content: dataUrl,
        sizeBytes: file.size || 0,
        mimeType: mimeType || 'application/octet-stream'
      });
    };
    fallbackReader.onerror = () => {
      callback({
        name,
        ext,
        type: 'file',
        dataUrl: '',
        content: 'Archivo cargado (almacenado con error de lectura en vista previa)',
        sizeBytes: file.size || 0
      });
    };
    fallbackReader.readAsDataURL(file);
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
    } else if (['txt', 'fountain', 'md', 'docx', 'doc', 'json', 'xml', 'html', 'css', 'js', 'py', 'yaml', 'yml', 'log', 'sql', 'rtf', 'c', 'cpp', 'h', 'java', 'ts'].includes(ext)) {
      // Text / Code files
      let contentText = fileItem.content || '';
      if (contentText.startsWith('data:')) {
        contentText = 'Documento cargado correctamente.';
      }
      bodyHtml = `
        <div class="card" style="max-height:65vh;overflow:auto;font-family:Courier, monospace;white-space:pre-wrap;line-height:1.6;background:#161826;color:#e1e4fa;padding:var(--space-lg)">
          ${contentText}
        </div>
      `;
    } else {
      // === FALLBACK: ANY UNKNOWN FILE TYPE (Archive, 3D, Design, Editing, CAD, etc.) ===
      const typeLabel = {
        'archive': '🗜️ Archivo Comprimido',
        'design': '🎨 Archivo de Diseño',
        '3d': '🧊 Modelo 3D',
        'edit': '✂️ Proyecto de Edición',
        'cad': '🏗️ Archivo CAD / Planimetría',
        'subs': '💬 Subtítulos',
        'file': '📦 Archivo'
      }[type] || '📦 Archivo';

      const sizeLabel = fileItem.sizeBytes ? (
        fileItem.sizeBytes > 1048576
          ? (fileItem.sizeBytes / 1048576).toFixed(2) + ' MB'
          : (fileItem.sizeBytes / 1024).toFixed(1) + ' KB'
      ) : 'N/I';

      let downloadHtml = '';
      if (fileItem.dataUrl) {
        downloadHtml = `
          <a href="${fileItem.dataUrl}" download="${name}" class="btn btn-primary btn-lg" style="text-decoration:none;padding:14px 32px;font-size:1rem;">
            💾 Descargar "${name}"
          </a>
        `;
      }

      bodyHtml = `
        <div class="card" style="padding:var(--space-2xl);text-align:center;max-width:600px;margin:0 auto">
          <div style="font-size:5rem;margin-bottom:var(--space-md)">
            ${DriveModule ? DriveModule.getFileIcon(ext, type) : '📦'}
          </div>
          <h3 style="margin-bottom:var(--space-sm)">${name}</h3>
          <div style="display:inline-flex;gap:var(--space-sm);margin-bottom:var(--space-lg);flex-wrap:wrap;justify-content:center;">
            <span class="tag tag-gold" style="text-transform:uppercase">${ext.toUpperCase()}</span>
            <span class="tag tag-info">${typeLabel}</span>
            <span class="tag tag-neutral">${sizeLabel}</span>
          </div>
          <p style="color:var(--text-secondary);margin-bottom:var(--space-xl);max-width:440px;margin-left:auto;margin-right:auto">
            Este tipo de archivo no cuenta con vista previa nativa dentro de CinePrep.
            <br><strong>Puedes descargarlo y abrirlo en tu aplicación profesional habitual</strong>
            (Photoshop, Illustrator, Blender, Premiere, Final Cut, AutoCAD, WinRAR, etc.).
          </p>
          ${downloadHtml}
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
        ${fileItem.dataUrl ? `
          <a href="${fileItem.dataUrl}" download="${name}" class="btn btn-secondary" style="text-decoration:none;">
            💾 Descargar Archivo
          </a>
        ` : ''}
        <button class="btn btn-secondary modal-close">Cerrar Visor</button>
        ${['pdf', 'txt', 'fountain', 'md', 'docx', 'doc', 'csv', 'xlsx', 'xls'].includes(ext) ? `
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
    if (text.startsWith('data:')) {
      text = 'Contenido del documento ' + (fileItem.name || '');
    }

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
