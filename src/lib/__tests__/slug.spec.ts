import { describe, it, expect } from 'vitest'
import { genreNameToSlug, slugToGenreDisplayName } from '../slug'

describe('slug', () => {
  describe('genreNameToSlug', () => {
    it('converts display name to kebab-case slug', () => {
      expect(genreNameToSlug('Science-Fiction')).toBe('science-fiction')
      expect(genreNameToSlug('Action')).toBe('action')
    })

    it('trims leading and trailing whitespace', () => {
      expect(genreNameToSlug('  Drama  ')).toBe('drama')
      expect(genreNameToSlug('\tHorror\n')).toBe('horror')
    })

    it('lowercases the result', () => {
      expect(genreNameToSlug('COMEDY')).toBe('comedy')
      expect(genreNameToSlug('Thriller')).toBe('thriller')
    })

    it('replaces spaces with single hyphen', () => {
      expect(genreNameToSlug('Science Fiction')).toBe('science-fiction')
      expect(genreNameToSlug('Soap   Opera')).toBe('soap-opera')
    })

    it('strips non-alphanumeric characters except hyphen', () => {
      expect(genreNameToSlug('Sci-Fi')).toBe('sci-fi')
      expect(genreNameToSlug("Children's")).toBe('childrens')
      expect(genreNameToSlug('Crime & Mystery')).toBe('crime-mystery')
    })

    it('collapses multiple hyphens into one', () => {
      expect(genreNameToSlug('Science--Fiction')).toBe('science-fiction')
      expect(genreNameToSlug('  Drama  ')).toBe('drama')
    })

    it('removes leading and trailing hyphens', () => {
      expect(genreNameToSlug('-Drama-')).toBe('drama')
      expect(genreNameToSlug('--Action--')).toBe('action')
    })

    it('returns empty string for empty or whitespace-only input', () => {
      expect(genreNameToSlug('')).toBe('')
      expect(genreNameToSlug('   ')).toBe('')
      expect(genreNameToSlug('\t\n')).toBe('')
    })

    it('handles single-word genres', () => {
      expect(genreNameToSlug('Drama')).toBe('drama')
      expect(genreNameToSlug('drama')).toBe('drama')
    })
  })

  describe('slugToGenreDisplayName', () => {
    it('converts slug to title-case when knownGenres is not provided', () => {
      expect(slugToGenreDisplayName('science-fiction')).toBe('Science Fiction')
      expect(slugToGenreDisplayName('action')).toBe('Action')
    })

    it('converts slug to title-case when knownGenres is empty array', () => {
      expect(slugToGenreDisplayName('science-fiction', [])).toBe('Science Fiction')
    })

    it('returns exact genre from knownGenres when slug matches', () => {
      const knownGenres = ['Science-Fiction', 'Soap Opera', 'Reality']
      expect(slugToGenreDisplayName('science-fiction', knownGenres)).toBe('Science-Fiction')
      expect(slugToGenreDisplayName('soap-opera', knownGenres)).toBe('Soap Opera')
    })

    it('falls back to title-case when slug does not match any known genre', () => {
      const knownGenres = ['Drama', 'Comedy']
      expect(slugToGenreDisplayName('science-fiction', knownGenres)).toBe('Science Fiction')
    })

    it('handles single-word slug', () => {
      expect(slugToGenreDisplayName('drama')).toBe('Drama')
      expect(slugToGenreDisplayName('comedy', ['Comedy'])).toBe('Comedy')
    })

    it('handles empty slug', () => {
      expect(slugToGenreDisplayName('')).toBe('')
      expect(slugToGenreDisplayName('', ['Drama'])).toBe('')
    })

    it('is inverse of genreNameToSlug when no knownGenres (display form)', () => {
      const displayNames = ['Science Fiction', 'Action', 'Soap Opera']
      for (const name of displayNames) {
        const slug = genreNameToSlug(name)
        const backToDisplay = slugToGenreDisplayName(slug)
        expect(backToDisplay).toBe(
          name
            .split(/\s+/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' '),
        )
      }
    })
  })
})
