import { useEffect, useRef } from 'react'
import { CheckCircle2, XCircle, Clock, X, ExternalLink } from 'lucide-react'

export default function TransactionFeedback({ notifications, onDismiss }) {
  return (
    <div className="toast-container">
      {notifications.map((n) => (
        <Toast key={n.id} notification={n} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function Toast({ notification, onDismiss }) {
  const { id, status, txHash, message } = notification
  const timerRef = useRef(null)

  useEffect(() => {
    // Auto-dismiss success after 8s, error after 12s
    const delay = status === 'success' ? 8000 : status === 'failed' ? 12000 : null
    if (delay) {
      timerRef.current = setTimeout(() => onDismiss(id), delay)
    }
    return () => clearTimeout(timerRef.current)
  }, [id, status, onDismiss])

  const config = {
    success: {
      cls: 'toast toast-success',
      Icon: CheckCircle2,
      label: 'Transaction Confirmed',
    },
    failed: {
      cls: 'toast toast-error',
      Icon: XCircle,
      label: 'Transaction Failed',
    },
    pending: {
      cls: 'toast toast-pending',
      Icon: Clock,
      label: 'Transaction Pending…',
    },
  }[status] || { cls: 'toast', Icon: Clock, label: 'Unknown' }

  return (
    <div className={config.cls}>
      <config.Icon size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{config.label}</p>
        {message && (
          <p style={{ fontSize: '0.8rem', opacity: 0.8, wordBreak: 'break-word' }}>{message}</p>
        )}
        {txHash && status === 'success' && (
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.75rem',
              marginTop: '0.375rem',
              textDecoration: 'underline',
            }}
          >
            <ExternalLink size={11} />
            View on Explorer
          </a>
        )}
      </div>
      <button
        onClick={() => onDismiss(id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'inherit',
          opacity: 0.6,
          padding: '0.125rem',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
      >
        <X size={14} />
      </button>
    </div>
  )
}
