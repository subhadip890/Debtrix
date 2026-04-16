import { useEffect, useState } from 'react'
import { Activity, ExternalLink, Loader2 } from 'lucide-react'
import { useContract } from '../hooks/useContract'

export default function RecentActivity({ txStatus }) {
  const { fetchPaymentsFromChain, fetchEventsFromChain } = useContract()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastLedger, setLastLedger] = useState(0)

  // Fetch from Soroban Contract
  useEffect(() => {
    let mounted = true
    let pollInterval = null

    const loadInitial = async () => {
      setLoading(true)
      const data = await fetchPaymentsFromChain()
      if (mounted) {
        setPayments(data.slice(0, 5))
        setLoading(false)
      }
    }

    const pollEvents = async () => {
      // Poll new events using getEvents
      const newEvents = await fetchEventsFromChain(lastLedger)
      if (newEvents && newEvents.length > 0 && mounted) {
        setPayments(prev => {
          // Merge and deduplicate by id
          const merged = [...newEvents, ...prev]
          const unique = Array.from(new Map(merged.map(item => [item.id, item])).values())
          return unique.sort((a, b) => b.date - a.date).slice(0, 5)
        })
        // Update last ledger
        setLastLedger(newEvents[0].ledger)
      }
    }
    
    // Fetch initially
    loadInitial()
    
    // Auto-refresh using getEvents every 5 seconds
    pollInterval = setInterval(pollEvents, 5000)

    // Fallback refresh when a local tx finishes
    if (txStatus === 'success') {
      setTimeout(pollEvents, 2000)
    }
    
    return () => { 
      mounted = false 
      clearInterval(pollInterval)
    }
  }, [fetchPaymentsFromChain, fetchEventsFromChain, lastLedger, txStatus])

  return (
    <div style={{ maxWidth: '580px', margin: '2rem auto 0' }}>
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Activity size={18} color="#a78bfa" />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>
            Live Smart Contract Feed
          </h3>
        </div>

        {loading && payments.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
            <Loader2 size={16} className="animate-spin" style={{ marginRight: '0.5rem' }} /> Loading from blockchain...
          </div>
        ) : payments.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1.5rem 0' }}>
            No payments recorded on-chain yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {payments.map((p, idx) => {
              const d = new Date(p.date * 1000)
              return (
                <div key={`${p.id}-${idx}`} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  padding: '0.875rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{p.amount} XLM</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.from.slice(0, 4)}...{p.from.slice(-4)} → {p.to.slice(0, 4)}...{p.to.slice(-4)}
                    </div>
                  </div>
                  
                  {p.id && (
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${p.id}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ padding: '0.4rem', background: 'rgba(167,139,250,0.1)', borderRadius: '6px', color: '#a78bfa' }}
                      title="View on Explorer"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
