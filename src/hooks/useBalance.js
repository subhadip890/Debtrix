import { useState, useEffect, useCallback } from 'react'
import appCache from '../utils/cache'

const HORIZON_TESTNET = 'https://horizon-testnet.stellar.org'
const BALANCE_TTL_MS  = 15_000   // 15 seconds

export function useBalance(publicKey) {
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance(null)
      return
    }

    const cacheKey = `balance:${publicKey}`

    // Serve from cache if fresh
    const cached = appCache.get(cacheKey)
    if (cached !== undefined) {
      setBalance(cached)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${HORIZON_TESTNET}/accounts/${publicKey}`)
      if (!res.ok) {
        if (res.status === 404) {
          setBalance('0.0000000')
          appCache.set(cacheKey, '0.0000000', BALANCE_TTL_MS)
          return
        }
        throw new Error(`Horizon error: ${res.status}`)
      }
      const data = await res.json()
      const nativeBalance = data.balances?.find((b) => b.asset_type === 'native')
      const value = nativeBalance?.balance ?? '0.0000000'
      setBalance(value)
      appCache.set(cacheKey, value, BALANCE_TTL_MS)
    } catch (err) {
      setError(err.message)
      setBalance(null)
    } finally {
      setLoading(false)
    }
  }, [publicKey])

  // Fetch immediately on key change
  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  // Poll every 15 seconds while connected
  useEffect(() => {
    if (!publicKey) return
    const interval = setInterval(fetchBalance, 15000)
    return () => clearInterval(interval)
  }, [publicKey, fetchBalance])

  const displayBalance = balance
    ? parseFloat(balance).toFixed(4)
    : null

  return { balance, displayBalance, loading, error, refetch: fetchBalance }
}
