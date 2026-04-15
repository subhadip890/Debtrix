import { useState, useCallback, createPortal } from 'react'
import { Plus, Receipt, BarChart3, AlertCircle, Zap } from 'lucide-react'

import { useWallet } from './hooks/useWallet'
import { useBalance } from './hooks/useBalance'
import { useExpenses } from './hooks/useExpenses'
import { useTransaction } from './hooks/useTransaction'

import Header from './components/Header'
import WalletBar from './components/WalletBar'
import ExpenseForm from './components/ExpenseForm'
import ExpenseList from './components/ExpenseList'
import DebtSummary from './components/DebtSummary'
import SettleModal from './components/SettleModal'
import TransactionFeedback from './components/TransactionFeedback'
import AnimatedBackground from './components/AnimatedBackground'

export default function App() {
  const { publicKey, network, isConnected, connecting, error: walletError, connectWallet, disconnectWallet } = useWallet()
  const { displayBalance, loading: balanceLoading, refetch: refetchBalance } = useBalance(publicKey)
  const { expenses, debts, addExpense, removeExpense } = useExpenses()
  const { status: txStatus, txHash, error: txError, sendXLM, reset: resetTx } = useTransaction()

  const [activeTab, setActiveTab] = useState('expenses') // 'expenses' | 'debts'
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [settleDebt, setSettleDebt] = useState(null) // the debt being settled
  const [notifications, setNotifications] = useState([])
  const [connectError, setConnectError] = useState(null)

  // ── Notification helpers ──
  const pushNotification = useCallback((notification) => {
    const id = crypto.randomUUID()
    setNotifications((prev) => [{ id, ...notification }, ...prev].slice(0, 5))
  }, [])

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  // ── Wallet connect with error feedback ──
  const handleConnect = async () => {
    setConnectError(null)
    try {
      await connectWallet()
    } catch (err) {
      setConnectError(err.message)
    }
  }

  // ── Settle flow ──
  const handleSettle = (debt) => {
    resetTx()
    setSettleDebt(debt)
  }

  const handleConfirmSettle = async (debt) => {
    const result = await sendXLM({
      from: publicKey,
      to: debt.to,
      amount: debt.amount,
      memo: 'Debtrix settle',
    })

    if (result.success) {
      pushNotification({
        status: 'success',
        txHash: result.hash,
        message: `Sent ${debt.amount.toFixed(4)} XLM`,
      })
      refetchBalance()
    } else {
      pushNotification({
        status: 'failed',
        message: result.error,
      })
    }
  }

  const handleCloseSettle = () => {
    setSettleDebt(null)
    resetTx()
  }

  // ── Stats ──
  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)
  const youOwe = debts.filter((d) => d.from === publicKey).reduce((sum, d) => sum + d.amount, 0)
  const youAreOwed = debts.filter((d) => d.to === publicKey).reduce((sum, d) => sum + d.amount, 0)

  return (
    <>
      {/* 3D Animated WebGL Background */}
      <AnimatedBackground />

      {/* Header */}
      <Header
        rightContent={
          <WalletBar
            publicKey={publicKey}
            network={network}
            displayBalance={displayBalance}
            balanceLoading={balanceLoading}
            connecting={connecting}
            onConnect={handleConnect}
            onDisconnect={disconnectWallet}
          />
        }
      />

      {/* Main */}
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

        {/* Connect Error Banner */}
        {(connectError || walletError) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1rem',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '10px',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              color: '#f87171',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {connectError || walletError}
          </div>
        )}

        {/* Hero / Stats row */}
        {isConnected ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <StatCard
              label="Total Expenses"
              value={`${totalExpenses.toFixed(4)} XLM`}
              sub={`${expenses.length} expense${expenses.length !== 1 ? 's' : ''}`}
              color="#a78bfa"
              bg="rgba(124, 58, 237, 0.1)"
              border="rgba(124, 58, 237, 0.2)"
            />
            <StatCard
              label="You Owe"
              value={`${youOwe.toFixed(4)} XLM`}
              sub={`${debts.filter((d) => d.from === publicKey).length} debt${debts.filter((d) => d.from === publicKey).length !== 1 ? 's' : ''}`}
              color="#f87171"
              bg="rgba(239, 68, 68, 0.08)"
              border="rgba(239, 68, 68, 0.2)"
            />
            <StatCard
              label="You're Owed"
              value={`${youAreOwed.toFixed(4)} XLM`}
              sub={`${debts.filter((d) => d.to === publicKey).length} credit${debts.filter((d) => d.to === publicKey).length !== 1 ? 's' : ''}`}
              color="#34d399"
              bg="rgba(16, 185, 129, 0.08)"
              border="rgba(16, 185, 129, 0.2)"
            />
          </div>
        ) : (
          /* Not connected – hero prompt */
          <div
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              marginBottom: '2rem',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
              }}
            >
              <Zap size={36} color="#fff" fill="#fff" />
            </div>
            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '2rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                marginBottom: '0.75rem',
              }}
              className="gradient-text"
            >
              Split bills on Stellar
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 2rem' }}>
              Connect your Freighter wallet to start splitting expenses and settling debts with XLM.
            </p>
            <button
              className="btn-primary animate-pulse-glow"
              onClick={handleConnect}
              disabled={connecting}
              style={{ fontSize: '1rem', padding: '0.875rem 2rem' }}
            >
              Connect Freighter Wallet
            </button>
          </div>
        )}

        {/* Tabs + Add button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '0.25rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '0.25rem',
            }}
          >
            <TabButton
              active={activeTab === 'expenses'}
              onClick={() => setActiveTab('expenses')}
              icon={<Receipt size={14} />}
              label={`Expenses ${expenses.length > 0 ? `(${expenses.length})` : ''}`}
              id="tab-expenses"
            />
            <TabButton
              active={activeTab === 'debts'}
              onClick={() => setActiveTab('debts')}
              icon={<BarChart3 size={14} />}
              label={`Debts ${debts.length > 0 ? `(${debts.length})` : ''}`}
              id="tab-debts"
            />
          </div>

          <button
            id="btn-add-expense"
            onClick={() => {
              if (!isConnected) {
                handleConnect()
                return
              }
              setShowExpenseForm(true)
            }}
            className="btn-primary"
          >
            <Plus size={15} />
            Add Expense
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'expenses' && (
          <ExpenseList expenses={expenses} onRemove={removeExpense} />
        )}
        {activeTab === 'debts' && (
          <DebtSummary
            debts={debts}
            myPublicKey={publicKey}
            onSettle={isConnected ? handleSettle : null}
          />
        )}
      </main>

      {/* Modals */}
      {showExpenseForm && (
        <ExpenseForm
          onAdd={addExpense}
          onClose={() => setShowExpenseForm(false)}
          myPublicKey={publicKey}
        />
      )}

      {settleDebt && (
        <SettleModal
          debt={settleDebt}
          myPublicKey={publicKey}
          onConfirm={handleConfirmSettle}
          onClose={handleCloseSettle}
          txStatus={txStatus}
          txHash={txHash}
          txError={txError}
        />
      )}

      {/* Toast notifications */}
      <TransactionFeedback notifications={notifications} onDismiss={dismissNotification} />
    </>
  )
}

// ── Small reusable sub-components ──

function StatCard({ label, value, sub, color, bg, border }) {
  return (
    <div
      className="glass-card"
      style={{
        padding: '1.25rem',
        background: bg,
        borderColor: border,
      }}
    >
      <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
        {label}
      </p>
      <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.125rem', color, lineHeight: 1.2 }}>
        {value}
      </p>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{sub}</p>
    </div>
  )
}

function TabButton({ active, onClick, icon, label, id }) {
  return (
    <button
      id={id}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.5rem 0.875rem',
        borderRadius: '7px',
        border: '1px solid',
        borderColor: active ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
        cursor: 'pointer',
        fontSize: '0.8125rem',
        fontWeight: 500,
        fontFamily: 'Inter, sans-serif',
        background: active ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
        color: active ? '#ffffff' : 'var(--text-muted)',
        transition: 'all 0.2s',
        boxShadow: active ? '0 2px 8px rgba(0, 0, 0, 0.2)' : 'none',
        backdropFilter: active ? 'blur(4px)' : 'none',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

