/* CinePrep - Storage Engine con Sincronización Socket.IO en Tiempo Real */
const Storage = {

  USER_KEY: 'cineprep_user_profile',

  getUser() {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    const defaultUser = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      name: 'Usuario CinePrep',
      role: 'Director / Creador',
      email: '',
      avatar: '🎬',
      color: '#c89524'
    };
    this.setUser(defaultUser);
    return defaultUser;
  },

  setUser(userObj) {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(userObj));
    } catch(e) {}
    if (typeof socket !== 'undefined' && socket) {
      const p = this.getActiveProject();
      if (p && p.code) {
        socket.emit('join-project-room', { projectCode: p.code, user: userObj });
      }
    }
  },

  generateProjectCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'CP-';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  LIST_KEY: 'cineprep_projects_list',
  ACTIVE_KEY: 'cineprep_active_project_id',
  socket: typeof io !== 'undefined' ? io() : null,

  initSocket() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[CinePrep Socket] Conectado al servidor Node.js');
    });

    this.socket.on('init-state', (state) => {
      if (state && state.activeProjectData) {
        this.saveProjectsList(state.projectsList || []);
        if (state.activeProjectId) this.setActiveProjectId(state.activeProjectId);
        localStorage.setItem('cineprep_proj_' + state.activeProjectData.id, JSON.stringify(state.activeProjectData));
      }
    });

    this.socket.on('project-changed', (data) => {
      if (data && data.project) {
        this.saveProjectsList(data.projectsList || []);
        if (data.activeProjectId) this.setActiveProjectId(data.activeProjectId);
        localStorage.setItem('cineprep_proj_' + data.project.id, JSON.stringify(data.project));

        // Trigger UI refresh if App is ready
        if (typeof App !== 'undefined' && App.activeModule) {
          App.navigate(App.activeModule);
        }
      }
    });
  },

  getProjectsList() {
    try {
      const data = localStorage.getItem(this.LIST_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error al leer la lista de proyectos:', e);
      return [];
    }
  },

  saveProjectsList(list) {
    try {
      localStorage.setItem(this.LIST_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error al guardar la lista de proyectos:', e);
    }
  },

  getActiveProjectId() {
    return localStorage.getItem(this.ACTIVE_KEY) || null;
  },

  setActiveProjectId(id) {
    if (id) {
      localStorage.setItem(this.ACTIVE_KEY, id);
    } else {
      localStorage.removeItem(this.ACTIVE_KEY);
    }
  },

  cleanProjectData(proj) {
    if (!proj) return proj;
    if (proj.guion && proj.guion.guionTexto) {
      const txt = proj.guion.guionTexto;
      if (txt.startsWith('data:') || txt.includes('UEsDB') || txt.includes('wordprocessingml')) {
        proj.guion.guionTexto = 'Guión importado (texto extraído limpio).';
      }
    }
    return proj;
  },

  
  getActiveProject(id) {
    return this.getProject(id);
  },

  getProject(id) {
    let targetId = id || this.getActiveProjectId();
    let list = this.getProjectsList();

    if (!targetId && list.length > 0) {
      targetId = list[0].id;
      this.setActiveProjectId(targetId);
    }

    if (targetId) {
      try {
        const data = localStorage.getItem('cineprep_proj_' + targetId);
        if (data) {
          const parsed = JSON.parse(data);
          return this.cleanProjectData(parsed);
        }
      } catch (e) {
        console.error('Error al leer el proyecto:', e);
      }
    }

    if (!targetId && list.length === 0) {
      return this.createProject({
        name: 'Mi Primera Película',
        director: 'Director / Productor',
        productora: 'Productora CinePrep',
        genero: 'Drama',
        formato: 'Cortometraje',
        duracionEstimada: '15 min'
      });
    }

    return null;
  },

  saveProject(project) {
    if (!project.code) {
      project.code = this.generateProjectCode();
    }
    const currentUser = this.getUser();
    if (!project.members) project.members = [];
    if (!project.members.some(m => m.id === currentUser.id)) {
      project.members.push(currentUser);
    }
    if (!project) return;
    if (!project.id) project.id = 'proj_' + Date.now();
    project.updatedAt = new Date().toISOString();
    project = this.cleanProjectData(project);

    try {
      localStorage.setItem('cineprep_proj_' + project.id, JSON.stringify(project));

      const list = this.getProjectsList();
      const idx = list.findIndex(p => p.id === project.id);
      const summary = {
        id: project.id,
        name: project.name || 'Proyecto Sin Nombre',
        director: project.director || '',
        productora: project.productora || '',
        genero: project.genero || '',
        formato: project.formato || 'Cortometraje',
        duracionEstimada: project.duracionEstimada || '',
        updatedAt: project.updatedAt,
        createdAt: project.createdAt || project.updatedAt
      };

      if (idx >= 0) {
        list[idx] = summary;
      } else {
        list.unshift(summary);
      }
      this.saveProjectsList(list);
      this.setActiveProjectId(project.id);

      // Emit real-time project update via Socket.IO
      if (this.socket) {
        this.socket.emit('save-project', project);
      }
    } catch (e) {
      console.error('Error al guardar el proyecto:', e);
    }
  },

  createProject(data) {
    const id = 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const newProject = {
      id,
      name: data.name || 'Nuevo Proyecto Audiovisual',
      director: data.director || '',
      productora: data.productora || '',
      genero: data.genero || 'Drama',
      formato: data.formato || 'Cortometraje',
      duracionEstimada: data.duracionEstimada || '15 min',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      guion: { guionTexto: '', logline: '', tagline: '', sinopsisCorta: '', sinopsisLarga: '', tratamiento: '', escaleta: [], tarjetas: [] },
      guionTecnico: { planos: [] },
      storyboard: { frames: [] },
      moodboards: { vestuario: [], arte: [] },
      planProduccion: { tareas: [] },
      presupuesto: { moneda: 'ARS', areas: [] },
      casting: { personajes: [], actores: [] },
      catering: { dias: [], restricciones: [], proveedores: [] },
      traslados: { traslados: [], retiros: [], devoluciones: [] },
      planRodaje: { dias: [] },
      contactos: [],
      archivosDrive: []
    };

    this.saveProject(newProject);
    this.setActiveProjectId(id);
    return newProject;
  },

  duplicateProject(id) {
    const original = this.getProject(id);
    if (!original) return null;

    const copy = JSON.parse(JSON.stringify(original));
    copy.id = 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    copy.name = `${original.name} (Copia)`;
    copy.createdAt = new Date().toISOString();
    copy.updatedAt = new Date().toISOString();

    this.saveProject(copy);
    return copy;
  },

  deleteProject(id) {
    const targetId = id || this.getActiveProjectId();
    if (!targetId) return;

    localStorage.removeItem('cineprep_proj_' + targetId);
    let list = this.getProjectsList();
    list = list.filter(p => p.id !== targetId);
    this.saveProjectsList(list);

    if (this.getActiveProjectId() === targetId) {
      const nextActive = list.length > 0 ? list[0].id : null;
      this.setActiveProjectId(nextActive);
    }
  },

  closeActiveProject() {
    this.setActiveProjectId(null);
  }
};

// Initialize socket listeners on load
Storage.initSocket();
