import { describe, it, expect } from 'vitest'
import { arraysEqual } from '../arrays'

describe('arraysEqual', () => {
  it('returns true for two empty arrays', () => {
    expect(arraysEqual([], [])).toBe(true)
  })

  it('returns true when arrays have same length and elements in order', () => {
    expect(arraysEqual(['a'], ['a'])).toBe(true)
    expect(arraysEqual(['Action', 'Comedy', 'Drama'], ['Action', 'Comedy', 'Drama'])).toBe(true)
  })

  it('returns false when lengths differ', () => {
    expect(arraysEqual([], ['a'])).toBe(false)
    expect(arraysEqual(['a'], [])).toBe(false)
    expect(arraysEqual(['a', 'b'], ['a'])).toBe(false)
    expect(arraysEqual(['a'], ['a', 'b'])).toBe(false)
  })

  it('returns false when elements differ at same index', () => {
    expect(arraysEqual(['a'], ['b'])).toBe(false)
    expect(arraysEqual(['Action', 'Comedy'], ['Action', 'Drama'])).toBe(false)
    expect(arraysEqual(['Action', 'Comedy'], ['Comedy', 'Action'])).toBe(false)
  })

  it('returns false when one is a prefix of the other', () => {
    expect(arraysEqual(['a', 'b'], ['a', 'b', 'c'])).toBe(false)
    expect(arraysEqual(['a', 'b', 'c'], ['a', 'b'])).toBe(false)
  })
})
