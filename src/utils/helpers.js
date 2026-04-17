import * as StellarSdk from '@stellar/stellar-sdk'

export function isValidStellarAddress(addr) {
  try {
    return StellarSdk.StrKey.isValidEd25519PublicKey(addr)
  } catch {
    return false
  }
}

export function calcShare(total, n) {
  if (!n || n < 2 || isNaN(total) || total <= 0) return 0
  return total / n
}
