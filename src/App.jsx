import { useState, useCallback, lazy, Suspense } from 'react'
import { AlertCircle, Zap } from 'lucide-react'

import { useWallet } from './hooks/useWallet'
import { useBalance } from './hooks/useBalance'
import { useTransaction } from './hooks/useTransaction'

import Header from './components/Header'
import WalletBar from './components/WalletBar'
import TransactionFeedback from './components/TransactionFeedback'
import DirectPayment from './components/DirectPayment'

// Defer heavy Three.js chunk — app UI is interactive before 3D loads
const AnimatedBackground = lazy(() => import('./components/AnimatedBackground'))

const BgFallback = () => (
  <div style={{ position: 'fixed', inset: 0, zIndex: -10, background: '#000000' }} />
)

export default function App() {
  const { publicKey, network, isConnected, connecting, isInitializing, error: walletError, connectWallet, disconnectWallet } = useWallet()
  const { displayBalance, loading: balanceLoading, refetch: refetchBalance } = useBalance(publicKey)
  const { status: txStatus, txHash, sendXLM, reset: resetTx } = useTransaction()

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
  const handleConfirmSettle = async (paymentParams) => {
    resetTx()
    const result = await sendXLM({
      from: publicKey,
      to: paymentParams.to,
      amount: paymentParams.amount,
      memo: 'Debtrix settle',
    })

    if (result.success) {
      pushNotification({
        status: 'success',
        txHash: result.hash,
        message: `Sent ${paymentParams.amount} XLM to ${paymentParams.to.slice(0,4)}...`,
      })
      refetchBalance()
    } else {
      pushNotification({
        status: 'failed',
        message: result.error,
      })
    }
  }

  // ── Initializing loader ──
  if (isInitializing) {
    return (
      <>
        <Suspense fallback={<BgFallback />}>
          <AnimatedBackground />
        </Suspense>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <Zap size={24} color="#a78bfa" className="animate-pulse-glow" />
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Loading wallet…</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* 3D Animated WebGL Background — lazy loaded, deferred after UI paint */}
      <Suspense fallback={<BgFallback />}>
        <AnimatedBackground />
      </Suspense>

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

        {isConnected ? (
          <div>
            <DirectPayment 
              publicKey={publicKey}
              onSettle={handleConfirmSettle}
              isPending={txStatus === 'pending'}
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
              Direct XLM Payment
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 2rem' }}>
              Connect your Freighter wallet to send direct XLM payments to anyone on the network.
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

      </main>

      {/* Toast notifications */}
      <TransactionFeedback notifications={notifications} onDismiss={dismissNotification} />
    </>
  )
}
