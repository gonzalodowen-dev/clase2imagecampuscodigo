/* CinePrep - Servidor Node.js Express & Sincronización Socket.IO Multi-Usuario */
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'projects.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const PUBLIC_PATH = path.join(__dirname, 'public');

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.static(PUBLIC_PATH));

// Code Generator Helper
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'CP-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Data persistence
let activeState = {
  projectsList: [],
  activeProjectId: null,
  activeProjectData: null,
  allProjects: {}
};
let usersDb = {};

// Load Projects
if (fs.existsSync(DATA_FILE)) {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    if (raw) {
      const parsed = JSON.parse(raw);
      activeState.projectsList = parsed.projectsList || [];
      activeState.activeProjectId = parsed.activeProjectId || null;
      activeState.activeProjectData = parsed.activeProjectData || null;
      activeState.allProjects = parsed.allProjects || {};
      
      if (activeState.activeProjectData && activeState.activeProjectData.id) {
        if (!activeState.activeProjectData.code) {
          activeState.activeProjectData.code = generateCode();
        }
        activeState.allProjects[activeState.activeProjectData.id] = activeState.activeProjectData;
      }
    }
  } catch (e) {
    console.error('Error al leer projects.json:', e);
  }
} else {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

// Load Users
if (fs.existsSync(USERS_FILE)) {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    if (raw) usersDb = JSON.parse(raw);
  } catch (e) {
    console.error('Error al leer users.json:', e);
  }
}

function persistData() {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(activeState, null, 2), 'utf8');
  } catch (e) {
    console.error('Error al guardar projects.json:', e);
  }
}

function persistUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersDb, null, 2), 'utf8');
  } catch (e) {
    console.error('Error al guardar users.json:', e);
  }
}

// Track active socket users per project room
const roomUsers = {};

// Socket.IO Real-time Connection Logic
io.on('connection', (socket) => {
  console.log(`[CinePrep Socket] Cliente conectado: ${socket.id}`);
  socket.emit('init-state', activeState);

  socket.on('join-project-room', ({ projectCode, user }) => {
    if (!projectCode) return;
    const room = projectCode.toUpperCase();
    socket.join(room);
    socket.currentRoom = room;
    socket.currentUser = user || { name: 'Anónimo', role: 'Colaborador', icon: '🎬' };

    if (!roomUsers[room]) roomUsers[room] = {};
    roomUsers[room][socket.id] = socket.currentUser;

    io.to(room).emit('room-users-updated', Object.values(roomUsers[room]));
  });

  socket.on('save-project', (projectData) => {
    if (!projectData || !projectData.id) return;
    
    if (!projectData.code) {
      projectData.code = generateCode();
    }

    activeState.activeProjectId = projectData.id;
    activeState.activeProjectData = projectData;

    if (!activeState.allProjects) activeState.allProjects = {};
    activeState.allProjects[projectData.id] = projectData;

    if (!activeState.projectsList) activeState.projectsList = [];
    const idx = activeState.projectsList.findIndex(p => p.id === projectData.id);
    const summary = {
      id: projectData.id,
      code: projectData.code,
      name: projectData.name || 'Sin Nombre',
      director: projectData.director || '',
      productora: projectData.productora || '',
      genero: projectData.genero || '',
      formato: projectData.formato || 'Cortometraje',
      duracionEstimada: projectData.duracionEstimada || '',
      portada: projectData.portada || '',
      members: projectData.members || [],
      updatedAt: new Date().toISOString()
    };

    if (idx >= 0) {
      activeState.projectsList[idx] = summary;
    } else {
      activeState.projectsList.unshift(summary);
    }

    persistData();

    const room = projectData.code.toUpperCase();
    socket.to(room).emit('project-changed', {
      project: projectData,
      projectsList: activeState.projectsList,
      activeProjectId: activeState.activeProjectId
    });
    
    socket.broadcast.emit('project-changed', {
      project: projectData,
      projectsList: activeState.projectsList,
      activeProjectId: activeState.activeProjectId
    });
  });

  socket.on('set-live-scene', (sceneData) => {
    io.emit('live-scene-update', sceneData);
  });

  socket.on('disconnect', () => {
    const room = socket.currentRoom;
    if (room && roomUsers[room]) {
      delete roomUsers[room][socket.id];
      io.to(room).emit('room-users-updated', Object.values(roomUsers[room]));
    }
    console.log(`[CinePrep Socket] Cliente desconectado: ${socket.id}`);
  });
});

// API Routes
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', onlineClients: io.engine.clientsCount, activeProjectId: activeState.activeProjectId });
});

app.get('/api/projects/by-code/:code', (req, res) => {
  const code = (req.params.code || '').trim().toUpperCase();
  let found = null;
  if (activeState.allProjects) {
    found = Object.values(activeState.allProjects).find(p => p.code && p.code.toUpperCase() === code);
  }
  if (!found && activeState.activeProjectData && activeState.activeProjectData.code && activeState.activeProjectData.code.toUpperCase() === code) {
    found = activeState.activeProjectData;
  }

  if (found) {
    return res.json({ success: true, project: found });
  } else {
    return res.status(404).json({ success: false, message: 'Código de proyecto no encontrado.' });
  }
});

app.post('/api/users/profile', (req, res) => {
  const user = req.body;
  if (!user || !user.id) return res.status(400).json({ success: false, message: 'Datos de usuario inválidos.' });
  usersDb[user.id] = user;
  persistUsers();
  res.json({ success: true, user });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_PATH, 'index.html'));
});

app.get('/output.html', (req, res) => {
  res.sendFile(path.join(PUBLIC_PATH, 'output.html'));
});

server.listen(PORT, () => {
  console.log('======================================================');
  console.log(`   🎬 CinePrep Node.js Server en Ejecución`);
  console.log(`   🌐 Servidor corriendo en el Puerto: ${PORT}`);
  console.log(`   👉 Interfaz Web: http://localhost:${PORT}`);
  console.log(`   📺 Salida Visual (Output): http://localhost:${PORT}/output.html`);
  console.log(`   ⚡ Sincronización Socket.IO Activada`);
  console.log('======================================================');
});
