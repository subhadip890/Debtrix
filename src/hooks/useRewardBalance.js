import { useState, useEffect, useCallback } from 'react'
import * as StellarSdk from '@stellar/stellar-sdk'
import { useWallet } from './useWallet'
import appCache from '../utils/cache'

// DBTX Reward Token deployed on Stellar Testnet via GitHub Actions CI/CD
export const REWARD_TOKEN_ID = 'CCOPA4SSIJ3IU2PGIS7PWB4MPTORZF3HMPPZ7PFBN2UOJWZCQPU2CUKK'

export function useRewardBalance() {
  const { publicKey } = useWallet()
  const [dbxBalance, setDbxBalance] = useState('0')
  const [loading, setLoading] = useState(false)

  const fetchBalance = useCallback(async () => {
    if (!publicKey) return

    const CACHE_KEY = `reward:${publicKey}`
    const cached = appCache.get(CACHE_KEY)
    if (cached) {
      setDbxBalance(cached)
      return
    }

    setLoading(true)
    try {
      const server = new StellarSdk.SorobanRpc.Server('https://soroban-testnet.stellar.org')
      const dummyAccount = new StellarSdk.Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0')
      
      const txBuilder = new StellarSdk.TransactionBuilder(dummyAccount, {
        fee: '100',
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
      .addOperation(
        StellarSdk.Operation.invokeHostFunction({
          func: StellarSdk.xdr.HostFunction.hostFunctionTypeInvokeContract(
            new StellarSdk.xdr.InvokeContractArgs({
              contractAddress: new StellarSdk.Address(REWARD_TOKEN_ID).toScAddress(),
              functionName: 'balance',
              args: [new StellarSdk.Address(publicKey).toScVal()],
            })
          ),
          auth: [],
        })
      )
      .setTimeout(30)

      const simulation = await server.simulateTransaction(txBuilder.build())
      if (simulation.result?.retval) {
        const balanceNum = StellarSdk.scValToNative(simulation.result.retval)
        const formatted = String(balanceNum)
        setDbxBalance(formatted)
        appCache.set(CACHE_KEY, formatted, 15000)
      }
    } catch (err) {
      console.error('Failed to fetch reward balance:', err)
    } finally {
      setLoading(false)
    }
  }, [publicKey])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  return { dbxBalance, loading, refreshBalance: fetchBalance }
}
