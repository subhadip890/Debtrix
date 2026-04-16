import { useState, useCallback, useEffect } from 'react'
import { StellarWalletsKit, WalletNetwork, allowAllModules } from '@creit.tech/stellar-wallets-kit'

let kit = null
function getKit() {
  if (!kit) {
    kit = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      selectedWalletId: 'freighter',
      modules: allowAllModules(),
    })
  }
  return kit
}

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
        const storedWalletId = localStorage.getItem('debtrix_wallet_id')
        
        if (!storedKey || !storedWalletId) {
          setIsInitializing(false)
          return
        }
        
        const walletKit = getKit()
        walletKit.setWallet(storedWalletId)
        
        const { address, error } = await walletKit.getAddress()
        if (address && !error) {
          setPublicKey(address)
        } else {
          localStorage.removeItem('debtrix_wallet')
          localStorage.removeItem('debtrix_wallet_id')
        }
      } catch (e) {
        console.error("Wallet auto-connect failed:", e)
        localStorage.removeItem('debtrix_wallet')
        localStorage.removeItem('debtrix_wallet_id')
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
      const walletKit = getKit()
      
      // Request connection via the kit (will open kit's modal if configured, or default wallet)
      await walletKit.openModal({
        onWalletSelected: async (option) => {
          walletKit.setWallet(option.id)
          const { address, error } = await walletKit.getAddress()
          if (error) throw new Error(error)
          if (!address) throw new Error('Connection request was declined or wallet is locked.')
          
          setPublicKey(address)
          setNetwork('TESTNET')
          localStorage.setItem('debtrix_wallet', address)
          localStorage.setItem('debtrix_wallet_id', option.id)
        }
      })
      
    } catch (err) {
      console.error('Wallet connection error:', err)
      let msg = 'Failed to connect to wallet.'
      if (err.message && err.message.length < 100) {
        msg = err.message
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
    localStorage.removeItem('debtrix_wallet_id')
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
    getKit,
  }
}

