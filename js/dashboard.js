/* CinePrep - Dashboard & Multi-Project Manager Module */
const DashboardModule = {
  render() {
    const activeProject = Storage.getProject();
    const projectsList = Storage.getProjectsList();

    if (!activeProject || projectsList.length === 0) {
      return this.renderProjectManager(projectsList);
    }
    return this.renderActiveDashboard(activeProject, projectsList);
  },

  /* Screen 1: Multi-Project Manager (Selector de Proyectos) */
  renderProjectManager(projectsList) {
    return `
      <div class="page-header">
        <h1><span class="header-icon">🎬</span> Gestor de Proyectos CinePrep</h1>
        <p class="page-subtitle">Crea, abre, importa y gestiona múltiples piezas audiovisuales en un solo lugar</p>
        <div class="page-header-actions">
          <button class="btn btn-primary btn-lg" id="btnCreateNewProjectHome">✨ Crear Nuevo Proyecto</button>
          <button class="btn btn-secondary btn-lg" id="btnImportProjectHome">📥 Cargar / Abrir Proyecto desde PC (.json)</button>
          <input type="file" id="importProjectHomeInput" accept=".json" style="display:none">
        </div>
      </div>
      <div class="page-body">
        ${projectsList.length === 0 ? `
          <div class="welcome-screen" style="min-height:50vh;padding:0">
            <div class="welcome-card animate-fade-in" style="max-width:600px">
              <div class="welcome-icon">🎬</div>
              <h1>Bienvenido a <span>CinePrep</span></h1>
              <p>Tu asistente integral de pre-producción cinematográfica. Empieza creando tu primer proyecto o cargando un archivo existente desde tu PC.</p>
              <div class="flex gap-md justify-center mt-lg" style="flex-wrap:wrap">
                <button class="btn btn-primary btn-lg" onclick="DashboardModule.showProjectForm()">✨ Crear Primer Proyecto</button>
                <button class="btn btn-secondary btn-lg" onclick="document.getElementById('importProjectHomeInput').click()">📥 Abrir Proyecto desde PC</button>
              </div>
            </div>
          </div>
        ` : `
          <div class="flex justify-between items-center mb-lg">
            <h3>📂 Mis Proyectos Guardados (${projectsList.length})</h3>
            <button class="btn btn-sm btn-primary" onclick="DashboardModule.showProjectForm()">+ Nuevo Proyecto</button>
          </div>
          <div class="grid-2">
            ${projectsList.map(pSummary => {
              const fullProj = Storage.getProject(pSummary.id) || pSummary;
              const guionCount = this.countGuion(fullProj);
              const planosCount = (fullProj.guionTecnico && fullProj.guionTecnico.planos || []).length;
              const rubrosCount = this.countBudget(fullProj);

              return `
                <div class="glass-card animate-fade-in" style="display:flex;flex-direction:column;justify-content:space-between;gap:var(--space-md);">
                  <div>
                    <div class="flex justify-between items-start mb-xs">
                      <h2 style="font-size:1.45rem;color:#ffffff;line-height:1.3">🎬 ${pSummary.name}</h2>
                      <span class="tag tag-gold">${pSummary.formato || 'Cortometraje'}</span>
                    </div>
                    <div class="project-meta mt-xs">
                      ${pSummary.director ? '<div class="meta-item">🎥 Dir: ' + pSummary.director + '</div>' : ''}
                      ${pSummary.genero ? '<div class="meta-item">🎭 ' + pSummary.genero + '</div>' : ''}
                      ${pSummary.duracionEstimada ? '<div class="meta-item">⏱️ ' + pSummary.duracionEstimada + '</div>' : ''}
                    </div>
                    <div class="flex gap-md mt-md text-xs text-muted" style="background:var(--bg-surface);padding:8px 12px;border-radius:var(--radius-md)">
                      <span>📝 Escenas/Guion: <strong>${guionCount}</strong></span>
                      <span>🎥 Planos: <strong>${planosCount}</strong></span>
                      <span>💰 Rubros: <strong>${rubrosCount}</strong></span>
                    </div>
                  </div>

                  <div class="divider" style="border-top:1px solid var(--border-subtle);margin:8px 0"></div>

                  <div class="flex justify-between items-center">
                    <span class="text-xs text-muted">Última ed: ${App.formatDate((pSummary.updatedAt || '').split('T')[0])}</span>
                    <div class="flex gap-xs">
                      <button class="btn btn-ghost btn-sm" title="Duplicar" onclick="DashboardModule.duplicateProject('${pSummary.id}')">📋</button>
                      <button class="btn btn-ghost btn-sm" title="Exportar" onclick="DashboardModule.exportSingleProject('${pSummary.id}')">📤</button>
                      <button class="btn btn-danger btn-sm btn-icon" title="Eliminar" onclick="DashboardModule.deleteProject('${pSummary.id}')">🗑️</button>
                      <button class="btn btn-primary btn-sm" style="padding:8px 18px;" onclick="DashboardModule.openProject('${pSummary.id}')">▶️ Abrir Proyecto</button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  },

  /* Screen 2: Active Project Dashboard Workspace */
  renderActiveDashboard(project, projectsList) {
    const modules = [
      { id: 'guion', icon: '📝', name: 'Guion y Derivados', count: this.countGuion(project) },
      { id: 'guion-tecnico', icon: '🎥', name: 'Guion Técnico', count: (project.guionTecnico && project.guionTecnico.planos || []).length },
      { id: 'storyboard', icon: '🖼️', name: 'Storyboard', count: (project.storyboard && project.storyboard.frames || []).length },
      { id: 'moodboard', icon: '🎨', name: 'Moodboards', count: (project.moodboards && (project.moodboards.vestuario || []).length + (project.moodboards.arte || []).length) || 0 },
      { id: 'plan-produccion', icon: '📋', name: 'Plan Producción', count: (project.planProduccion && project.planProduccion.tareas || []).length },
      { id: 'presupuesto', icon: '💰', name: 'Presupuesto', count: this.countBudget(project) },
      { id: 'casting', icon: '🎭', name: 'Casting', count: (project.casting && project.casting.personajes || []).length },
      { id: 'catering', icon: '🍽️', name: 'Catering', count: (project.catering && project.catering.dias || []).length },
      { id: 'traslados', icon: '🚗', name: 'Traslados', count: (project.traslados && (project.traslados.traslados || []).length + (project.traslados.retiros || []).length) || 0 },
      { id: 'plan-rodaje', icon: '📅', name: 'Plan de Rodaje', count: (project.planRodaje && project.planRodaje.dias || []).length },
      { id: 'contactos', icon: '📞', name: 'Contactos', count: (project.contactos || []).length }
    ];

    const progressCards = modules.map(m => `
      <div class="progress-card" data-nav="${m.id}">
        <div class="pc-count">${m.count}</div>
        <div class="pc-icon">${m.icon}</div>
        <div class="pc-name">${m.name}</div>
        <div class="progress-bar" style="margin-top:8px">
          <div class="progress-bar-fill" style="width:${m.count > 0 ? Math.min(100, m.count * 15 + 10) : 0}%"></div>
        </div>
        <div class="pc-status">${m.count > 0 ? m.count + ' elementos' : 'Sin iniciar'}</div>
      </div>
    `).join('');

    return `
      <div class="page-header">
        <div class="flex justify-between items-center w-full">
          <div>
            <h1><span class="header-icon">🏠</span> Dashboard: <span class="text-gold">${project.name}</span></h1>
            <p class="page-subtitle">Espacio de trabajo activo</p>
          </div>
          <div class="page-header-actions">
            <button class="btn btn-primary btn-sm" id="btnSwitchProject">📂 Cambiar / Abrir Otro Proyecto (${projectsList.length})</button>
            <button class="btn btn-secondary btn-sm" id="btnEditProject">⚙️ Configurar</button>
            <button class="btn btn-danger btn-sm" id="btnDeleteProject">🗑️ Eliminar</button>
          </div>
        </div>
      </div>
      <div class="page-body">
        <div class="dashboard-hero animate-fade-in">
          <div class="project-info">
            <h2>🎬 <span>${project.name}</span></h2>
            <div class="project-meta">
              ${project.director ? '<div class="meta-item">🎥 ' + project.director + '</div>' : ''}
              ${project.productora ? '<div class="meta-item">🏢 ' + project.productora + '</div>' : ''}
              ${project.genero ? '<div class="meta-item">🎭 ' + project.genero + '</div>' : ''}
              ${project.formato ? '<div class="meta-item">📐 ' + project.formato + '</div>' : ''}
              ${project.duracionEstimada ? '<div class="meta-item">⏱️ ' + project.duracionEstimada + '</div>' : ''}
            </div>
          </div>
        </div>

        <h3 style="margin-bottom: var(--space-md); color: #ffffff;">📊 Progreso de Módulos</h3>
        <div class="progress-overview">${progressCards}</div>

        <h3 style="margin-bottom: var(--space-md); color: #ffffff;">⚡ Acciones Rápidas</h3>
        <div class="quick-actions">
          <div class="quick-action-card" data-nav="guion">
            <div class="qa-icon">📝</div>
            <div><div class="qa-title">Escribir / Cargar Guion</div><div class="qa-desc">Escribe tu guion o carga tu archivo desde PC</div></div>
          </div>
          <div class="quick-action-card" data-nav="presupuesto">
            <div class="qa-icon">💰</div>
            <div><div class="qa-title">Armar Presupuesto</div><div class="qa-desc">Calcula costos por área e importa planillas CSV</div></div>
          </div>
          <div class="quick-action-card" data-nav="casting">
            <div class="qa-icon">🎭</div>
            <div><div class="qa-title">Gestionar Casting</div><div class="qa-desc">Define personajes y asigna actores</div></div>
          </div>
          <div class="quick-action-card" data-nav="plan-rodaje">
            <div class="qa-icon">📅</div>
            <div><div class="qa-title">Planificar Rodaje</div><div class="qa-desc">Organiza días de rodaje escena por escena</div></div>
          </div>
        </div>
      </div>
    `;
  },

  afterRender() {
    const activeProject = Storage.getProject();

    // Home screen buttons
    const btnCreateHome = document.getElementById('btnCreateNewProjectHome');
    if (btnCreateHome) btnCreateHome.addEventListener('click', () => this.showProjectForm());

    const btnImpHome = document.getElementById('btnImportProjectHome');
    const inputImpHome = document.getElementById('importProjectHomeInput');
    if (btnImpHome && inputImpHome) {
      btnImpHome.addEventListener('click', () => inputImpHome.click());
      inputImpHome.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            try {
              const project = JSON.parse(evt.target.result);
              if (!project.id) project.id = 'proj_' + Date.now();
              Storage.saveProject(project);
              Storage.setActiveProjectId(project.id);
              App.toast(`¡Proyecto "${project.name}" abierto exitosamente!`, 'success');
              App.navigate('dashboard');
            } catch (err) {
              App.toast('Error al leer el archivo de proyecto JSON', 'danger');
            }
          };
          reader.readAsText(file);
          e.target.value = '';
        }
      });
    }

    // Active workspace buttons
    const btnSwitch = document.getElementById('btnSwitchProject');
    if (btnSwitch) {
      btnSwitch.addEventListener('click', () => {
        Storage.closeActiveProject();
        App.toast('Selecciona un proyecto para abrir', 'info');
        App.navigate('dashboard');
      });
    }

    const btnEdit = document.getElementById('btnEditProject');
    if (btnEdit) {
      btnEdit.addEventListener('click', () => this.showProjectForm(activeProject));
    }

    const btnDel = document.getElementById('btnDeleteProject');
    if (btnDel) {
      btnDel.addEventListener('click', () => {
        if (confirm(`¿Eliminar el proyecto "${activeProject.name}"? Se perderán todos los datos.`)) {
          Storage.deleteProject(activeProject.id);
          App.toast('Proyecto eliminado', 'warning');
          App.navigate('dashboard');
        }
      });
    }

    document.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', () => App.navigate(el.dataset.nav));
    });
  },

  openProject(id) {
    Storage.setActiveProjectId(id);
    const p = Storage.getProject(id);
    App.toast(`Abriendo "${p.name}"...`, 'success');
    App.navigate('dashboard');
  },

  duplicateProject(id) {
    const copy = Storage.duplicateProject(id);
    if (copy) {
      App.toast(`Proyecto duplicado como "${copy.name}"`, 'success');
      App.navigate('dashboard');
    }
  },

  deleteProject(id) {
    const p = Storage.getProject(id);
    const name = p ? p.name : 'este proyecto';
    if (confirm(`¿Estás seguro de eliminar "${name}"?`)) {
      Storage.deleteProject(id);
      App.toast('Proyecto eliminado', 'warning');
      App.navigate('dashboard');
    }
  },

  exportSingleProject(id) {
    const p = Storage.getProject(id);
    if (!p) return;
    const jsonStr = JSON.stringify(p, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cineprep_${p.name.toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    App.toast(`Proyecto "${p.name}" exportado a tu PC`, 'success');
  },

  showProjectForm(existing) {
    const p = existing || {};
    App.showModal(`
      <div class="modal-header">
        <h2>${existing ? '⚙️ Editar' : '✨ Nuevo'} Proyecto</h2>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Nombre del Proyecto / Pieza Audiovisual *</label>
          <input class="form-input" id="projName" value="${p.name || ''}" placeholder="Ej: El Legado / Cortometraje 2026">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Director/a</label>
            <input class="form-input" id="projDirector" value="${p.director || ''}" placeholder="Nombre del director">
          </div>
          <div class="form-group">
            <label class="form-label">Productora</label>
            <input class="form-input" id="projProductora" value="${p.productora || ''}" placeholder="Nombre de la productora">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Género</label>
            <select class="form-select" id="projGenero">
              <option value="">Seleccionar...</option>
              <option ${p.genero === 'Drama' ? 'selected' : ''}>Drama</option>
              <option ${p.genero === 'Comedia' ? 'selected' : ''}>Comedia</option>
              <option ${p.genero === 'Terror' ? 'selected' : ''}>Terror</option>
              <option ${p.genero === 'Thriller' ? 'selected' : ''}>Thriller</option>
              <option ${p.genero === 'Documental' ? 'selected' : ''}>Documental</option>
              <option ${p.genero === 'Ciencia Ficción' ? 'selected' : ''}>Ciencia Ficción</option>
              <option ${p.genero === 'Acción' ? 'selected' : ''}>Acción</option>
              <option ${p.genero === 'Romance' ? 'selected' : ''}>Romance</option>
              <option ${p.genero === 'Animación' ? 'selected' : ''}>Animación</option>
              <option ${p.genero === 'Experimental' ? 'selected' : ''}>Experimental</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Formato</label>
            <select class="form-select" id="projFormato">
              <option value="">Seleccionar...</option>
              <option ${p.formato === 'Cortometraje' ? 'selected' : ''}>Cortometraje</option>
              <option ${p.formato === 'Mediometraje' ? 'selected' : ''}>Mediometraje</option>
              <option ${p.formato === 'Largometraje' ? 'selected' : ''}>Largometraje</option>
              <option ${p.formato === 'Serie / Episodio' ? 'selected' : ''}>Serie / Episodio</option>
              <option ${p.formato === 'Videoclip' ? 'selected' : ''}>Videoclip</option>
              <option ${p.formato === 'Publicidad' ? 'selected' : ''}>Publicidad</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Duración Estimada</label>
          <input class="form-input" id="projDuracion" value="${p.duracionEstimada || ''}" placeholder="Ej: 15 min, 90 min">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary modal-close">Cancelar</button>
        <button class="btn btn-primary" id="btnSaveProject">💾 ${existing ? 'Guardar Cambios' : 'Crear y Abrir Proyecto'}</button>
      </div>
    `);

    document.getElementById('btnSaveProject').addEventListener('click', () => {
      const name = document.getElementById('projName').value.trim();
      if (!name) { App.toast('El nombre es obligatorio', 'warning'); return; }

      const data = {
        name,
        director: document.getElementById('projDirector').value.trim(),
        productora: document.getElementById('projProductora').value.trim(),
        genero: document.getElementById('projGenero').value,
        formato: document.getElementById('projFormato').value,
        duracionEstimada: document.getElementById('projDuracion').value.trim()
      };

      if (existing) {
        const proj = Storage.getProject();
        Object.assign(proj, data);
        Storage.saveProject(proj);
      } else {
        const newP = Storage.createProject(data);
      }

      App.closeModal();
      App.toast(existing ? 'Proyecto actualizado' : '¡Proyecto creado exitosamente!', 'success');
      App.navigate('dashboard');
    });
  },

  countGuion(project) {
    let c = 0;
    const g = project.guion || {};
    if (g.logline) c++;
    if (g.tagline) c++;
    if (g.sinopsisCorta) c++;
    if (g.sinopsisLarga) c++;
    if (g.tratamiento) c++;
    if (g.guionTexto) c++;
    c += (g.escaleta || []).length;
    c += (g.tarjetas || []).length;
    return c;
  },

  countBudget(project) {
    let c = 0;
    if (project.presupuesto && project.presupuesto.areas) {
      (project.presupuesto.areas || []).forEach(a => { c += (a.items || []).length; });
    }
    return c;
  }
};

App.registerModule('dashboard', DashboardModule);
