# PC Smart Ops Local Agent

Agente local em Node.js para capturar especificacoes de hardware do PC e expor esses dados em uma API REST simples.

## Requisitos

- Node.js 18+
- npm

## Instalacao

```powershell
npm install
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
```

## Desenvolvimento

```powershell
npm run dev
```

O endpoint `/api/hardware` usa a biblioteca `systeminformation` para ler CPU, RAM, GPU e armazenamento da maquina local.
