import { useState } from 'react'
import { Send, Wallet, Loader2 } from 'lucide-react'
import * as StellarSdk from '@stellar/stellar-sdk'

function isValidStellarAddress(addr) {
  try {
    return StellarSdk.StrKey.isValidEd25519PublicKey(addr)
  } catch {
    return false
  }
}

export default function DirectPayment({ publicKey, onSettle, isPending }) {
  const [receiver, setReceiver] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  const handleSettle = (e) => {
    e.preventDefault()
    setError('')

    const cleanReceiver = receiver.trim()
    const cleanAmount = parseFloat(amount)

    if (!cleanReceiver) {
      setError('Please enter a receiver address.')
      return
    }
    if (!isValidStellarAddress(cleanReceiver)) {
      setError('Please enter a valid Stellar G... address.')
      return
    }
    if (cleanReceiver === publicKey) {
      setError('You cannot send XLM to yourself.')
      return
    }
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      setError('Please enter a valid amount greater than 0.')
      return
    }

    onSettle({
      to: cleanReceiver,
      amount: cleanAmount
    })
  }

  return (
    <div className="glass-card" style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ 
          width: '64px', 
          height: '64px', 
          borderRadius: '20px', 
          background: 'rgba(167, 139, 250, 0.1)', 
          border: '1px solid rgba(167, 139, 250, 0.2)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 1rem' 
        }}>
          <Wallet size={32} color="#a78bfa" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
          Direct Payment
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Send XLM directly to anyone on the Stellar Network
        </p>
      </div>

      <form onSubmit={handleSettle}>
        <div style={{ marginBottom: '1.25rem' }}>
          <label className="label" htmlFor="receiver-address">
            Receiver Address
          </label>
          <input
            id="receiver-address"
            className="input"
            placeholder="G... Stellar Address"
            style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label className="label" htmlFor="payment-amount">
            Amount to Send (XLM)
          </label>
          <input
            id="payment-amount"
            className="input"
            type="number"
            min="0"
            step="0.0001"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isPending}
            style={{ fontSize: '1.25rem', fontWeight: 600 }}
          />
        </div>

        {error && (
          <div style={{ 
            padding: '0.75rem', 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.2)', 
            borderRadius: '8px', 
            color: '#f87171', 
            fontSize: '0.8125rem',
            marginBottom: '1.25rem'
          }}>
            {error}
          </div>
        )}

        <button 
          type="submit" 
          className="btn-primary" 
          disabled={isPending || !publicKey}
          style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
        >
          {isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Confirm in Wallet...
            </>
          ) : (
            <>
              <Send size={18} />
               Settle Payment
            </>
          )}
        </button>
      </form>
    </div>
  )
}
