/**
 * Shared Stellar utility helpers
 */

/**
 * Truncates a Stellar G… address for display.
 * @param {string} addr – full public key
 * @param {number} start – chars to keep at start (default 6)
 * @param {number} end   – chars to keep at end   (default 4)
 */
export function truncateAddress(addr, start = 6, end = 4) {
  if (!addr) return '—'
  return `${addr.slice(0, start)}…${addr.slice(-end)}`
}

/**
 * Returns a short label: "You" if addr === myKey, else truncated address.
 */
export function labelAddress(addr, myKey, start = 6, end = 4) {
  if (!addr) return '—'
  if (addr === myKey) return 'You'
  return truncateAddress(addr, start, end)
}
