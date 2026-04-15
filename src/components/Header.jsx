import { Zap } from 'lucide-react'

export default function Header({ rightContent }) {
  return (
    <header
      style={{
        borderBottom: '1px solid var(--border)',
        background: 'rgba(7, 11, 20, 0.8)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1.5rem',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent-from), var(--accent-to))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px var(--accent-glow)',
            }}
          >
            <Zap size={18} color="#fff" fill="#fff" />
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: '1.125rem',
                letterSpacing: '-0.02em',
              }}
              className="gradient-text"
            >
              Debtrix
            </div>
            <div
              style={{
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                fontWeight: 500,
                lineHeight: 1,
                letterSpacing: '0.04em',
              }}
            >
              STELLAR · TESTNET
            </div>
          </div>
        </div>

        {/* Right slot – filled by parent */}
        <div>{rightContent}</div>
      </div>
    </header>
  )
}

