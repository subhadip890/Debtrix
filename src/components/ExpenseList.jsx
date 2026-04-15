import { Trash2, Calendar, User, Users, SplitSquareHorizontal } from 'lucide-react'

function truncate(addr) {
  if (!addr) return '—'
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ExpenseList({ expenses, onRemove }) {
  if (expenses.length === 0) {
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
            background: 'rgba(124, 58, 237, 0.1)',
            border: '1px solid rgba(124, 58, 237, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}
        >
          <SplitSquareHorizontal size={24} style={{ color: '#a78bfa' }} />
        </div>
        <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
          No expenses yet
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Add your first shared expense to get started
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {expenses.map((exp, index) => (
        <div
          key={exp.id}
          className="glass-card"
          style={{
            padding: '1.125rem 1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            animation: 'slideUp 0.2s ease',
            animationDelay: `${index * 0.03}s`,
            animationFillMode: 'both',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.2))',
              border: '1px solid rgba(124, 58, 237, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '1.25rem',
            }}
          >
            💸
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '0.5rem',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {exp.description}
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginTop: '0.375rem',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Paid by */}
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <User size={11} />
                    Paid by{' '}
                    <code style={{ fontSize: '0.7rem', color: '#a78bfa' }}>
                      {truncate(exp.paidBy)}
                    </code>
                  </span>

                  {/* Participants */}
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Users size={11} />
                    {exp.participants.length} participant{exp.participants.length !== 1 ? 's' : ''}
                  </span>

                  {/* Split type */}
                  <span className={`badge ${exp.splitType === 'equal' ? 'badge-purple' : 'badge-yellow'}`}>
                    {exp.splitType === 'equal' ? 'Equal' : 'Manual'}
                  </span>

                  {/* Date */}
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Calendar size={10} />
                    {formatDate(exp.createdAt)}
                  </span>
                </div>
              </div>

              {/* Amount + delete */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                <div
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: '1.0625rem',
                    color: 'var(--success)',
                  }}
                >
                  {parseFloat(exp.amount).toFixed(4)}{' '}
                  <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                    XLM
                  </span>
                </div>
                <button
                  id={`btn-remove-expense-${exp.id}`}
                  onClick={() => onRemove(exp.id)}
                  className="btn-danger"
                  style={{ padding: '0.375rem', borderRadius: '8px' }}
                  title="Remove expense"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
