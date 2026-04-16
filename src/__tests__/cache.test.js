import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createCache } from '../utils/cache'

describe('createCache — TTL in-memory cache', () => {
  let cache

  beforeEach(() => {
    cache = createCache()
    vi.useFakeTimers()
  })

  it('returns undefined for a key that has never been set', () => {
    expect(cache.get('missing')).toBeUndefined()
  })

  it('stores and retrieves a value within TTL', () => {
    cache.set('key1', 'hello', 5000)
    expect(cache.get('key1')).toBe('hello')
  })

  it('returns undefined after TTL has expired', () => {
    cache.set('key2', 'world', 1000)
    vi.advanceTimersByTime(1001) // expire the entry
    expect(cache.get('key2')).toBeUndefined()
  })

  it('has() returns true for a valid cached entry', () => {
    cache.set('key3', 42, 3000)
    expect(cache.has('key3')).toBe(true)
  })

  it('has() returns false after TTL expires', () => {
    cache.set('key4', 42, 500)
    vi.advanceTimersByTime(501)
    expect(cache.has('key4')).toBe(false)
  })

  it('invalidate() removes a cached entry immediately', () => {
    cache.set('key5', 'data', 10000)
    cache.invalidate('key5')
    expect(cache.get('key5')).toBeUndefined()
  })

  it('clear() removes all cached entries', () => {
    cache.set('a', 1, 10000)
    cache.set('b', 2, 10000)
    cache.clear()
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBeUndefined()
  })

  it('can store any value type (object, array, number)', () => {
    cache.set('obj', { x: 1 }, 5000)
    cache.set('arr', [1, 2, 3], 5000)
    cache.set('num', 99.5, 5000)
    expect(cache.get('obj')).toEqual({ x: 1 })
    expect(cache.get('arr')).toEqual([1, 2, 3])
    expect(cache.get('num')).toBe(99.5)
  })
})
