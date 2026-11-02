import { divIcon } from 'leaflet'
import type { Category, FilterId } from '../data/model'

export const CATEGORY_LABEL: Record<Category, string> = {
  blimp: 'Blimp',
  arena: 'Arena',
  stadium: 'Stadium',
  ads: 'Ads',
  art: 'Art',
  beach: 'Beach',
  hotel: 'Hotel',
  event: 'Event',
  cars: 'Cars',
  club: 'Club',
  restaurant: 'Restaurant',
  landmark: 'Landmark',
  shop: 'Shop',
}

export const CATEGORY_COLOR: Record<Category, string> = {
  blimp: '#f5b400',
  arena: '#ff2f86',
  stadium: '#ff5a1f',
  ads: '#00a99a',
  art: '#7a3ff2',
  beach: '#0090e8',
  hotel: '#ff4f9a',
  event: '#5aa000',
  cars: '#2454ff',
  club: '#d10a5c',
  restaurant: '#ff7a18',
  landmark: '#5b2dff',
  shop: '#0d9b8a',
}

export const CATEGORY_ORDER: Category[] = [
  'club',
  'landmark',
  'shop',
  'restaurant',
  'hotel',
  'beach',
  'arena',
  'stadium',
  'art',
  'ads',
  'blimp',
  'event',
  'cars',
]

export function filterAccent(id: FilterId): string {
  switch (id) {
    case 'all':
      return '#f4efe8'
    case 'blimp':
      return CATEGORY_COLOR.blimp
    case 'ads':
      return CATEGORY_COLOR.ads
    case 'arenas':
      return CATEGORY_COLOR.arena
    case 'beach':
      return CATEGORY_COLOR.beach
    case 'events':
      return CATEGORY_COLOR.event
    case 'art':
      return CATEGORY_COLOR.art
    case 'cars':
      return CATEGORY_COLOR.cars
    case 'clubs':
      return CATEGORY_COLOR.club
    case 'landmarks':
      return CATEGORY_COLOR.landmark
    case 'shops':
      return CATEGORY_COLOR.shop
  }
}

export const CATEGORY_EMOJI: Record<Category, string> = {
  blimp: '🎈',
  arena: '🏀',
  stadium: '🏟️',
  ads: '🪧',
  art: '🎨',
  beach: '🏖️',
  hotel: '🏨',
  event: '🎟️',
  cars: '🚗',
  club: '🪩',
  restaurant: '🍽️',
  landmark: '📍',
  shop: '🛍️',
}

export const CATEGORY_ICON: Record<Category, string> = Object.fromEntries(
  Object.entries(CATEGORY_EMOJI).map(([k, v]) => [k, `<span class="vc-emoji" aria-hidden="true">${v}</span>`]),
) as Record<Category, string>

export const FILTER_EMOJI: Record<FilterId, string> = {
  all: '🗺️',
  blimp: '🎈',
  ads: '🪧',
  arenas: '🏟️',
  beach: '🏖️',
  clubs: '🪩',
  landmarks: '📍',
  shops: '🛍️',
  events: '🎟️',
  art: '🎨',
  cars: '🚗',
}

export function markerIcon(
  category: Category,
  flags: { selected: boolean; next: boolean; hot: boolean },
) {
  const classes = [
    'vc-pin',
    flags.selected ? 'is-selected' : '',
    flags.next ? 'is-next' : '',
    flags.hot ? 'is-hot' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return divIcon({
    className: 'vc-marker-wrap',
    html:
      `<div class="${classes}" style="--cat:${CATEGORY_COLOR[category]}">` +
      '<span class="vc-pin-pulse"></span>' +
      `<span class="vc-pin-head">${CATEGORY_ICON[category]}</span>` +
      '<span class="vc-pin-point"></span>' +
      '</div>',
    iconSize: [44, 52],
    iconAnchor: [22, 50],
    tooltipAnchor: [0, -46],
  })
}
