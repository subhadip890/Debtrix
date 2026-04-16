import { Wallet, LogOut, Loader2, ExternalLink, Copy, Check } from 'lucide-react'
import { useState } from 'react'

function truncate(key) {
  if (!key) return ''
  return `${key.slice(0, 4)}…${key.slice(-4)}`
}

export default function WalletBar({ publicKey, displayBalance, balanceLoading, dbxBalance, rewardLoading, connecting, onConnect, onDisconnect, network }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!publicKey) return
    await navigator.clipboard.writeText(publicKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!publicKey) {
    return (
      <button
        id="btn-connect-wallet"
        className="btn-primary animate-pulse-glow"
        onClick={onConnect}
        disabled={connecting}
        style={{ minWidth: '160px' }}
      >
        {connecting ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Wallet size={15} />
        )}
        {connecting ? 'Connecting…' : 'Connect Wallet'}
      </button>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}
    >
      {/* Network badge */}
      <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
        {network || 'TESTNET'}
      </span>

      {/* DBTX Reward Balance */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.375rem 0.875rem',
          borderRadius: '999px',
          background: 'rgba(167, 139, 250, 0.1)',
          border: '1px solid rgba(167, 139, 250, 0.2)',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#c084fc',
        }}
      >
        {rewardLoading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <>
            <span>{dbxBalance}</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>DBTX</span>
          </>
        )}
      </div>

      {/* XLM Balance */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.375rem 0.875rem',
          borderRadius: '999px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
        }}
      >
        {balanceLoading ? (
          <Loader2 size={13} style={{ color: 'var(--success)' }} className="animate-spin" />
        ) : (
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              color: 'var(--success)',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {displayBalance ?? '—'} XLM
          </span>
        )}
      </div>

      {/* Address */}
      <button
        id="btn-copy-address"
        onClick={handleCopy}
        title={publicKey}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.375rem 0.75rem',
          borderRadius: '999px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          fontSize: '0.8125rem',
          fontWeight: 500,
          transition: 'all 0.2s',
          fontFamily: 'monospace',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
          e.currentTarget.style.color = 'var(--text-primary)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }}
      >
        {truncate(publicKey)}
        {copied ? (
          <Check size={12} style={{ color: 'var(--success)' }} />
        ) : (
          <Copy size={12} />
        )}
      </button>

      {/* Explorer link */}
      <a
        href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
        target="_blank"
        rel="noopener noreferrer"
        title="View on Stellar Explorer"
        style={{
          display: 'flex',
          alignItems: 'center',
          color: 'var(--text-muted)',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <ExternalLink size={14} />
      </a>

      {/* Disconnect */}
      <button
        id="btn-disconnect-wallet"
        onClick={onDisconnect}
        className="btn-secondary"
        style={{ padding: '0.375rem 0.75rem' }}
        title="Disconnect wallet"
      >
        <LogOut size={14} />
      </button>
    </div>
  )
}
