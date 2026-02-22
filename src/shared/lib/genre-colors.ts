/**
 * Shared genre color palette and deterministic mapping.
 * Used by GenresView (genre list) and GenreView (genre detail) so the same
 * genre always gets the same color on both pages.
 */

export interface GenreColorScheme {
  stripe: string
  gradientFrom: string
  hoverFrom: string
  text: string
  watermark: string
  shadow: string
  border: string
}

const GENRE_COLOR_SCHEMES: GenreColorScheme[] = [
  {
    stripe: 'bg-amber-500',
    gradientFrom: 'from-amber-500/8',
    hoverFrom: 'hover:from-amber-500/15',
    text: 'text-amber-900 dark:text-amber-100',
    watermark: 'text-amber-500/[0.06] dark:text-amber-400/[0.06]',
    shadow: 'hover:shadow-amber-500/10',
    border: 'border-amber-500/20',
  },
  {
    stripe: 'bg-indigo-500',
    gradientFrom: 'from-indigo-500/8',
    hoverFrom: 'hover:from-indigo-500/15',
    text: 'text-indigo-900 dark:text-indigo-100',
    watermark: 'text-indigo-500/[0.06] dark:text-indigo-400/[0.06]',
    shadow: 'hover:shadow-indigo-500/10',
    border: 'border-indigo-500/20',
  },
  {
    stripe: 'bg-fuchsia-500',
    gradientFrom: 'from-fuchsia-500/8',
    hoverFrom: 'hover:from-fuchsia-500/15',
    text: 'text-fuchsia-900 dark:text-fuchsia-100',
    watermark: 'text-fuchsia-500/[0.06] dark:text-fuchsia-400/[0.06]',
    shadow: 'hover:shadow-fuchsia-500/10',
    border: 'border-fuchsia-500/20',
  },
  {
    stripe: 'bg-blue-500',
    gradientFrom: 'from-blue-500/8',
    hoverFrom: 'hover:from-blue-500/15',
    text: 'text-blue-900 dark:text-blue-100',
    watermark: 'text-blue-500/[0.06] dark:text-blue-400/[0.06]',
    shadow: 'hover:shadow-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    stripe: 'bg-emerald-500',
    gradientFrom: 'from-emerald-500/8',
    hoverFrom: 'hover:from-emerald-500/15',
    text: 'text-emerald-900 dark:text-emerald-100',
    watermark: 'text-emerald-500/[0.06] dark:text-emerald-400/[0.06]',
    shadow: 'hover:shadow-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    stripe: 'bg-rose-500',
    gradientFrom: 'from-rose-500/8',
    hoverFrom: 'hover:from-rose-500/15',
    text: 'text-rose-900 dark:text-rose-100',
    watermark: 'text-rose-500/[0.06] dark:text-rose-400/[0.06]',
    shadow: 'hover:shadow-rose-500/10',
    border: 'border-rose-500/20',
  },
  {
    stripe: 'bg-orange-500',
    gradientFrom: 'from-orange-500/8',
    hoverFrom: 'hover:from-orange-500/15',
    text: 'text-orange-900 dark:text-orange-100',
    watermark: 'text-orange-500/[0.06] dark:text-orange-400/[0.06]',
    shadow: 'hover:shadow-orange-500/10',
    border: 'border-orange-500/20',
  },
  {
    stripe: 'bg-slate-500',
    gradientFrom: 'from-slate-500/8',
    hoverFrom: 'hover:from-slate-500/15',
    text: 'text-slate-900 dark:text-slate-100',
    watermark: 'text-slate-500/[0.06] dark:text-slate-400/[0.06]',
    shadow: 'hover:shadow-slate-500/10',
    border: 'border-slate-500/20',
  },
  {
    stripe: 'bg-cyan-500',
    gradientFrom: 'from-cyan-500/8',
    hoverFrom: 'hover:from-cyan-500/15',
    text: 'text-cyan-900 dark:text-cyan-100',
    watermark: 'text-cyan-500/[0.06] dark:text-cyan-400/[0.06]',
    shadow: 'hover:shadow-cyan-500/10',
    border: 'border-cyan-500/20',
  },
  {
    stripe: 'bg-violet-500',
    gradientFrom: 'from-violet-500/8',
    hoverFrom: 'hover:from-violet-500/15',
    text: 'text-violet-900 dark:text-violet-100',
    watermark: 'text-violet-500/[0.06] dark:text-violet-400/[0.06]',
    shadow: 'hover:shadow-violet-500/10',
    border: 'border-violet-500/20',
  },
  {
    stripe: 'bg-zinc-500',
    gradientFrom: 'from-zinc-500/8',
    hoverFrom: 'hover:from-zinc-500/15',
    text: 'text-zinc-900 dark:text-zinc-100',
    watermark: 'text-zinc-500/[0.06] dark:text-zinc-400/[0.06]',
    shadow: 'hover:shadow-zinc-500/10',
    border: 'border-zinc-500/20',
  },
  {
    stripe: 'bg-teal-500',
    gradientFrom: 'from-teal-500/8',
    hoverFrom: 'hover:from-teal-500/15',
    text: 'text-teal-900 dark:text-teal-100',
    watermark: 'text-teal-500/[0.06] dark:text-teal-400/[0.06]',
    shadow: 'hover:shadow-teal-500/10',
    border: 'border-teal-500/20',
  },
  {
    stripe: 'bg-pink-500',
    gradientFrom: 'from-pink-500/8',
    hoverFrom: 'hover:from-pink-500/15',
    text: 'text-pink-900 dark:text-pink-100',
    watermark: 'text-pink-500/[0.06] dark:text-pink-400/[0.06]',
    shadow: 'hover:shadow-pink-500/10',
    border: 'border-pink-500/20',
  },
  {
    stripe: 'bg-lime-500',
    gradientFrom: 'from-lime-500/8',
    hoverFrom: 'hover:from-lime-500/15',
    text: 'text-lime-900 dark:text-lime-100',
    watermark: 'text-lime-500/[0.06] dark:text-lime-400/[0.06]',
    shadow: 'hover:shadow-lime-500/10',
    border: 'border-lime-500/20',
  },
  {
    stripe: 'bg-sky-500',
    gradientFrom: 'from-sky-500/8',
    hoverFrom: 'hover:from-sky-500/15',
    text: 'text-sky-900 dark:text-sky-100',
    watermark: 'text-sky-500/[0.06] dark:text-sky-400/[0.06]',
    shadow: 'hover:shadow-sky-500/10',
    border: 'border-sky-500/20',
  },
  {
    stripe: 'bg-green-500',
    gradientFrom: 'from-green-500/8',
    hoverFrom: 'hover:from-green-500/15',
    text: 'text-green-900 dark:text-green-100',
    watermark: 'text-green-500/[0.06] dark:text-green-400/[0.06]',
    shadow: 'hover:shadow-green-500/10',
    border: 'border-green-500/20',
  },
  {
    stripe: 'bg-stone-500',
    gradientFrom: 'from-stone-500/8',
    hoverFrom: 'hover:from-stone-500/15',
    text: 'text-stone-900 dark:text-stone-100',
    watermark: 'text-stone-500/[0.06] dark:text-stone-400/[0.06]',
    shadow: 'hover:shadow-stone-500/10',
    border: 'border-stone-500/20',
  },
  {
    stripe: 'bg-red-500',
    gradientFrom: 'from-red-500/8',
    hoverFrom: 'hover:from-red-500/15',
    text: 'text-red-900 dark:text-red-100',
    watermark: 'text-red-500/[0.06] dark:text-red-400/[0.06]',
    shadow: 'hover:shadow-red-500/10',
    border: 'border-red-500/20',
  },
  {
    stripe: 'bg-yellow-500',
    gradientFrom: 'from-yellow-500/8',
    hoverFrom: 'hover:from-yellow-500/15',
    text: 'text-yellow-900 dark:text-yellow-100',
    watermark: 'text-yellow-500/[0.06] dark:text-yellow-400/[0.06]',
    shadow: 'hover:shadow-yellow-500/10',
    border: 'border-yellow-500/20',
  },
  {
    stripe: 'bg-purple-500',
    gradientFrom: 'from-purple-500/8',
    hoverFrom: 'hover:from-purple-500/15',
    text: 'text-purple-900 dark:text-purple-100',
    watermark: 'text-purple-500/[0.06] dark:text-purple-400/[0.06]',
    shadow: 'hover:shadow-purple-500/10',
    border: 'border-purple-500/20',
  },
  {
    stripe: 'bg-gray-500',
    gradientFrom: 'from-gray-500/8',
    hoverFrom: 'hover:from-gray-500/15',
    text: 'text-gray-900 dark:text-gray-100',
    watermark: 'text-gray-500/[0.06] dark:text-gray-400/[0.06]',
    shadow: 'hover:shadow-gray-500/10',
    border: 'border-gray-500/20',
  },
]

/**
 * Get the color index for a genre.
 *
 * @param name - The name of the genre to get the color index for.
 * @returns The color index for the genre.
 * @description Just a simple function to get a deterministic index for the genre.
 */
export function genreNameToColorIndex(name: string): number {
  let hash = 0
  for (const ch of name) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0
  return Math.abs(hash) % GENRE_COLOR_SCHEMES.length
}

/**
 * Get the color scheme for a genre.
 *
 * @param name - The name of the genre to get the color scheme for.
 * @returns The color scheme for the genre.
 */
export function getGenreColorScheme(name: string): GenreColorScheme {
  const index = genreNameToColorIndex(name)
  return GENRE_COLOR_SCHEMES[index] ?? GENRE_COLOR_SCHEMES[0]!
}
