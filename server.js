const express = require('express');
const cors = require('cors');
const si = require('systeminformation');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
}));
app.use(express.json());

const bytesToGb = (bytes) => Number((bytes / 1024 / 1024 / 1024).toFixed(2));

const profiles = [
  {
    id: 'mmo-gaming',
    name: 'MMO Gaming',
    description: 'Foco em estabilidade de FPS, bom desempenho em raids e cargas com muitos jogadores.',
    idealHardware: {
      cpu: 'Ryzen 7 5700X3D ou superior com alto cache L3',
      ram: '32 GB DDR4/DDR5',
      gpu: 'RTX 3060 Ti / RTX 4060 Ti ou superior',
      storage: 'SSD NVMe para sistema e jogos',
    },
    priority: ['CPU cache', 'RAM suficiente', 'SSD rapido', 'GPU intermediaria ou superior'],
  },
  {
    id: 'web-design',
    name: 'Web Design',
    description: 'Foco em multitarefa, ferramentas criativas, browser pesado e produtividade visual.',
    idealHardware: {
      cpu: 'Ryzen 5 / Core i5 moderno ou superior',
      ram: '32 GB recomendados para Adobe, Figma e multitarefa',
      gpu: 'GPU dedicada intermediária ou iGPU moderna',
      storage: 'SSD NVMe com bom espaco livre',
    },
    priority: ['RAM', 'SSD', 'CPU equilibrada', 'Monitor e calibracao de cor'],
  },
  {
    id: 'heavy-rendering',
    name: 'Heavy Rendering',
    description: 'Foco em renderizacao 3D, video 4K, VRAM e cargas longas de CPU/GPU.',
    idealHardware: {
      cpu: 'Ryzen 9 / Core i9 ou workstation equivalente',
      ram: '64 GB ou mais',
      gpu: 'RTX 4070 Ti Super / RTX 4080 ou superior com 16 GB+ de VRAM',
      storage: 'SSD NVMe de alta velocidade e disco secundario para projetos',
    },
    priority: ['VRAM', 'CUDA/RT cores', 'CPU multicore', 'RAM alta', 'armazenamento rapido'],
  },
];

async function getHardwareInfo() {
  const [cpu, memory, graphics, disks] = await Promise.all([
    si.cpu(),
    si.mem(),
    si.graphics(),
    si.diskLayout(),
  ]);

  return {
    cpu: {
      brand: cpu.manufacturer,
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
    },
    gpu: graphics.controllers.map((gpu) => ({
      model: gpu.model,
      vendor: gpu.vendor,
      vramMb: gpu.vram,
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
  res.json(profiles);
});

app.listen(PORT, () => {
  console.log(`PC Smart Ops local agent running at http://localhost:${PORT}`);
});
