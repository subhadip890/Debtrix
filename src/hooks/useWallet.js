import { useState, useCallback, useEffect } from 'react'
import { isConnected, requestAccess, getAddress } from '@stellar/freighter-api'

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
        if (!storedKey) {
          setIsInitializing(false)
          return
        }
        
        const { isConnected: hasFreighter } = await isConnected()
        if (!hasFreighter) {
          localStorage.removeItem('debtrix_wallet')
          setIsInitializing(false)
          return
        }
        
        // If stored key exists, verify we can still get the public key quietly
        const { address, error } = await getAddress()
        if (address && !error) {
          setPublicKey(address)
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
      const { isConnected: hasFreighter } = await isConnected()
      if (!hasFreighter) {
        throw new Error('Freighter wallet is not installed. Please add the extension.')
      }

      // requestAccess triggers the Freighter popup and returns the public key
      const { address, error } = await requestAccess()
      
      if (error) {
        throw new Error(error)
      }
      
      if (!address) {
        throw new Error('Connection request was declined or wallet is locked.')
      }

      setPublicKey(address)
      setNetwork('TESTNET') // Hardcoded for Level 1 scope
      localStorage.setItem('debtrix_wallet', address)
      
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
