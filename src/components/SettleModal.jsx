import { useEffect } from 'react'
import { X, Send, Loader2, CheckCircle2, XCircle, ExternalLink, ArrowRight } from 'lucide-react'
import { truncateAddress } from '../utils/stellar'

function truncate(addr) {
  return truncateAddress(addr, 8, 6)
}

export default function SettleModal({ debt, myPublicKey, onConfirm, onClose, txStatus, txHash, txError }) {
  const isPending = txStatus === 'pending'
  const isSuccess = txStatus === 'success'
  const isFailed = txStatus === 'failed'
  const done = isSuccess || isFailed

  // Close on Escape (unless tx is in flight)
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape' && !isPending) onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isPending, onClose])

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Settle Debt"
      onClick={(e) => !isPending && e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box" style={{ maxWidth: '460px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1875rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
              {isSuccess ? 'Payment Sent! 🎉' : isFailed ? 'Transaction Failed' : 'Settle Debt'}
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {isPending ? 'Confirm in Freighter…' : isSuccess ? 'Blockchain confirmed' : isFailed ? 'Something went wrong' : 'Review and confirm payment'}
            </p>
          </div>
          {!isPending && (
            <button
              id="btn-close-settle"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '0.5rem', borderRadius: '8px' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Status Card */}
        {!done && !isPending && (
          <div
            style={{
              background: 'rgba(124, 58, 237, 0.08)',
              border: '1px solid rgba(124, 58, 237, 0.2)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            {/* From → To */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>From</p>
                <code style={{ fontSize: '0.75rem', color: '#a78bfa' }}>{truncate(debt.from)}</code>
                {debt.from === myPublicKey && (
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>(You)</p>
                )}
              </div>

              <ArrowRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>To</p>
                <code style={{ fontSize: '0.75rem', color: '#34d399' }}>{truncate(debt.to)}</code>
              </div>
            </div>

            {/* Amount */}
            <div style={{ textAlign: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Amount</p>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.75rem', color: 'var(--text-primary)' }}>
                {debt.amount.toFixed(4)}{' '}
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>XLM</span>
              </p>
            </div>
          </div>
        )}

        {/* Pending State */}
        {isPending && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <Loader2
              size={48}
              style={{ color: '#a78bfa', margin: '0 auto 1rem' }}
              className="animate-spin"
            />
            <p style={{ fontWeight: 600, marginBottom: '0.375rem' }}>Waiting for Freighter…</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Please approve the transaction in your Freighter wallet.
            </p>
          </div>
        )}

        {/* Success State */}
        {isSuccess && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '2px solid var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <CheckCircle2 size={32} style={{ color: 'var(--success)' }} />
            </div>
            <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem' }}>
              {debt.amount.toFixed(4)} XLM sent successfully!
            </p>
            {txHash && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
                  Transaction Hash
                </p>
                <code
                  style={{
                    fontSize: '0.7rem',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '0.375rem 0.625rem',
                    borderRadius: '6px',
                    display: 'block',
                    wordBreak: 'break-all',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {txHash}
                </code>
                <a
                  id="link-stellar-explorer"
                  href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-success"
                  style={{ marginTop: '0.75rem', width: '100%' }}
                >
                  <ExternalLink size={14} />
                  View on Stellar Explorer
                </a>
              </div>
            )}
          </div>
        )}

        {/* Failed State */}
        {isFailed && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '2px solid var(--error)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <XCircle size={32} style={{ color: 'var(--error)' }} />
            </div>
            <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--error)', marginBottom: '0.5rem' }}>
              Transaction Failed
            </p>
            {txError && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', padding: '0 1rem' }}>
                {txError}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {!isPending && !done && (
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              id="btn-confirm-settle"
              onClick={() => onConfirm(debt)}
              className="btn-primary"
            >
              <Send size={14} />
              Confirm & Send XLM
            </button>
          </div>
        )}

        {done && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
            <button onClick={onClose} className="btn-secondary">
              {isSuccess ? 'Done' : 'Close'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
