import { useState } from 'react'
import {
  Send, Loader2, CheckCircle2, XCircle, ExternalLink,
  Users, Hash, RefreshCw, CheckCheck
} from 'lucide-react'
import { isValidStellarAddress, calcShare } from '../utils/helpers'

/** Multi-step progress bar shown while paying N receivers */
function SettlementProgress({ current, total }) {
  if (!total || total < 1) return null
  const pct = Math.round((current / total) * 100)
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Sending payment {current} of {total}…
        </span>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a78bfa' }}>{pct}%</span>
      </div>
      <div style={{
        height: '6px', background: 'rgba(255,255,255,0.06)',
        borderRadius: '99px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
          borderRadius: '99px',
          transition: 'width 0.4s ease',
        }} />
      </div>
      {/* step dots */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            fontSize: '0.7rem', color: i < current ? '#34d399' : i === current - 1 ? '#a78bfa' : 'var(--text-muted)',
          }}>
            {i < current
              ? <CheckCheck size={12} color="#34d399" />
              : <Loader2 size={12} className={i === current - 1 ? 'animate-spin' : ''} />}
            Receiver {i + 1}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DirectPayment({
  publicKey, onSettle, txStatus, txHash, txError, onBack,
  settlementStep = 0, settlementTotal = 0,
}) {
  const [totalAmount, setTotalAmount] = useState('')
  const [divideBy, setDivideBy] = useState('')
  const [receivers, setReceivers] = useState([])
  const [error, setError] = useState('')

  const isPending = txStatus === 'pending'
  const isSuccess = txStatus === 'success'
  const isFailed = txStatus === 'failed'
  const isDone = isSuccess || isFailed

  const total = parseFloat(totalAmount) || 0
  const n = parseInt(divideBy, 10)
  const validN = !isNaN(n) && n >= 2
  const share = calcShare(total, n)
  const numReceivers = validN ? n - 1 : 0

  const handleDivideByChange = (e) => {
    const val = e.target.value
    setDivideBy(val)
    const newN = parseInt(val, 10)
    const newValidN = !isNaN(newN) && newN >= 2
    
    if (!newValidN) { 
      setReceivers([])
      return 
    }
    
    const needed = newN - 1
    setReceivers((prev) => {
      if (prev.length === needed) return prev
      if (prev.length < needed) return [...prev, ...Array(needed - prev.length).fill('')]
      return prev.slice(0, needed)
    })
  }

  const updateReceiver = (idx, val) =>
    setReceivers((prev) => { const u = [...prev]; u[idx] = val; return u })

  const resetAll = () => {
    setTotalAmount('')
    setDivideBy('')
    setReceivers([])
    setError('')
    if (onBack) onBack()
  }

  const handleSettle = (e) => {
    e.preventDefault()
    setError('')

    if (isNaN(total) || total <= 0) {
      setError('Please enter a valid total XLM amount.')
      return
    }
    if (!validN) {
      setError('Please enter "Divided By" as a number ≥ 2.')
      return
    }
    const filled = receivers.filter((r) => r.trim())
    if (filled.length < numReceivers) {
      setError(`Please fill in all ${numReceivers} receiver address${numReceivers > 1 ? 'es' : ''}.`)
      return
    }
    const invalid = filled.find((r) => !isValidStellarAddress(r))
    if (invalid) {
      setError(`Invalid Stellar address: ${invalid.slice(0, 10)}...`)
      return
    }
    if (filled.find((r) => r.trim() === publicKey)) {
      setError('One of the receivers is your own address.')
      return
    }
    onSettle({ receivers: filled.map((addr) => ({ to: addr, amount: share })), totalAmount: total })
  }

  return (
    <div style={{ maxWidth: '580px', margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '20px',
            background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
          }}>
            <Users size={32} color="#a78bfa" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
            Split & Pay XLM
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Enter the total amount and how many people are splitting it
          </p>
        </div>

        {/* ── Settlement Progress (shown when pending) ── */}
        {isPending && settlementTotal > 0 && (
          <SettlementProgress current={settlementStep} total={settlementTotal} />
        )}

        {/* ── Loading spinner for single-payment pending ── */}
        {isPending && settlementTotal === 0 && (
          <div style={{ textAlign: 'center', padding: '1rem 0', marginBottom: '1rem' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: '#a78bfa', margin: '0 auto' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Confirm in your wallet…
            </p>
          </div>
        )}

        {!isDone && (
          <form onSubmit={handleSettle}>
            {/* ── Amount + Divided By ── */}
            <div className="split-inputs">
              <div>
                <label className="label" htmlFor="total-amount">Total Amount (XLM)</label>
                <input
                  id="total-amount"
                  className="input"
                  type="number"
                  min="0"
                  step="0.0001"
                  placeholder="0.0000"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  disabled={isPending}
                  style={{ fontSize: '1.25rem', fontWeight: 700, textAlign: 'center' }}
                />
              </div>

              <div>
                <label className="label" htmlFor="divide-by">Divided By (N people)</label>
                <div style={{ position: 'relative' }}>
                  <Hash size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    id="divide-by"
                    className="input"
                    type="number"
                    min="2"
                    step="1"
                    placeholder="e.g. 3"
                    value={divideBy}
                    onChange={handleDivideByChange}
                    disabled={isPending}
                    style={{ paddingLeft: '2.25rem', fontSize: '1.25rem', fontWeight: 700, textAlign: 'center' }}
                  />
                </div>
              </div>
            </div>

            {/* ── Summary pill ── */}
            {validN && total > 0 && (
              <div className="summary-pill">
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Total</p>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: '#a78bfa' }}>{total.toFixed(4)} XLM</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Per Person</p>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: '#34d399' }}>{share.toFixed(4)} XLM</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>You Pay Out</p>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: '#fbbf24' }}>{(share * numReceivers).toFixed(4)} XLM</p>
                </div>
              </div>
            )}

            {/* ── Receivers ── */}
            {validN && numReceivers > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">
                  Receiver Addresses ({numReceivers} receiver{numReceivers > 1 ? 's' : ''} — everyone except you)
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {receivers.map((addr, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <input
                          id={`receiver-${idx}`}
                          className="input"
                          placeholder={`Person ${idx + 2} — G... Stellar address`}
                          value={addr}
                          onChange={(e) => updateReceiver(idx, e.target.value)}
                          disabled={isPending}
                          style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                        />
                      </div>
                      {total > 0 && (
                        <span style={{
                          fontSize: '0.75rem', fontWeight: 600, color: '#34d399',
                          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                          borderRadius: '6px', padding: '0.3rem 0.5rem', whiteSpace: 'nowrap',
                        }}>
                          {share.toFixed(4)} XLM
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!validN && (
              <div style={{
                background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)',
                borderRadius: '10px', padding: '0.875rem',
                color: '#fbbf24', fontSize: '0.8rem', marginBottom: '1.25rem', textAlign: 'center',
              }}>
                Enter a number ≥ 2 in "Divided By" to generate receiver slots
              </div>
            )}

            {error && (
              <div style={{
                padding: '0.75rem', background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px',
                color: '#f87171', fontSize: '0.8125rem', marginBottom: '1.25rem',
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="submit"
                id="btn-settle-payment"
                className="btn-primary"
                disabled={isPending || !publicKey || !validN}
                style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
              >
                {isPending
                  ? <><Loader2 size={18} className="animate-spin" /> Sending…</>
                  : <><Send size={18} /> Settle Payment{validN ? ` (${numReceivers} × ${share.toFixed(4)} XLM)` : ''}</>
                }
              </button>

              {(totalAmount || divideBy) && !isPending && (
                <button type="button" onClick={resetAll} className="btn-secondary" style={{ width: '100%', fontSize: '0.875rem' }}>
                  <RefreshCw size={14} /> Reset
                </button>
              )}
            </div>
          </form>
        )}

        {/* ── Success ── */}
        {isSuccess && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '2px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <CheckCircle2 size={36} style={{ color: 'var(--success)' }} />
            </div>
            <p style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.4rem' }}>All Payments Sent! 🎉</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              {total > 0 ? `${total.toFixed(4)} XLM split across ${numReceivers} receiver${numReceivers > 1 ? 's' : ''} (${share.toFixed(4)} XLM each)` : 'Payments sent successfully.'}
            </p>
            {txHash && (
              <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                className="btn-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <ExternalLink size={14} /> View on Stellar Explorer
              </a>
            )}
            <div>
              <button onClick={resetAll} className="btn-secondary" style={{ width: '100%' }}>← Back</button>
            </div>
          </div>
        )}

        {/* ── Failed ── */}
        {isFailed && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '2px solid var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <XCircle size={36} style={{ color: 'var(--error)' }} />
            </div>
            <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--error)', marginBottom: '0.5rem' }}>Transaction Failed</p>
            {txError && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>{txError}</p>}
            <button onClick={resetAll} className="btn-secondary" style={{ width: '100%' }}>← Back</button>
          </div>
        )}
      </div>
    </div>
  )
}
