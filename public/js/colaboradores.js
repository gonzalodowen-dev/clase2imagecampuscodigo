/* CinePrep - Colaboradores e Invitaciones Module */
const ColaboradoresModule = {
  render() {
    if (!App.requireProject()) return '<div class="empty-state"><div class="empty-icon">👥</div><h3>Crea un proyecto primero</h3><p>Ve al Dashboard para crear un nuevo proyecto.</p><button class="btn btn-primary" onclick="App.navigate(\'dashboard\')">Ir al Dashboard</button></div>';
    const project = Storage.getProject();
    const colabs = project.contactos || [];

    return `
      <div class="page-header">
        <h1><span class="header-icon">👥</span> Colaboradores e Invitaciones</h1>
        <p class="page-subtitle">Invita a miembros de tu equipo a completar la pre-producción en simultáneo</p>
        <div class="page-header-actions">
          <button class="btn btn-primary btn-sm" id="btnShareInviteLink">🔗 Generar Link / Código de Invitación</button>
          <button class="btn btn-secondary btn-sm" onclick="ColaboradoresModule.showRegisterModal()">+ Registrarme como Colaborador</button>
        </div>
      </div>
      <div class="page-body">
        <div class="card mb-lg card-accent">
          <div class="flex justify-between items-center">
            <div>
              <h3>🤝 Invitar al Equipo de Producción</h3>
              <p style="font-size:0.9rem;color:var(--text-secondary);margin-top:4px">Al compartir el código de invitación, los nuevos colaboradores podrán ingresar sus datos, rol y departamento. Toda la información se sincronizará automáticamente en la planilla de equipo, tareas y logística.</p>
            </div>
            <button class="btn btn-primary" onclick="ColaboradoresModule.showInviteLinkModal()">📋 Copiar Código de Invitación</button>
          </div>
        </div>

        <h3 class="mb-md">👥 Integrantes Registraros en el Proyecto (${colabs.length})</h3>
        ${colabs.length === 0 ? `
          <div class="empty-state card">
            <div class="empty-icon">👥</div>
            <h3>Sin colaboradores registrados aún</h3>
            <p>Genera un link de invitación para que tu equipo se registre con sus roles y contactos.</p>
            <div class="flex gap-sm justify-center mt-md">
              <button class="btn btn-primary" onclick="ColaboradoresModule.showInviteLinkModal()">🔗 Generar Link de Invitación</button>
              <button class="btn btn-secondary" onclick="ColaboradoresModule.showRegisterModal()">+ Registrar Colaborador Manual</button>
            </div>
          </div>
        ` : `
          <div class="grid-3">
            ${colabs.map((c, i) => `
              <div class="contact-card">
                <div class="contact-avatar">${c.nombre ? c.nombre.charAt(0).toUpperCase() : '👤'}</div>
                <div class="contact-info">
                  <div class="contact-name">${c.nombre}</div>
                  <div class="contact-role">${c.rol || 'Colaborador'} (${c.departamento || 'General'})</div>
                  <div class="contact-detail mt-xs">📞 ${c.telefono || 'Sin teléfono'}</div>
                  <div class="contact-detail">✉️ ${c.email || 'Sin email'}</div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  afterRender() {
    const btnShare = document.getElementById('btnShareInviteLink');
    if (btnShare) btnShare.addEventListener('click', () => this.showInviteLinkModal());
  },

  showInviteLinkModal() {
    const project = Storage.getProject();
    if (!project) return;

    // Generate lightweight encoded share payload
    const payload = { id: project.id, name: project.name, director: project.director };
    const inviteCode = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    const shareUrl = `${window.location.origin}${window.location.pathname}?invite=${inviteCode}`;

    App.showModal(`
      <div class="modal-header"><h2>🔗 Invitar Colaborador a "${project.name}"</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <p style="margin-bottom:var(--space-md)">Comparte este enlace o código con tus colaboradores. Al ingresar, podrán registrarse con sus nombres y roles, quedando agregados automáticamente a los campos correspondientes.</p>
        <div class="form-group">
          <label class="form-label">Link Único de Invitación</label>
          <input class="form-input" id="inviteUrlInput" value="${shareUrl}" readonly>
        </div>
        <div class="form-group">
          <label class="form-label">Código de Proyecto</label>
          <input class="form-input" id="inviteCodeInput" value="${inviteCode}" readonly>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary modal-close">Cerrar</button>
        <button class="btn btn-primary" id="btnCopyInviteLink">📋 Copiar Enlace al Portapapeles</button>
      </div>
    `);

    document.getElementById('btnCopyInviteLink').addEventListener('click', () => {
      const input = document.getElementById('inviteUrlInput');
      input.select();
      navigator.clipboard.writeText(input.value).then(() => {
        App.toast('¡Enlace de invitación copiado al portapapeles!', 'success');
      }).catch(() => {
        App.toast('Copia el texto del campo de enlace', 'info');
      });
    });
  },

  showRegisterModal() {
    const project = Storage.getProject();

    App.showModal(`
      <div class="modal-header"><h2>👥 Registro de Colaborador en "${project ? project.name : 'Proyecto'}"</h2><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">Nombre Completo *</label><input class="form-input" id="colabName" placeholder="Ej: Martin García"></div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Rol / Puesto en la Producción *</label>
            <input class="form-input" id="colabRole" placeholder="Ej: Director de Fotografía / Sonidista / Gaffer / Asist. Producción">
          </div>
          <div class="form-group">
            <label class="form-label">Departamento *</label>
            <select class="form-select" id="colabDept">
              <option>Dirección</option>
              <option selected>Producción</option>
              <option>Fotografía</option>
              <option>Arte</option>
              <option>Sonido</option>
              <option>Vestuario/Maquillaje</option>
              <option>Elenco</option>
              <option>Logística</option>
              <option>Legal/Permisos</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Teléfono / WhatsApp</label><input class="form-input" id="colabTel" placeholder="Ej: +54 9 11 2345-6789"></div>
          <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="colabEmail" placeholder="ejemplo@correo.com"></div>
        </div>
        <div class="form-group"><label class="form-label">Notas / Observaciones</label><input class="form-input" id="colabNotes" placeholder="Disponibilidad, equipos propios, etc."></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary modal-close">Cancelar</button>
        <button class="btn btn-primary" id="btnSaveColab">💾 Unirme al Proyecto</button>
      </div>
    `);

    document.getElementById('btnSaveColab').addEventListener('click', () => {
      const nombre = document.getElementById('colabName').value.trim();
      const rol = document.getElementById('colabRole').value.trim();
      if (!nombre || !rol) { App.toast('Nombre y Rol son obligatorios', 'warning'); return; }

      const dept = document.getElementById('colabDept').value;
      const tel = document.getElementById('colabTel').value.trim();
      const email = document.getElementById('colabEmail').value.trim();
      const notas = document.getElementById('colabNotes').value.trim();

      const proj = Storage.getProject();
      if (!proj.contactos) proj.contactos = [];

      // Add to contacts
      proj.contactos.push({ nombre, rol, departamento: dept, telefono: tel, email, notas });

      // Automatically add default departmental task in production plan if available
      if (!proj.planProduccion) proj.planProduccion = { tareas: [] };
      proj.planProduccion.tareas.push({
        titulo: `Coordinación de ${dept}: ${rol}`,
        departamento: dept,
        responsable: nombre,
        fechaLimite: '',
        estado: 'En Progreso',
        descripcion: `Responsable registrado: ${nombre} (${email || tel})`
      });

      Storage.saveProject(proj);
      App.closeModal();
      App.toast(`¡Bienvenido/a ${nombre}! Te has registrado como ${rol} en el departamento de ${dept}.`, 'success');
      App.navigate('contactos');
    });
  }
};

App.registerModule('colaboradores', ColaboradoresModule);
