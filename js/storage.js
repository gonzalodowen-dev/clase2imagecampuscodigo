/* CinePrep - Multi-Project Storage Engine */
const Storage = {
  LIST_KEY: 'cineprep_projects_list',
  ACTIVE_KEY: 'cineprep_active_project_id',

  getProjectsList() {
    try {
      const data = localStorage.getItem(this.LIST_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading projects list:', e);
      return [];
    }
  },

  saveProjectsList(list) {
    try {
      localStorage.setItem(this.LIST_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error saving projects list:', e);
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

  getProject(id) {
    const targetId = id || this.getActiveProjectId();
    if (!targetId) return null;
    try {
      const data = localStorage.getItem('cineprep_proj_' + targetId);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error reading project:', e);
      return null;
    }
  },

  saveProject(project) {
    if (!project || !project.id) return;
    project.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem('cineprep_proj_' + project.id, JSON.stringify(project));

      // Update projects list summary
      const list = this.getProjectsList();
      const idx = list.findIndex(p => p.id === project.id);
      const summary = {
        id: project.id,
        name: project.name,
        director: project.director || '',
        productora: project.productora || '',
        genero: project.genero || '',
        formato: project.formato || '',
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
    } catch (e) {
      console.error('Error saving project:', e);
    }
  },

  createProject(data) {
    const id = 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const newProject = {
      id,
      name: data.name || 'Nuevo Proyecto',
      director: data.director || '',
      productora: data.productora || '',
      genero: data.genero || '',
      formato: data.formato || 'Cortometraje',
      duracionEstimada: data.duracionEstimada || '',
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
      contactos: []
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
