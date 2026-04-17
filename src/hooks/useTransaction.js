import { useState, useCallback } from 'react'
import * as StellarSdk from '@stellar/stellar-sdk'
import { useWallet } from './useWallet'

const HORIZON_URL = 'https://horizon-testnet.stellar.org'
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET

export function useTransaction() {
  const [status, setStatus] = useState(null) // null | 'pending' | 'success' | 'failed'
  const [txHash, setTxHash] = useState(null)
  const [error, setError] = useState(null)
  const { getKit } = useWallet()

  const reset = useCallback(() => {
    setStatus(null)
    setTxHash(null)
    setError(null)
  }, [])

  const sendXLM = useCallback(async ({ from, to, amount, memo = '' }) => {
    setStatus('pending')
    setTxHash(null)
    setError(null)

    try {
      // 1. Validate destination
      if (!StellarSdk.StrKey.isValidEd25519PublicKey(to)) {
        throw new Error('Invalid destination Stellar address.')
      }

      const xlmAmount = parseFloat(amount)
      if (isNaN(xlmAmount) || xlmAmount <= 0) {
        throw new Error('Invalid amount.')
      }

      // 2. Load sender account
      const server = new StellarSdk.Horizon.Server(HORIZON_URL)
      const sourceAccount = await server.loadAccount(from)

      // 3. Check balance
      const nativeBal = sourceAccount.balances.find((b) => b.asset_type === 'native')
      const available = parseFloat(nativeBal?.balance || '0') - 1 // keep 1 XLM reserve
      if (xlmAmount > available) {
        throw new Error(
          `Insufficient balance. You have ${parseFloat(nativeBal?.balance || 0).toFixed(4)} XLM (1 XLM reserve required).`
        )
      }

      // 4. Build transaction
      const txBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: to,
            asset: StellarSdk.Asset.native(),
            amount: xlmAmount.toFixed(7),
          })
        )
        .setTimeout(180)

      if (memo && memo.trim()) {
        txBuilder.addMemo(StellarSdk.Memo.text(memo.trim().substring(0, 28)))
      }

      const transaction = txBuilder.build()

      // 5. Sign with WalletKit
      const kit = getKit()
      const { signedTxXdr, error: signError } = await kit.signTransaction(
        transaction.toXDR(),
        { network: 'TESTNET' }
      )

      if (signError) {
        throw new Error(signError)
      }

      const rawXdr = signedTxXdr
      if (!rawXdr || typeof rawXdr !== 'string') {
        throw new Error('You rejected the transaction in the wallet.')
      }

      // 6. Submit
      const signedTx = StellarSdk.TransactionBuilder.fromXDR(
        rawXdr,
        NETWORK_PASSPHRASE
      )
      const result = await server.submitTransaction(signedTx)

      setTxHash(result.hash)
      setStatus('success')
      return { success: true, hash: result.hash }
    } catch (err) {
      let message = 'Transaction failed.'

      if (err?.message?.includes('User declined')) {
        message = 'You rejected the transaction in Freighter.'
      } else if (err?.message?.includes('Insufficient')) {
        message = err.message
      } else if (err?.message?.includes('Invalid destination')) {
        message = err.message
      } else if (err?.response?.data?.extras?.result_codes) {
        const codes = err.response.data.extras.result_codes
        if (codes.operations?.includes('op_no_destination')) {
          message = 'Destination account does not exist on Stellar Testnet.'
        } else if (codes.transaction === 'tx_insufficient_fee') {
          message = 'Transaction fee too low.'
        } else {
          message = `Stellar error: ${codes.transaction || codes.operations?.join(', ')}`
        }
      } else if (err?.message) {
        message = err.message
      }

      setError(message)
      setStatus('failed')
      return { success: false, error: message }
    }
  }, [getKit])

  return { status, txHash, error, sendXLM, reset }
}
