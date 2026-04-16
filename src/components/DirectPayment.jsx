import { useState, useEffect } from 'react'
import {
  Send, Loader2, CheckCircle2, XCircle, ExternalLink,
  Users, Hash, Trash2, RefreshCw
} from 'lucide-react'
import * as StellarSdk from '@stellar/stellar-sdk'

function isValidStellarAddress(addr) {
  try {
    return StellarSdk.StrKey.isValidEd25519PublicKey(addr)
  } catch {
    return false
  }
}

export default function DirectPayment({ publicKey, onSettle, txStatus, txHash, txError }) {
  const [totalAmount, setTotalAmount]   = useState('')
  const [divideBy, setDivideBy]         = useState('')        // N
  const [receivers, setReceivers]       = useState([])         // N-1 addresses
  const [error, setError]               = useState('')

  const isPending = txStatus === 'pending'
  const isSuccess = txStatus === 'success'
  const isFailed  = txStatus === 'failed'
  const isDone    = isSuccess || isFailed

  const total   = parseFloat(totalAmount) || 0
  const n       = parseInt(divideBy, 10)
  const validN  = !isNaN(n) && n >= 2           // must be at least 2 (you + 1 receiver)
  const share   = validN ? total / n : 0         // each person's share
  const numReceivers = validN ? n - 1 : 0        // you pay the N-1 others

  // Auto-resize receivers array when N changes
  useEffect(() => {
    if (!validN) { setReceivers([]); return }
    setReceivers((prev) => {
      const needed = numReceivers
      if (prev.length === needed) return prev
      if (prev.length < needed) return [...prev, ...Array(needed - prev.length).fill('')]
      return prev.slice(0, needed)
    })
  }, [numReceivers, validN])

  const updateReceiver = (idx, val) =>
    setReceivers((prev) => { const u = [...prev]; u[idx] = val; return u })

  const resetAll = () => {
    setTotalAmount('')
    setDivideBy('')
    setReceivers([])
    setError('')
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
    const filledReceivers = receivers.filter((r) => r.trim())
    if (filledReceivers.length < numReceivers) {
      setError(`Please fill in all ${numReceivers} receiver address${numReceivers > 1 ? 'es' : ''}.`)
      return
    }
    const invalidAddr = filledReceivers.find((r) => !isValidStellarAddress(r))
    if (invalidAddr) {
      setError(`Invalid Stellar address: ${invalidAddr.slice(0, 10)}...`)
      return
    }
    const selfAddr = filledReceivers.find((r) => r.trim() === publicKey)
    if (selfAddr) {
      setError('One of the receivers is your own address. Please use a different address.')
      return
    }

    onSettle({
      receivers: filledReceivers.map((addr) => ({ to: addr, amount: share })),
      totalAmount: total,
    })
  }

  return (
    <div style={{ maxWidth: '580px', margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '20px',
            background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
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

        {!isDone && (
          <form onSubmit={handleSettle}>

            {/* ── Row: Amount + Divided By ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Total Amount */}
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

              {/* Divided By N */}
              <div>
                <label className="label" htmlFor="divide-by">
                  Divided By (N people)
                </label>
                <div style={{ position: 'relative' }}>
                  <Hash
                    size={15}
                    style={{
                      position: 'absolute', left: '0.875rem', top: '50%',
                      transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
                    }}
                  />
                  <input
                    id="divide-by"
                    className="input"
                    type="number"
                    min="2"
                    step="1"
                    placeholder="e.g. 3"
                    value={divideBy}
                    onChange={(e) => setDivideBy(e.target.value)}
                    disabled={isPending}
                    style={{ paddingLeft: '2.25rem', fontSize: '1.25rem', fontWeight: 700, textAlign: 'center' }}
                  />
                </div>
              </div>
            </div>

            {/* ── Summary pill ── */}
            {validN && total > 0 && (
              <div style={{
                background: 'rgba(167,139,250,0.07)',
                border: '1px solid rgba(167,139,250,0.2)',
                borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem',
                display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem', textAlign: 'center',
              }}>
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

            {/* ── Receiver addresses (N-1 auto generated) ── */}
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
                      {/* Per-receiver share badge */}
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

            {/* Error */}
            {error && (
              <div style={{
                padding: '0.75rem', background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px',
                color: '#f87171', fontSize: '0.8125rem', marginBottom: '1.25rem',
              }}>
                {error}
              </div>
            )}

            {/* ── Buttons ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="submit"
                id="btn-settle-payment"
                className="btn-primary"
                disabled={isPending || !publicKey || !validN}
                style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
              >
                {isPending ? (
                  <><Loader2 size={18} className="animate-spin" /> Sending payments...</>
                ) : (
                  <><Send size={18} /> Settle Payment{validN ? ` (${numReceivers} receiver${numReceivers > 1 ? 's' : ''} × ${share.toFixed(4)} XLM)` : ''}</>
                )}
              </button>

              {(totalAmount || divideBy) && !isPending && (
                <button
                  type="button"
                  onClick={resetAll}
                  className="btn-secondary"
                  style={{ width: '100%', fontSize: '0.875rem' }}
                >
                  <RefreshCw size={14} /> Reset
                </button>
              )}
            </div>
          </form>
        )}

        {/* ── Success ── */}
        {isSuccess && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'rgba(16,185,129,0.1)', border: '2px solid var(--success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
            }}>
              <CheckCircle2 size={36} style={{ color: 'var(--success)' }} />
            </div>
            <p style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.4rem' }}>
              All Payments Sent! 🎉
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              {total > 0 ? `${total.toFixed(4)} XLM split across ${numReceivers} receiver${numReceivers > 1 ? 's' : ''} (${share.toFixed(4)} XLM each)` : 'Payments sent successfully.'}
            </p>
            {txHash && (
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                target="_blank" rel="noopener noreferrer"
                className="btn-success"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}
              >
                <ExternalLink size={14} /> View on Stellar Explorer
              </a>
            )}
            <div>
              <button onClick={resetAll} className="btn-secondary" style={{ width: '100%' }}>
                <RefreshCw size={14} /> Make Another Payment
              </button>
            </div>
          </div>
        )}

        {/* ── Failed ── */}
        {isFailed && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'rgba(239,68,68,0.1)', border: '2px solid var(--error)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
            }}>
              <XCircle size={36} style={{ color: 'var(--error)' }} />
            </div>
            <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--error)', marginBottom: '0.5rem' }}>
              Transaction Failed
            </p>
            {txError && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>{txError}</p>}
            <button onClick={resetAll} className="btn-secondary" style={{ width: '100%' }}>
              <RefreshCw size={14} /> Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
