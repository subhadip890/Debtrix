# 🧠 Debtrix Project Mind Map

## 📌 Idea

Debtrix is a blockchain-based expense splitting app that allows users to split bills and settle debts using XLM on Stellar (Testnet).

## 🚀 Features

* [x] Wallet connection (Freighter)
* [x] Balance display (Horizon API, polls every 15s)
* [x] Add expense (description, amount, participants, equal/manual split)
* [x] Debt calculation (greedy minimization algorithm)
* [x] Send XLM (settle debt via Freighter signing)
* [x] Expense persistence (localStorage survives reload)
* [ ] Smart contract integration
* [ ] Expense history (timestamped, filterable)
* [ ] Dashboard (advanced)
* [ ] Real-time updates

## 🥋 Levels Progress

### ⚪️ Level 1 – COMPLETE ✅

* [x] Wallet connect
* [x] Wallet disconnect
* [x] Balance fetch (Horizon Testnet API)
* [x] Expense input UI (modal form, full validation)
* [x] Debt calculation logic (greedy graph simplification)
* [x] XLM transaction send (Freighter signing + Horizon submit)
* [x] Transaction feedback UI (toast, explorer link, SettleModal states)

### 🟡 Level 2

* [ ] Multi-wallet support (StellarWalletsKit)
* [ ] Contract deployed (Soroban)
* [ ] Contract interaction
* [ ] Debt tracking on-chain
* [ ] Error handling

### 🟠 Level 3

* [ ] Dashboard
* [ ] Expense history
* [ ] Debt minimization logic (already partially done)
* [ ] Tests added (≥3)

### 🟢 Level 4

* [ ] Group expenses
* [ ] Auto-settlement
* [ ] Real-time feed
* [ ] CI/CD
* [ ] Mobile UI

## 📊 Current Status

**Level 1 COMPLETE** — Full MVP dApp live on Stellar Testnet.

Tech Stack: Vite + React, Vanilla CSS (glassmorphism), @stellar/stellar-sdk, @stellar/freighter-api

### Key architectural decisions
- Expenses stored in **localStorage** (persist across reloads)
- Participants identified by **raw Stellar G... public keys** (validated via SDK)
- Debt graph simplified using a **greedy two-pointer algorithm** (minimizes tx count)
- Wallet pubkey cached in localStorage for reconnect UX

## 🧱 Next Steps (Level 2)

1. Integrate StellarWalletsKit for multi-wallet support
2. Write Soroban smart contract for on-chain expense storage
3. Deploy contract to Stellar Testnet
4. Wire contract calls from the frontend
5. Add pending/failed transaction retry logic

## 📝 Commit Log

| Commit | Message |
|--------|---------|
| 1 | `init: setup Vite + React + Tailwind project` |
| 2 | `feat: implement wallet connect and disconnect` |
| 3 | `feat: fetch and display XLM balance` |
| 4 | `feat: add expense input and debt calculation logic` |
| 5 | `feat: implement XLM transaction with feedback UI` |
