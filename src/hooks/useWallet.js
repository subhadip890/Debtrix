import { useState, useCallback, useEffect } from 'react'
import { isConnected, requestAccess, getPublicKey } from '@stellar/freighter-api'

export function useWallet() {
  const [publicKey, setPublicKey] = useState(null)
  const [network, setNetwork] = useState('TESTNET')
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)

  // Validate session on mount seamlessly
  useEffect(() => {
    async function checkSession() {
      try {
        const storedKey = localStorage.getItem('debtrix_wallet')
        if (!storedKey) return
        
        const hasFreighter = await isConnected()
        if (!hasFreighter) {
          localStorage.removeItem('debtrix_wallet')
          return
        }
        
        // If stored key exists, verify we can still get the public key quietly
        const key = await getPublicKey()
        if (key) {
          setPublicKey(key)
        } else {
          localStorage.removeItem('debtrix_wallet')
        }
      } catch (e) {
        console.error("Wallet auto-connect failed:", e)
        localStorage.removeItem('debtrix_wallet')
      } finally {
        setIsInitializing(false)
      }
    }
    checkSession()
  }, [])

  const connectWallet = useCallback(async () => {
    setError(null)
    setConnecting(true)
    try {
      const hasFreighter = await isConnected()
      if (!hasFreighter) {
        throw new Error('Freighter wallet is not installed. Please add the extension.')
      }

      // requestAccess triggers the Freighter popup and returns the public key
      const key = await requestAccess()
      
      if (!key) {
        throw new Error('Connection request was declined or wallet is locked.')
      }

      setPublicKey(key)
      setNetwork('TESTNET') // Hardcoded for Level 1 scope
      localStorage.setItem('debtrix_wallet', key)
      
    } catch (err) {
      console.error('Wallet connection error:', err)
      let msg = 'Failed to connect to Freighter.'
      if (err.message && err.message.length < 100) {
        msg = err.message
      } else if (typeof err === 'string' && err.length < 100) {
        msg = err
      }
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
    isInitializing,
    error,
    connectWallet,
    disconnectWallet,
  }
}
