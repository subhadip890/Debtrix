import { useState, useCallback } from 'react'
import * as StellarSdk from '@stellar/stellar-sdk'
import { useWallet } from './useWallet'

const HORIZON_URL = 'https://horizon-testnet.stellar.org'
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET

// Replace this with the actual deployed contract ID after running `stellar contract deploy`
export const CONTRACT_ID = 'CACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' 

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

  // Write to contract
  const submitExpenseToChain = useCallback(async (expenseData) => {
    setTxStatus('pending')
    setTxHash(null)
    setError(null)

    try {
      if(!publicKey) throw new Error("Wallet not connected")

      const server = new StellarSdk.SorobanRpc.Server('https://soroban-testnet.stellar.org')
      const account = await server.getAccount(publicKey)

      // Convert our JS object into Soroban ScVal map
      const expenseArgs = StellarSdk.xdr.ScVal.scvMap([
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.nativeToScVal('id', {type: 'string'}),
          val: StellarSdk.nativeToScVal(expenseData.id, {type: 'string'})
        }),
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.nativeToScVal('description', {type: 'string'}),
          val: StellarSdk.nativeToScVal(expenseData.description, {type: 'string'})
        }),
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.nativeToScVal('amount', {type: 'string'}),
          val: StellarSdk.nativeToScVal(expenseData.amount, {type: 'string'})
        }),
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.nativeToScVal('paid_by', {type: 'string'}),
          val: StellarSdk.nativeToScVal(expenseData.paidBy, {type: 'string'})
        }),
        // Participants is array of strings
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.nativeToScVal('participants', {type: 'string'}),
          val: StellarSdk.xdr.ScVal.scvVec(expenseData.participants.map(p => StellarSdk.nativeToScVal(p, {type: 'string'})))
        }),
        new StellarSdk.xdr.ScMapEntry({
          key: StellarSdk.nativeToScVal('date', {type: 'string'}),
          val: StellarSdk.nativeToScVal(expenseData.date, {type: 'u64'})
        }),
      ])

      const txBuilder = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
      .addOperation(StellarSdk.Operation.invokeHostFunction({
        func: StellarSdk.xdr.HostFunction.hostFunctionTypeInvokeContract(
          new StellarSdk.xdr.InvokeContractArgs({
            contractAddress: new StellarSdk.Address(CONTRACT_ID).toScAddress(),
            functionName: 'add_expense',
            args: [expenseArgs],
          })
        ),
        auth: []
      }))
      .setTimeout(180)

      let transaction = txBuilder.build()
      
      // Simulate (Required for Soroban)
      const simulation = await server.simulateTransaction(transaction)
      if (simulation.error) {
         throw new Error(`Simulation failed: ${simulation.error}`)
      }

      // Assemble
      transaction = StellarSdk.SorobanDataBuilder.from(simulation.transactionData).build(transaction)

      // Sign with Wallet Kit
      const kit = getKit()
      const { signedTxXdr, error: signError } = await kit.signTransaction(
        transaction.toXDR(),
        { network: 'TESTNET' }
      )

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
        await new Promise(r => setTimeout(r, 2000))
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

  return { txStatus, txHash, error, submitExpenseToChain, reset }
}
