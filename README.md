# ⚡ Debtrix — Expense Split & Auto-Pay on Stellar

> A decentralized expense-splitting dApp built on the **Stellar Testnet**.
> Split bills · Track debts · Settle with XLM — transparently, on-chain.

[![Stellar](https://img.shields.io/badge/Stellar-Testnet-blue?style=flat-square&logo=stellar)](https://stellar.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=flat-square&logo=vercel)](https://debtrix-theta.vercel.app/)

---

## 📌 Project Description

**Debtrix** is a blockchain-powered expense-splitting application built for the Stellar ecosystem. It removes the friction, confusion, and trust issues of group payments by letting users add shared expenses, automatically calculate who owes whom, and settle debts directly using **XLM** on the Stellar Testnet — all without any central intermediary.

### Who is it for?

- 🎓 Students splitting roommate bills and trip expenses
- 🍕 Friends dividing restaurant or grocery costs
- 💼 Small teams tracking shared project expenses
- 👥 Any group that needs transparent, fair payment tracking

### Why Stellar?

| Challenge | How Debtrix Solves It |
|---|---|
| Slow bank transfers | Stellar transactions settle in ~5 seconds |
| High payment app fees | Stellar fees are < 0.00001 XLM (~$0.000001) |
| "Who paid what?" disputes | All expenses and settlements recorded transparently |
| Trust issues in group payments | Blockchain settlements — no middleman required |

---

## ✅ White Belt Requirements Coverage

| Requirement | Implementation |
|---|---|
| Freighter wallet setup | Integrated via `@stellar/freighter-api` v6 |
| Stellar Testnet | Hardcoded to Testnet; TESTNET badge shown in UI |
| Wallet connect | One-click connect with popup via `requestAccess()` |
| Wallet disconnect | Clears session from memory and localStorage |
| Fetch XLM balance | Polled every 15s from Stellar Horizon Testnet API |
| Display balance in UI | Shown prominently in the header after connection |
| Send XLM transaction | Full settle flow: build → sign → submit on Testnet |
| Transaction feedback | Success/failure state + transaction hash shown in UI |
| Error handling | Covers no wallet, declined tx, insufficient balance |

---

## 🚀 Features

### 💳 Wallet
- Connect and disconnect Freighter wallet in one click
- Session persists across page reloads via localStorage
- Live **TESTNET** network badge in the header

### 💰 Balance Display
- Real-time XLM balance fetched from the Stellar Horizon API
- Auto-refreshes every 15 seconds
- Gracefully handles unfunded accounts

### 🧾 Expense Management
- Add shared expenses with a description, amount, and participants
- Equal split or custom manual split modes
- Participants are identified by Stellar public keys (`G...` addresses)
- Expenses persist in localStorage and survive page reloads

### ⚖️ Debt Engine
- Greedy two-pointer algorithm that minimizes settlement transactions
- Real-time **You Owe** and **You're Owed** dashboard cards

### 💸 XLM Settlement
- One-click debt settlement with XLM
- Transaction built using `@stellar/stellar-sdk`, signed by Freighter
- Feedback modal shows: Pending → Success / Failure
- Transaction hash displayed with a direct link to [Stellar Expert](https://stellar.expert) block explorer

### 🎨 UI / UX
- Three.js WebGL animated background (3D copper wireframe globe + starfield)
- Ultra-minimal dark glassmorphism design system
- Smooth micro-animations and fully responsive layout

---

## 🌐 Live Demo

**[https://debtrix-theta.vercel.app/](https://debtrix-theta.vercel.app/)**

> Deployed on Vercel — connect your Freighter wallet (set to **Stellar Testnet**) to try it live.

---

## 📸 Screenshots

### Landing Page — Wallet Disconnected

![Landing Page](screenshots/landing.png)

### Dashboard — Wallet Connected & Balance Displayed

![Wallet Connected and Balance](screenshots/balance.png)

---

## 🏗️ System Design & Architecture

```
╔══════════════════════════════════════════════════════════════════╗
║              DEBTRIX — SYSTEM ARCHITECTURE                      ║
║                  Level 1 · White Belt MVP                       ║
╚══════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│                                                              │
│  AnimatedBackground.jsx  ── Three.js WebGL Canvas            │
│  Header.jsx              ── Logo + wallet bar slot           │
│  WalletBar.jsx           ── Connect/disconnect + balance     │
│  App.jsx                 ── Shell: stats, tabs, modals       │
│    ├── ExpenseForm.jsx   ── Add expense modal                │
│    ├── ExpenseList.jsx   ── Scrollable expense cards         │
│    ├── DebtSummary.jsx   ── Debt cards with settle button    │
│    ├── SettleModal.jsx   ── Tx confirmation + status         │
│    └── TransactionFeedback.jsx ── Toast notifications        │
└─────────────────────────┬────────────────────────────────────┘
                          │ Props / Callbacks
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                       │
│                     (Custom Hooks)                           │
│                                                              │
│  useWallet.js       ── connect · disconnect · persist key    │
│  useBalance.js      ── fetch XLM balance (polls 15s)         │
│  useExpenses.js     ── CRUD expenses · debt algorithm        │
│  useTransaction.js  ── build tx · sign · submit · feedback   │
└───────┬─────────────────────────────┬────────────────────────┘
        │                             │
        ▼                             ▼
┌────────────────────┐   ┌────────────────────────────────────┐
│  LOCAL STORAGE     │   │       STELLAR NETWORK              │
│                    │   │                                    │
│  debtrix_wallet    │   │  Horizon Testnet API               │
│  debtrix_expenses  │   │  ├── GET /accounts/{id}            │
│                    │   │  └── POST /transactions            │
│  (survives reload) │   │                                    │
└────────────────────┘   │  Freighter Extension               │
                         │  ├── requestAccess()               │
                         │  ├── getAddress()                  │
                         │  └── signTransaction()             │
                         └────────────────────────────────────┘
```

### Request Flow — Settling a Debt

```
User clicks "Settle"
        │
        ▼
useTransaction.sendXLM()
        │
        ├─ 1. Validate destination address (stellar-sdk StrKey)
        ├─ 2. Load sender account from Horizon
        ├─ 3. Check available balance (reserves 1 XLM)
        ├─ 4. Build TransactionBuilder with payment operation
        ├─ 5. Sign XDR via Freighter popup
        ├─ 6. Submit signed transaction to Horizon
        │
        ▼
   Success → toast shows tx hash + Stellar Expert link
   Failure → toast shows human-readable error message
```

### Debt Simplification Algorithm

```
Problem: N people owe each other money → minimize number of payments

Input Example:
  Alice  owes Bob  10 XLM
  Bob    owes Carol 6 XLM
  Alice  owes Carol 4 XLM

Step 1 — Calculate net balances:
  Alice:  -14 XLM  (net debtor)
  Bob:    + 4 XLM  (net creditor)
  Carol:  +10 XLM  (net creditor)

Step 2 — Greedy two-pointer:
  Match largest debtor (Alice) with largest creditor (Carol)
  Transfer min(14, 10) = 10 → Alice pays Carol 10 XLM
  Remaining: Alice -4, Carol 0, Bob +4

  Match Alice with Bob
  Transfer 4 → Alice pays Bob 4 XLM

Output:
  ✅ 2 transactions instead of 3 (33% reduction)
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 19 + Vite 8 | Component-based UI with fast HMR |
| Styling | Vanilla CSS | Custom glassmorphism design tokens |
| 3D Background | Three.js + React Three Fiber | Animated WebGL globe + starfield |
| Blockchain SDK | `@stellar/stellar-sdk` | Transaction building + Horizon API |
| Wallet | `@stellar/freighter-api` v6 | Wallet connection + tx signing |
| Icons | Lucide React | Lightweight SVG icons |
| Fonts | Google Fonts (Inter, Space Grotesk) | Premium typography |

---

## ⚙️ Setup Instructions

### Prerequisites

- **Node.js** v18+
- **npm** v9+
- [Freighter Wallet](https://www.freighter.app/) browser extension installed
- Freighter set to **Stellar Testnet** (Settings → Network → Testnet)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/subhadip890/Debtrix.git
cd Debtrix

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open **http://localhost:5173/** in your browser.

### Fund Your Testnet Wallet

1. Open Freighter → switch to **Testnet**
2. Copy your `G...` public key
3. Visit [Stellar Friendbot](https://friendbot.stellar.org/?addr=YOUR_PUBLIC_KEY) to receive 10,000 test XLM instantly

### Production Build

```bash
npm run build
npm run preview
```

---

## 📂 Project Structure

```
Debtrix/
├── index.html                      # HTML entry point with SEO meta tags
├── vite.config.js                  # Vite + Tailwind + Buffer polyfill config
├── package.json
├── mind.md                         # Project roadmap and decision log
│
├── src/
│   ├── main.jsx                    # React entry point
│   ├── App.jsx                     # Main app shell
│   ├── index.css                   # Global design system
│   │
│   ├── hooks/
│   │   ├── useWallet.js            # Wallet connect / disconnect / session
│   │   ├── useBalance.js           # XLM balance polling
│   │   ├── useExpenses.js          # Expense CRUD + debt algorithm
│   │   └── useTransaction.js       # Build, sign, submit XLM payments
│   │
│   └── components/
│       ├── AnimatedBackground.jsx  # Three.js WebGL animated canvas
│       ├── Header.jsx              # Top navigation bar
│       ├── WalletBar.jsx           # Wallet status and controls
│       ├── ExpenseForm.jsx         # Add expense modal form
│       ├── ExpenseList.jsx         # Expense list display
│       ├── DebtSummary.jsx         # Simplified debt cards
│       ├── SettleModal.jsx         # Settlement confirmation modal
│       └── TransactionFeedback.jsx # Toast notification system
│
└── screenshots/
    ├── landing.png                 # Wallet disconnected state
    └── balance.png                 # Wallet connected with balance shown
```

---

## 🥋 Levels Roadmap

| Level | Belt | Status | Description |
|---|---|---|---|
| 1 | ⚪ White | ✅ **Complete** | Wallet · Balance · Transactions · UI |
| 2 | 🟡 Yellow | 🔜 Next | Soroban smart contracts · Multi-wallet |
| 3 | 🟠 Orange | Planned | Dashboard · Expense history · Tests |
| 4 | 🟢 Green | Planned | Auto-settlement · CI/CD · Mobile |

---

## 📝 Commit History — Level 1

| # | Commit |
|---|---|
| 1 | `init: setup Vite + React + Tailwind project` |
| 2 | `feat: implement wallet connect and disconnect` |
| 3 | `feat: fetch and display XLM balance` |
| 4 | `feat: add expense input and debt calculation logic` |
| 5 | `feat: implement XLM transaction with feedback UI` |

---

## 📄 License

MIT © [subhadip890](https://github.com/subhadip890)

---

<div align="center">

**Built on the Stellar Testnet · Powered by XLM**

[Stellar](https://stellar.org) · [Freighter Wallet](https://freighter.app) · [Horizon Testnet](https://horizon-testnet.stellar.org) · [Stellar Expert](https://stellar.expert)

</div>
