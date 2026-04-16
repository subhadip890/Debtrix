/**
 * Lightweight in-memory TTL cache.
 * Exported for unit testing.
 */

// ── Exported for unit tests ──────────────────────────────
export function createCache() {
  const store = new Map()

  function set(key, value, ttlMs) {
    store.set(key, { value, expiresAt: Date.now() + ttlMs })
  }

  function get(key) {
    const entry = store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      store.delete(key)
      return undefined
    }
    return entry.value
  }

  function has(key) {
    return get(key) !== undefined
  }

  function invalidate(key) {
    store.delete(key)
  }

  function clear() {
    store.clear()
  }

  return { set, get, has, invalidate, clear }
}
// ────────────────────────────────────────────────────────

// Singleton app-wide cache instance
const appCache = createCache()
export default appCache
