import { describe, it, expect } from 'vitest'
import { arraysEqual, carouselsEqual, type CarouselLike } from '../arrays'

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

describe('carouselsEqual', () => {
  it('returns true for two empty arrays', () => {
    expect(carouselsEqual([], [])).toBe(true)
  })

  it('returns true when carousels have same genres and show ids in order', () => {
    const a: CarouselLike[] = [
      { genre: 'Drama', shows: [{ id: 1 }, { id: 2 }] },
      { genre: 'Comedy', shows: [{ id: 3 }] },
    ]
    const b: CarouselLike[] = [
      { genre: 'Drama', shows: [{ id: 1 }, { id: 2 }] },
      { genre: 'Comedy', shows: [{ id: 3 }] },
    ]
    expect(carouselsEqual(a, b)).toBe(true)
  })

  it('returns false when length differs', () => {
    const a: CarouselLike[] = [{ genre: 'Drama', shows: [{ id: 1 }] }]
    const b: CarouselLike[] = []
    expect(carouselsEqual(a, b)).toBe(false)
    expect(carouselsEqual(b, a)).toBe(false)
  })

  it('returns false when genre name differs', () => {
    const a: CarouselLike[] = [{ genre: 'Drama', shows: [{ id: 1 }] }]
    const b: CarouselLike[] = [{ genre: 'Comedy', shows: [{ id: 1 }] }]
    expect(carouselsEqual(a, b)).toBe(false)
  })

  it('returns false when show ids differ or order differs', () => {
    const base: CarouselLike[] = [{ genre: 'Drama', shows: [{ id: 1 }, { id: 2 }] }]
    expect(carouselsEqual(base, [{ genre: 'Drama', shows: [{ id: 1 }] }])).toBe(false)
    expect(carouselsEqual(base, [{ genre: 'Drama', shows: [{ id: 2 }, { id: 1 }] }])).toBe(false)
    expect(carouselsEqual(base, [{ genre: 'Drama', shows: [{ id: 1 }, { id: 3 }] }])).toBe(false)
  })
})
