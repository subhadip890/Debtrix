import { useState, useCallback, useEffect } from 'react'

const isConnected = () =>
  typeof window !== 'undefined' && typeof window.freighter !== 'undefined'

export function useWallet() {
  const [publicKey, setPublicKey] = useState(() => {
    return localStorage.getItem('debtrix_wallet') || null
  })
  const [network, setNetwork] = useState('TESTNET')
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState(null)

  // On mount, validate stored key still has freighter access
  useEffect(() => {
    if (publicKey && isConnected()) {
      window.freighter
        .isConnected()
        .then((connected) => {
          if (!connected) {
            setPublicKey(null)
            localStorage.removeItem('debtrix_wallet')
          }
        })
        .catch(() => {})
    }
  }, [])

  const connectWallet = useCallback(async () => {
    setError(null)
    setConnecting(true)
    try {
      if (!isConnected()) {
        throw new Error('Freighter wallet not found. Please install the Freighter extension.')
      }

      const connected = await window.freighter.isConnected()
      if (!connected) {
        throw new Error('Please open Freighter and unlock your wallet.')
      }

      await window.freighter.requestAccess()
      const key = await window.freighter.getPublicKey()
      const net = await window.freighter.getNetwork()

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
