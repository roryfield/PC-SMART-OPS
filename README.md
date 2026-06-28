# PC Smart Ops Local Agent

Agente local em Node.js para capturar especificacoes de hardware do PC, carregar perfis de uso via SQLite e registrar snapshots historicos do setup.

## Requisitos

- Node.js 18+
- npm

## Instalacao

```powershell
npm install
```

Inicialize o banco local:

```powershell
npm run init-db
```

## Rodar o servidor

```powershell
npm start
```

O servidor sobe em:

```text
http://localhost:3001
```

## Endpoints

```text
GET /api/health
GET /api/hardware
GET /api/profiles
GET /api/snapshots
POST /api/snapshots
```

## Desenvolvimento

```powershell
npm run dev
```

O endpoint `/api/hardware` usa `systeminformation` para ler CPU, RAM, GPU e armazenamento da maquina local.

O endpoint `/api/profiles` le os perfis do banco `setup_optimizer.db`. Rode `npm run init-db` sempre que precisar recriar/popular a matriz inicial.
