const express = require('express');
const cors = require('cors');
const si = require('systeminformation');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3001;
const db = new sqlite3.Database('./setup_optimizer.db');

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
}));
app.use(express.json());

const bytesToGb = (bytes) => Number((bytes / 1024 / 1024 / 1024).toFixed(2));
const roundGb = (bytes) => Math.round(bytes / 1024 / 1024 / 1024);

function getMainGpu(graphics) {
  return graphics.controllers.find((gpu) => gpu.vram > 0) || graphics.controllers[0] || null;
}

async function getHardwareInfo() {
  const [cpu, memory, graphics, disks] = await Promise.all([
    si.cpu(),
    si.mem(),
    si.graphics(),
    si.diskLayout(),
  ]);

  const mainGpu = getMainGpu(graphics);

  return {
    cpu: {
      brand: cpu.manufacturer,
      vendor: cpu.vendor,
      model: cpu.brand,
      cores: {
        physical: cpu.physicalCores,
        logical: cpu.cores,
      },
      speedGhz: {
        base: Number(cpu.speed),
        min: Number(cpu.speedMin),
        max: Number(cpu.speedMax),
      },
    },
    ram: {
      totalGb: bytesToGb(memory.total),
      usedGb: bytesToGb(memory.used),
      freeGb: bytesToGb(memory.free),
      total: roundGb(memory.total),
      free: roundGb(memory.free),
    },
    mainGpu: mainGpu ? {
      model: mainGpu.model,
      vendor: mainGpu.vendor,
      vramMb: mainGpu.vram || 0,
      vramGb: mainGpu.vram ? Math.round(mainGpu.vram / 1024) : 0,
    } : {
      model: 'Nao detectada',
      vendor: 'Desconhecido',
      vramMb: 0,
      vramGb: 0,
    },
    gpu: graphics.controllers.map((gpu) => ({
      model: gpu.model,
      vendor: gpu.vendor,
      vramMb: gpu.vram || 0,
      vramGb: gpu.vram ? Number((gpu.vram / 1024).toFixed(2)) : null,
    })),
    storage: disks.map((disk) => ({
      name: disk.name,
      type: disk.type,
      interfaceType: disk.interfaceType,
      sizeGb: bytesToGb(disk.size),
    })),
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'pc-smart-ops-local-agent' });
});

app.get('/api/hardware', async (_req, res) => {
  try {
    const hardware = await getHardwareInfo();
    res.json(hardware);
  } catch (error) {
    console.error('Failed to read hardware information:', error);
    res.status(500).json({
      error: 'hardware_read_failed',
      message: 'Nao foi possivel capturar as informacoes de hardware deste PC.',
    });
  }
});

app.get('/api/profiles', (_req, res) => {
  db.all('SELECT * FROM profiles ORDER BY id ASC', [], (error, rows) => {
    if (error) {
      res.status(500).json({ error: 'profiles_read_failed', message: error.message });
      return;
    }

    res.json(rows);
  });
});

app.get('/api/snapshots', (_req, res) => {
  db.all('SELECT * FROM snapshots ORDER BY timestamp DESC LIMIT 50', [], (error, rows) => {
    if (error) {
      res.status(500).json({ error: 'snapshots_read_failed', message: error.message });
      return;
    }

    res.json(rows);
  });
});

app.post('/api/snapshots', (req, res) => {
  const { cpu_model, ram_total, gpu_model, gpu_vram } = req.body;

  if (!cpu_model || !ram_total || !gpu_model || gpu_vram === undefined) {
    res.status(400).json({
      error: 'invalid_snapshot_payload',
      message: 'Informe cpu_model, ram_total, gpu_model e gpu_vram.',
    });
    return;
  }

  const stmt = db.prepare(`INSERT INTO snapshots
    (timestamp, cpu_model, ram_total, gpu_model, gpu_vram)
    VALUES (?, ?, ?, ?, ?)`);

  stmt.run(new Date().toISOString(), cpu_model, ram_total, gpu_model, gpu_vram, function onInsert(error) {
    if (error) {
      res.status(500).json({ error: 'snapshot_write_failed', message: error.message });
      return;
    }

    res.status(201).json({ id: this.lastID, message: 'Snapshot gravado com sucesso.' });
  });

  stmt.finalize();
});

app.listen(PORT, () => {
  console.log(`PC Smart Ops local agent running at http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  db.close(() => process.exit(0));
});
