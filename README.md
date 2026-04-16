# ⚡ Debtrix — Expense Split & Auto-Pay on Stellar

> A Decentralized Payment Tracker built on the **Stellar Testnet**.
> **Level 2 - Yellow Belt Submission**

[![Stellar](https://img.shields.io/badge/Stellar-Testnet-blue?style=flat-square&logo=stellar)](https://stellar.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)

---

## 🟡 Level 2 - Yellow Belt Submission Checklist

This project was built to satisfy all requirements for the Stellar Yellow Belt (Level 2). The core feature is a **Payment Tracker** that handles multi-address payments with real-time status updates and smart contract synchronization.

### ✅ Requirements Met
- **3 error types handled:** 
  1. Wallet not found/connected
  2. Transaction rejected by user 
  3. Insufficient balance (checks for minimum XLM balance + reserve)
- **Contract deployed on testnet:** Rust Soroban contract deployed. Address listed below.
- **Contract called from the frontend:** Contract invoked using `StellarSdk.Operation.invokeHostFunction`.
- **Reading and writing data:** The frontend writes new payments using the `record_payment` function and reads the global history feed using `get_payment`.
- **Event listening / State synchronization:** The front-end automatically polls the contract history feed upon a successful transaction, syncing live state from the blockchain.
- **Transaction status visible:** Pending, Success, and Fail states are fully designed and displayed to the user.
- **Minimum 2+ meaningful commits:** Viewable in repository history.

---

## 📸 Required Submission Evidence

### 1. Multi-Wallet Options Available
The application uses `StellarWalletsKit` to support Freighter, Albedo, xBull, and more.
![Wallet Options](screenshots/multiwellate.png)

### 2. Transaction Hash / Contract Call
A successful XLM split payment and contract state update.
![Transaction Hash](screenshots/transaction_hash.png)

### 3. Deployed Contract Address (Testnet)
```text
CA5OIXRV6XOLVWSM2OOQEJZRK3XNN7T7NLTQ32IZH6ZWXIWZO5JKT6R3
```

### 4. Live Demo Link (Optional)
*(Live Demo URL can be placed here if deployed via Vercel/Netlify)*

---

## 🚀 How Debtrix Works

Debtrix is a blockchain-powered split-payment calculator. 

1. **Connect a Wallet:** Support for multiple Stellar wallets.
2. **Divided By N:** Enter a total XLM amount and how many people are splitting it. The app automatically calculates each person's exact share.
3. **Fill Receivers:** Enter the Stellar Testnet addresses of the people you are paying.
4. **Settle Payment:** The app executes sequential `payment` operations, then writes a permanent `PaymentLog` struct to the Soroban Smart Contract.
5. **Live Feed:** The "Live Smart Contract Feed" automatically reads from the Smart Contract, showing real-time global payments directly from the chain.

---

## ⚙️ Setup Instructions

### Prerequisites
- **Node.js** v18+
- [Freighter Wallet](https://www.freighter.app/) extension installed and switched to **Testnet**

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/subhadip890/Debtrix.git
cd Debtrix
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm run dev
```

Open **http://localhost:5173/** in your browser.

### Smart Contract Deployment (Rust / Soroban)
If you wish to compile and deploy your own instance of the contract:

```bash
# From the root directory, compile
cd contracts/expense_splitter
stellar contract build

# Assume you have a testnet identity setup called 'alice'
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/debtrix_contract.wasm \
  --source alice --network testnet
```
*After deploying, copy the resulting `C...` contract identifier and replace the `CONTRACT_ID` inside `src/hooks/useContract.js`.*

---

## 🏗️ Technical Architecture

| Feature | Implementation Detail |
|---|---|
| **Frontend Framework** | React + Vite |
| **Blockchain SDK** | `@stellar/stellar-sdk` |
| **Wallet Provider** | `@creit.tech/stellar-wallets-kit` |
| **Smart Contract** | Rust / Soroban |
| **Contract Queries** | `StellarSdk.SorobanRpc.Server.simulateTransaction` for gasless reads |
| **UI Design** | Custom Glassmorphism + Responsive Design |

---

## 📄 License
MIT © [subhadip890](https://github.com/subhadip890)
