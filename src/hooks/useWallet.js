import { useState, useCallback, useEffect } from 'react'
import { isConnected as isFreighterConnected, requestAccess, getPublicKey, getNetwork as getFreighterNetwork } from '@stellar/freighter-api'

export function useWallet() {
  const [publicKey, setPublicKey] = useState(() => {
    return localStorage.getItem('debtrix_wallet') || null
  })
  const [network, setNetwork] = useState('TESTNET')
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState(null)

  // On mount, validate stored key still has freighter access
  useEffect(() => {
    const validateConnection = async () => {
      if (publicKey) {
        try {
          const connected = await isFreighterConnected()
          if (!connected) {
            setPublicKey(null)
            localStorage.removeItem('debtrix_wallet')
          }
        } catch (err) {
           // Handle case where freighter extension is not available
        }
      }
    }
    validateConnection()
  }, [])

  const connectWallet = useCallback(async () => {
    setError(null)
    setConnecting(true)
    try {
      const connected = await isFreighterConnected()
      if (!connected) {
        throw new Error('Please install Freighter extension or unlock your wallet.')
      }

      await requestAccess()
      const key = await getPublicKey()
      const net = await getFreighterNetwork()

      setPublicKey(key)
      setNetwork(net || 'TESTNET')
      localStorage.setItem('debtrix_wallet', key)
    } catch (err) {
      const msg = err?.message || 'Failed to connect wallet'
      setError(msg)
      throw new Error(msg)
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    setPublicKey(null)
    setNetwork('TESTNET')
    setError(null)
    localStorage.removeItem('debtrix_wallet')
  }, [])

  return {
    publicKey,
    network,
    isConnected: !!publicKey,
    connecting,
    error,
    connectWallet,
    disconnectWallet,
  }
}
