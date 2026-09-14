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
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(defaultUser));
    } catch(e) {}
    return defaultUser;
  },

  setUser(userObj) {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(userObj));
    } catch(e) {}
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
        const currentActive = this.getActiveProjectId();
        localStorage.setItem('cineprep_proj_' + data.project.id, JSON.stringify(data.project));

        // Only refresh UI if active project was updated by someone else
        if (data.activeProjectId && data.activeProjectId === currentActive) {
          if (typeof App !== 'undefined' && App.activeModule) {
            App.navigate(App.activeModule);
          }
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

    return null;

    return null;
  },

    saveProject(project) {
    if (!project) return;
    if (!project.id) project.id = 'proj_' + Date.now();
    if (!project.code) {
      project.code = this.generateProjectCode();
    }
    try {
      const currentUser = this.getUser();
      if (!project.members) project.members = [];
      if (currentUser && !project.members.some(m => m.id === currentUser.id)) {
        project.members.push(currentUser);
      }
    } catch(e) {}

    project.updatedAt = new Date().toISOString();
    project = this.cleanProjectData(project);

    try {
      localStorage.setItem('cineprep_proj_' + project.id, JSON.stringify(project));

      const list = this.getProjectsList();
      const idx = list.findIndex(p => p.id === project.id);
      const summary = {
        id: project.id,
        code: project.code,
        name: project.name || 'Proyecto Sin Nombre',
        director: project.director || '',
        productora: project.productora || '',
        genero: project.genero || '',
        formato: project.formato || 'Cortometraje',
        duracionEstimada: project.duracionEstimada || '',
        members: project.members || [],
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
