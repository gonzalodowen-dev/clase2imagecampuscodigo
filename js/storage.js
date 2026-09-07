/* CinePrep - Storage Engine con Fallback y Autocreación Segura */
const Storage = {
  LIST_KEY: 'cineprep_projects_list',
  ACTIVE_KEY: 'cineprep_active_project_id',

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

  getProject(id) {
    let targetId = id || this.getActiveProjectId();
    let list = this.getProjectsList();

    // Auto-recovery if active project ID is missing but list has projects
    if (!targetId && list.length > 0) {
      targetId = list[0].id;
      this.setActiveProjectId(targetId);
    }

    if (targetId) {
      try {
        const data = localStorage.getItem('cineprep_proj_' + targetId);
        if (data) return JSON.parse(data);
      } catch (e) {
        console.error('Error al leer el proyecto:', e);
      }
    }

    // Auto-create default initial project if database is completely empty
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
    if (!project) return;
    if (!project.id) project.id = 'proj_' + Date.now();
    project.updatedAt = new Date().toISOString();

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
