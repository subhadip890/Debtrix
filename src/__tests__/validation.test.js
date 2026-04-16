import { describe, it, expect } from 'vitest'
import { isValidStellarAddress } from '../components/DirectPayment'
import * as StellarSdk from '@stellar/stellar-sdk'

describe('isValidStellarAddress — Stellar address validation', () => {
  it('accepts a valid Stellar Testnet public key (alice)', () => {
    expect(
      isValidStellarAddress('GDJM6ROXYQRTEVZ3Z3PDT6SOQ5BXJ3CHXRJTSVUP4BG3STUNPYDC6OAW')
    ).toBe(true)
  })

  it('accepts a programmatically generated valid Stellar public key', () => {
    const randomKey = StellarSdk.Keypair.random().publicKey()
    expect(isValidStellarAddress(randomKey)).toBe(true)
  })

  it('rejects an empty string', () => {
    expect(isValidStellarAddress('')).toBe(false)
  })

  it('rejects a random non-Stellar string', () => {
    expect(isValidStellarAddress('not-an-address')).toBe(false)
  })

  it('rejects an Ethereum-style address', () => {
    expect(isValidStellarAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44e')).toBe(false)
  })

  it('rejects an address that is too short', () => {
    expect(isValidStellarAddress('GDJM6ROXYQRTEVZ3Z3PDT6SOQ')).toBe(false)
  })

  it('rejects an address starting with wrong prefix (S = secret key)', () => {
    const kp = StellarSdk.Keypair.random()
    expect(isValidStellarAddress(kp.secret())).toBe(false)
  })
})
