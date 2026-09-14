/* CinePrep - Servidor Node.js Express & Sincronización Socket.IO en Tiempo Real */
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'projects.json');

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.static(__dirname));

// Ensure data directory and file exist
let activeState = {
  projectsList: [],
  activeProjectId: null,
  activeProjectData: null
};

if (fs.existsSync(DATA_FILE)) {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    if (raw) activeState = JSON.parse(raw);
  } catch (e) {
    console.error('Error al leer projects.json:', e);
  }
} else {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(activeState, null, 2), 'utf8');
}

function persistData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(activeState, null, 2), 'utf8');
  } catch (e) {
    console.error('Error al guardar datos en disco:', e);
  }
}

// Socket.IO Real-time Connection Logic
io.on('connection', (socket) => {
  console.log(`[CinePrep Socket] Cliente conectado: ${socket.id}`);

  // Send current active state to newly connected client or output.html
  socket.emit('init-state', activeState);

  // Handle Project State Updates from Web Interface
  socket.on('save-project', (projectData) => {
    if (!projectData || !projectData.id) return;
    
    activeState.activeProjectId = projectData.id;
    activeState.activeProjectData = projectData;

    // Update list summary
    if (!activeState.projectsList) activeState.projectsList = [];
    const idx = activeState.projectsList.findIndex(p => p.id === projectData.id);
    const summary = {
      id: projectData.id,
      name: projectData.name || 'Sin Nombre',
      director: projectData.director || '',
      productora: projectData.productora || '',
      genero: projectData.genero || '',
      formato: projectData.formato || 'Cortometraje',
      duracionEstimada: projectData.duracionEstimada || '',
      updatedAt: new Date().toISOString()
    };

    if (idx >= 0) {
      activeState.projectsList[idx] = summary;
    } else {
      activeState.projectsList.unshift(summary);
    }

    persistData();

    // Broadcast updated project data to ALL clients & output.html in real-time!
    io.emit('project-changed', {
      project: projectData,
      projectsList: activeState.projectsList,
      activeProjectId: activeState.activeProjectId
    });
  });

  // Handle live scene / shot selection for output.html
  socket.on('set-live-scene', (sceneData) => {
    io.emit('live-scene-update', sceneData);
  });

  socket.on('disconnect', () => {
    console.log(`[CinePrep Socket] Cliente desconectado: ${socket.id}`);
  });
});

// API Routes
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', onlineClients: io.engine.clientsCount, activeProjectId: activeState.activeProjectId });
});

server.listen(PORT, () => {
  console.log('======================================================');
  console.log(`   🎬 CinePrep Node.js Server en Ejecución`);
  console.log(`   🌐 Interfaz Web: http://localhost:${PORT}`);
  console.log(`   📺 Salida Visual (Output): http://localhost:${PORT}/output.html`);
  console.log(`   ⚡ Sincronización Socket.IO Activada`);
  console.log('======================================================');
});
