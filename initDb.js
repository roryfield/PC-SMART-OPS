const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./setup_optimizer.db');

const profiles = [
  {
    keyName: 'mmo_gaming',
    displayName: 'Raid em MMO (WoW / Guild Wars)',
    minCpu: 'Ryzen 7 5700X3D / Intel Core i7',
    minRam: 16,
    minGpu: 'RTX 4060',
    minVram: 8,
    osTuning: 'Modo de Jogo ativado; plano de energia em desempenho maximo; latencia ultra-baixa no painel NVIDIA/AMD.',
    audioTuning: 'Audio espacial ativado; taxa de amostragem em 24-bit/48kHz para melhor posicionamento em jogos.',
    justification: 'MMOs dependem de cache L3 e desempenho single-core para manter frames estaveis em cidades e raides cheias.',
  },
  {
    keyName: 'web_design',
    displayName: 'Web Design e Produtos Digitais',
    minCpu: 'Ryzen 5 5600 / Intel Core i5',
    minRam: 32,
    minGpu: 'RTX 3060',
    minVram: 6,
    osTuning: 'Aceleracao por hardware ativada no Figma/Chrome; memoria virtual gerenciada pelo sistema no SSD.',
    audioTuning: 'Perfil linear/flat em receiver ou DAC para edicao limpa de midia e fidelidade sonora.',
    justification: 'O foco e estabilidade multitarefa, RAM abundante e precisao visual em navegadores e softwares criativos.',
  },
  {
    keyName: 'heavy_rendering',
    displayName: 'Edicao de Video 4K e Renderizacao 3D',
    minCpu: 'Ryzen 9 / Intel Core i9',
    minRam: 64,
    minGpu: 'RTX 4080 / RTX 5060 Ti',
    minVram: 12,
    osTuning: 'NVIDIA Studio Driver instalado; cache de disco dedicado em SSD NVMe secundario.',
    audioTuning: 'Clareza instrumental e isolamento de frequencias medias/agudas para monitoramento de faixas complexas.',
    justification: 'Renderizadores modernos exigem VRAM alta para texturas pesadas e CPU multicore para processamento paralelo.',
  },
];

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    cpu_model TEXT NOT NULL,
    ram_total INTEGER NOT NULL,
    gpu_model TEXT NOT NULL,
    gpu_vram INTEGER NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    min_cpu TEXT NOT NULL,
    min_ram INTEGER NOT NULL,
    min_gpu TEXT NOT NULL,
    min_vram INTEGER NOT NULL,
    os_tuning TEXT NOT NULL,
    audio_tuning TEXT NOT NULL,
    justification TEXT NOT NULL
  )`);

  const stmt = db.prepare(`INSERT OR IGNORE INTO profiles
    (key_name, display_name, min_cpu, min_ram, min_gpu, min_vram, os_tuning, audio_tuning, justification)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  profiles.forEach((profile) => {
    stmt.run(
      profile.keyName,
      profile.displayName,
      profile.minCpu,
      profile.minRam,
      profile.minGpu,
      profile.minVram,
      profile.osTuning,
      profile.audioTuning,
      profile.justification,
    );
  });

  stmt.finalize();
});

db.close((error) => {
  if (error) {
    console.error('Erro ao inicializar banco local:', error.message);
    process.exitCode = 1;
    return;
  }

  console.log('Banco de dados local inicializado e populado com sucesso.');
});
