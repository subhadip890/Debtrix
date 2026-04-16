import { useState, useCallback } from 'react'
import * as StellarSdk from '@stellar/stellar-sdk'
import { useWallet } from './useWallet'
import appCache from '../utils/cache'

const HORIZON_URL = 'https://horizon-testnet.stellar.org'
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET
const PAYMENTS_TTL_MS = 10_000  // 10 seconds

// ✅ Deployed contract ID on Stellar Testnet
export const CONTRACT_ID = 'CA5OIXRV6XOLVWSM2OOQEJZRK3XNN7T7NLTQ32IZH6ZWXIWZO5JKT6R3'

export function useContract() {
  const { getKit, publicKey } = useWallet()
  const [txStatus, setTxStatus] = useState(null)
  const [txHash, setTxHash] = useState(null)
  const [error, setError] = useState(null)

  const reset = useCallback(() => {
    setTxStatus(null)
    setTxHash(null)
    setError(null)
  }, [])

  // Record a direct payment on-chain
  const recordPaymentOnChain = useCallback(async (paymentData) => {
    setTxStatus('pending')
    setTxHash(null)
    setError(null)

    try {
      if (!publicKey) throw new Error('Wallet not connected')

      const server = new StellarSdk.SorobanRpc.Server('https://soroban-testnet.stellar.org')
      const account = await server.getAccount(publicKey)

      // Build the PaymentLog struct as a Soroban ScVal map
      const paymentArgs = StellarSdk.xdr.ScVal.scvMap([
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.nativeToScVal('id', { type: 'string' }),
          val: StellarSdk.nativeToScVal(paymentData.id, { type: 'string' }),
        }),
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.nativeToScVal('from', { type: 'string' }),
          val: StellarSdk.nativeToScVal(paymentData.from, { type: 'address' }),
        }),
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.nativeToScVal('to', { type: 'string' }),
          val: StellarSdk.nativeToScVal(paymentData.to, { type: 'string' }),
        }),
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.nativeToScVal('amount', { type: 'string' }),
          val: StellarSdk.nativeToScVal(String(paymentData.amount), { type: 'string' }),
        }),
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.nativeToScVal('date', { type: 'string' }),
          val: StellarSdk.nativeToScVal(paymentData.date, { type: 'u64' }),
        }),
      ])

      const txBuilder = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          StellarSdk.Operation.invokeHostFunction({
            func: StellarSdk.xdr.HostFunction.hostFunctionTypeInvokeContract(
              new StellarSdk.xdr.InvokeContractArgs({
                contractAddress: new StellarSdk.Address(CONTRACT_ID).toScAddress(),
                functionName: 'record_payment',
                args: [paymentArgs],
              })
            ),
            auth: [],
          })
        )
        .setTimeout(180)

      let transaction = txBuilder.build()

      // Simulate (required for Soroban)
      const simulation = await server.simulateTransaction(transaction)
      if (simulation.error) {
        throw new Error(`Simulation failed: ${simulation.error}`)
      }

      // Assemble
      transaction = StellarSdk.SorobanDataBuilder.from(simulation.transactionData).build(transaction)

      // Sign with Wallet Kit (Freighter)
      const kit = getKit()
      const { signedTxXdr, error: signError } = await kit.signTransaction(transaction.toXDR(), {
        network: 'TESTNET',
      })

      if (signError) throw new Error(signError)
      if (!signedTxXdr || typeof signedTxXdr !== 'string') {
        throw new Error('You rejected the transaction in the wallet.')
      }

      // Submit
      const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE)
      const result = await server.sendTransaction(signedTx)

      if (result.status === 'ERROR') {
        throw new Error(`Transaction failed: ${result.hash}`)
      }

      // Poll for completion
      let statusResponse
      let attempts = 0
      while (attempts < 20) {
        statusResponse = await server.getTransaction(result.hash)
        if (statusResponse.status !== 'NOT_FOUND') break
        await new Promise((r) => setTimeout(r, 2000))
        attempts++
      }

      if (statusResponse.status === 'SUCCESS') {
        setTxHash(result.hash)
        setTxStatus('success')
        return { success: true, hash: result.hash }
      } else {
        throw new Error('Transaction failed on-chain.')
      }
    } catch (err) {
      console.error(err)
      let message = 'Smart Contract Transaction failed.'
      if (err?.message?.includes('User declined') || err?.message?.includes('rejected')) {
        message = 'You rejected the transaction.'
      } else if (err?.message?.includes('Insufficient')) {
        message = err.message
      } else if (err?.message) {
        message = err.message
      }
      setError(message)
      setTxStatus('failed')
      return { success: false, error: message }
    }
  }, [publicKey, getKit])

  // Read direct payment logs from the contract
  const fetchPaymentsFromChain = useCallback(async () => {
    const CACHE_KEY = 'contract:payments'

    // Return cached data if still fresh
    const cached = appCache.get(CACHE_KEY)
    if (cached) return cached

    try {
      const server = new StellarSdk.SorobanRpc.Server('https://soroban-testnet.stellar.org')
      // For read-only calls (get_payments), we simulate it with a dummy account
      const dummyAccount = new StellarSdk.Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0')
      
      const txBuilder = new StellarSdk.TransactionBuilder(dummyAccount, {
        fee: '100',
        networkPassphrase: NETWORK_PASSPHRASE,
      })
      .addOperation(
        StellarSdk.Operation.invokeHostFunction({
          func: StellarSdk.xdr.HostFunction.hostFunctionTypeInvokeContract(
            new StellarSdk.xdr.InvokeContractArgs({
              contractAddress: new StellarSdk.Address(CONTRACT_ID).toScAddress(),
              functionName: 'get_payments',
              args: [],
            })
          ),
          auth: [],
        })
      )
      .setTimeout(30)

      const simulation = await server.simulateTransaction(txBuilder.build())
      if (simulation.error) throw new Error(simulation.error)

      if (simulation.result?.retval) {
        const records = StellarSdk.scValToNative(simulation.result.retval)
        if (Array.isArray(records)) {
          const result = records.map(p => ({
            id: p.id,
            from: p.from,
            to: p.to,
            amount: p.amount,
            date: Number(p.date)
          })).reverse() // Show newest first
          appCache.set(CACHE_KEY, result, PAYMENTS_TTL_MS)
          return result
        }
      }
      return []
    } catch (err) {
      console.error('Failed to fetch payments:', err)
      return []
    }
  }, [])

  return { txStatus, txHash, error, recordPaymentOnChain, fetchPaymentsFromChain, reset }
}
