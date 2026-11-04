import raw from './locations.json'

export const APP_VERSION = '2.5.5'

export type Category =
  | 'arena'
  | 'stadium'
  | 'art'
  | 'ads'
  | 'beach'
  | 'hotel'
  | 'event'
  | 'blimp'
  | 'cars'
  | 'club'
  | 'restaurant'
  | 'landmark'
  | 'shop'

export interface MapEvent {
  date: string
  title: string
}

export interface Location {
  id: string
  name: string
  realName: string
  parodyOf: string | null
  category: Category
  lat: number
  lng: number
  address: string
  whats_here: string[]
  events: MapEvent[]
  addedOn: string
}

export interface BlimpStop {
  date: string
  venue: string
  event: string
}

interface SourceFile {
  version: string
  updated: string
  theme: string
  disclaimer: string
  locations: Location[]
  blimp_schedule: BlimpStop[]
}

const source = raw as SourceFile

/**
 * Street-address corrections. Names, copy, and events stay as published.
 * - w-south-beach: the file point sat about 400m south of 2201 Collins Ave.
 * - biscayne-banner: nudged onto YVE Hotel at 146 Biscayne Blvd.
 * - pompano-blimp-base: the file point matched the airpark centroid. The
 *   Goodyear hangar is on the west side of the field.
 */
const PIN_FIX: Record<string, { lat: number; lng: number }> = {
  'w-south-beach': { lat: 25.79753, lng: -80.12733 },
  'biscayne-banner': { lat: 25.77607, lng: -80.18825 },
  'pompano-blimp-base': { lat: 26.2486, lng: -80.1195 },
}

for (const id of Object.keys(PIN_FIX)) {
  if (!source.locations.some((location) => location.id === id)) {
    throw new Error(`Pin correction has no location: ${id}`)
  }
}

export const updated = source.updated
export const disclaimer = source.disclaimer

export const locations: Location[] = source.locations.map((location) => {
  const pin = PIN_FIX[location.id]
  return pin ? { ...location, lat: pin.lat, lng: pin.lng } : location
})

export const blimpSchedule: BlimpStop[] = [...source.blimp_schedule].sort((a, b) =>
  a.date.localeCompare(b.date),
)

export const FILTERS = [
  { id: 'all', label: 'All', categories: null },
  { id: 'blimp', label: 'Blimp', categories: ['blimp'] as const },
  { id: 'ads', label: 'Ads', categories: ['ads'] as const },
  { id: 'arenas', label: 'Arenas & stadiums', categories: ['arena', 'stadium'] as const },
  { id: 'beach', label: 'Beach', categories: ['beach', 'hotel'] as const },
  { id: 'clubs', label: 'Clubs', categories: ['club'] as const },
  { id: 'landmarks', label: 'Landmarks', categories: ['landmark'] as const },
  { id: 'shops', label: 'Shops/Restaurants', categories: ['shop', 'restaurant'] as const },
  { id: 'events', label: 'Events', categories: ['event'] as const },
  { id: 'art', label: 'Art', categories: ['art'] as const },
  { id: 'cars', label: 'Cars', categories: ['cars'] as const },
] as const

export type FilterId = (typeof FILTERS)[number]['id']

export function matchesFilter(filter: FilterId, category: Category): boolean {
  const spec = FILTERS.find((item) => item.id === filter)
  if (!spec || spec.categories === null) return true
  return (spec.categories as readonly Category[]).includes(category)
}

export function countFor(filter: FilterId): number {
  return locations.filter((location) => matchesFilter(filter, location.category)).length
}

export function miamiTodayISO(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function nextFlyover(todayIso: string): BlimpStop | null {
  return blimpSchedule.find((stop) => stop.date >= todayIso) ?? null
}

export function locationForVenue(venue: string): Location | undefined {
  const needle = venue.trim().toLowerCase()
  return locations.find((location) => {
    const candidates = [
      location.name,
      location.realName,
      `${location.realName} / ${location.name}`,
      `${location.name} / ${location.realName}`,
    ]
    return candidates.some((candidate) => candidate.toLowerCase() === needle)
  })
}

export function isScheduledHere(location: Location, stop: BlimpStop | null): boolean {
  if (!stop) return false
  return locationForVenue(stop.venue)?.id === location.id
}

export function formatDay(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day, 16))
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York',
  }).format(date)
}

export function formatUpdated(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day, 16))
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  }).format(date)
}

export function splitEvents(events: MapEvent[], todayIso: string) {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date))
  return {
    upcoming: sorted.filter((event) => event.date >= todayIso),
    earlier: sorted.filter((event) => event.date < todayIso),
  }
}

export const timelineDays: string[] = [...new Set(locations.map((l) => l.addedOn))].sort()
export const latestDay = timelineDays[timelineDays.length - 1]

export function addedOnDay(day: string): number {
  return locations.filter((l) => l.addedOn === day).length
}

export function asOf<T extends { addedOn: string }>(items: T[], day: string): T[] {
  return items.filter((item) => item.addedOn <= day)
}

export function formatShortDay(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, day, 12)),
  )
}
