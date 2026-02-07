# ShadowSettle Frontend

Web app for **ShadowSettle**: dashboard, create settlement, run confidential jobs, view results, profile (treasury), and Settle On-Chain.

Part of the [ShadowSettle](https://github.com/ShadowSettle/ShadowSettle) monorepo.

---

## Stack

- **Vite**, **React**, **TypeScript**
- **Tailwind CSS**, **Radix UI**
- **ethers.js** — wallet and on-chain deposit/withdraw

---

## Setup

1. Install dependencies:

```bash
npm install
```

2. (Optional) Configure backend URL. Copy `.env.example` to `.env` and set:

```bash
VITE_BACKEND_URL=http://localhost:3001
```

If unset, the app uses `http://localhost:3001`.

3. Run dev server:

```bash
npm run dev
```

4. Production build:

```bash
npm run build
```

Output is in `dist/`. Use `dist` as the publish directory for Vercel (or similar).

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build (output: `dist/`) |

---

## Environment

| Variable | Description |
|----------|-------------|
| `VITE_BACKEND_URL` | Backend API base URL (default: `http://localhost:3001`) |

---

## Features

- **Landing** — Hero, architecture, use cases, tech, Launch app
- **Dashboard** — Stats, recent activity (wallet-scoped), system status, network info, quick actions
- **Profile** — Connected wallet, treasury balance, deposit/withdraw USDC
- **Create Settlement Pool** — Name + fund pool in one step
- **Create Settlement** — Job name, dataset upload (or URL), schema validation, Run Confidential Compute
- **Job status** — Timeline, live logs, View Results when done
- **Settlement Results** — Payout table, output hash, verify, Settle On-Chain, Get test USDC
- **Jobs** — List and filter jobs, open status or results
