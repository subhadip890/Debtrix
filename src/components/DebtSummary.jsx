import { ArrowRight, CheckCircle2, Wallet } from 'lucide-react'
import { truncateAddress } from '../utils/stellar'

function truncate(addr) {
  return truncateAddress(addr)
}

export default function DebtSummary({ debts, myPublicKey, onSettle }) {
  if (debts.length === 0) {
    return (
      <div
        className="glass-card"
        style={{
          padding: '3rem 2rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}
        >
          <CheckCircle2 size={24} style={{ color: 'var(--success)' }} />
        </div>
        <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
          All settled up! 🎉
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          No outstanding debts found.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {debts.map((debt, idx) => {
        const isMe = debt.from === myPublicKey
        const isMineToReceive = debt.to === myPublicKey
        const stableKey = `${debt.from}-${debt.to}`

        return (
          <div
            key={stableKey}
            className="glass-card"
            style={{
              padding: '1.125rem 1.25rem',
              borderColor: isMe ? 'rgba(239, 68, 68, 0.2)' : isMineToReceive ? 'rgba(16, 185, 129, 0.2)' : 'var(--border)',
              animation: 'slideUp 0.2s ease',
              animationDelay: `${idx * 0.04}s`,
              animationFillMode: 'both',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              {/* Debt flow */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                {/* From */}
                <div style={{ textAlign: 'center', minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--text-muted)',
                      marginBottom: '0.2rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontWeight: 600,
                    }}
                  >
                    Owes
                  </div>
                  <code
                    style={{
                      fontSize: '0.8rem',
                      color: isMe ? '#f87171' : 'var(--text-secondary)',
                      fontWeight: isMe ? 700 : 400,
                    }}
                  >
                    {isMe ? 'You' : truncate(debt.from)}
                  </code>
                </div>

                {/* Arrow + Amount */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                  <span
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: '1.0625rem',
                      color: isMe ? '#f87171' : isMineToReceive ? 'var(--success)' : 'var(--text-primary)',
                    }}
                  >
                    {debt.amount.toFixed(4)} XLM
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '32px', height: '1px', background: 'var(--border)' }} />
                    <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
                    <div style={{ width: '32px', height: '1px', background: 'var(--border)' }} />
                  </div>
                </div>

                {/* To */}
                <div style={{ textAlign: 'center', minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--text-muted)',
                      marginBottom: '0.2rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontWeight: 600,
                    }}
                  >
                    To
                  </div>
                  <code
                    style={{
                      fontSize: '0.8rem',
                      color: isMineToReceive ? '#34d399' : 'var(--text-secondary)',
                      fontWeight: isMineToReceive ? 700 : 400,
                    }}
                  >
                    {isMineToReceive ? 'You' : truncate(debt.to)}
                  </code>
                </div>
              </div>

              {/* Tags + action */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                {isMe && (
                  <span className="badge badge-red">You owe</span>
                )}
                {isMineToReceive && (
                  <span className="badge badge-green">You're owed</span>
                )}

                {isMe && onSettle && (
                  <button
                    id={`btn-settle-${idx}`}
                    onClick={() => onSettle(debt)}
                    className="btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                  >
                    <Wallet size={13} />
                    Settle
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
