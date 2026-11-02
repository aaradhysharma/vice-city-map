import { readFileSync } from 'node:fs'

const data = JSON.parse(
  readFileSync(new URL('../src/data/locations.json', import.meta.url), 'utf8'),
)
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const model = readFileSync(new URL('../src/data/model.ts', import.meta.url), 'utf8')
const panel = readFileSync(new URL('../src/components/Panel.tsx', import.meta.url), 'utf8')

let failed = false
const fail = (message) => {
  console.error(message)
  failed = true
}

const locations = data.locations
console.log(`locations: ${locations?.length ?? 0}`)
console.log(`blimp_schedule: ${data.blimp_schedule?.length ?? 0}`)
console.log(`version: ${pkg.version}`)

if (!Array.isArray(locations)) fail('locations missing')
if (locations.length !== 43) fail(`expected 43 locations, found ${locations.length}`)
if (!Array.isArray(data.blimp_schedule) || data.blimp_schedule.length !== 5) {
  fail('expected 5 blimp dates')
}
if (pkg.version !== '2.5.4') fail(`expected version 2.5.4, found ${pkg.version}`)
if (!model.includes("export const APP_VERSION = '2.5.4'")) fail('APP_VERSION drift')
if (!panel.includes('Mark 2')) fail('Mark 2 label missing')
if (!panel.includes('Marketing and parody prototypes. Fan and press matches — no story spoilers.')) {
  fail('footer disclaimer missing')
}

const ids = new Set()
const counts = {}
for (const loc of locations) {
  for (const key of ['id', 'name', 'realName', 'category', 'lat', 'lng', 'address', 'whats_here', 'events']) {
    if (loc[key] === undefined || loc[key] === null || loc[key] === '') {
      fail(`${loc.id ?? '?'} missing ${key}`)
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(loc.addedOn ?? '')) fail(`${loc.id} bad addedOn`)
  if (!('parodyOf' in loc)) fail(`${loc.id} missing parodyOf`)
  if (loc.parodyOf !== null && typeof loc.parodyOf !== 'string') fail(`${loc.id} bad parodyOf`)
  if (ids.has(loc.id)) fail(`duplicate id ${loc.id}`)
  ids.add(loc.id)
  if (typeof loc.lat !== 'number' || typeof loc.lng !== 'number') fail(`bad coords ${loc.id}`)
  if (loc.lat < 24 || loc.lat > 28 || loc.lng > -79 || loc.lng < -82) {
    fail(`coord out of South Florida range: ${loc.id}`)
  }
  counts[loc.category] = (counts[loc.category] || 0) + 1
  if (!Array.isArray(loc.whats_here) || loc.whats_here.length === 0) {
    fail(`whats_here empty: ${loc.id}`)
  }
  for (const event of loc.events) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date) || !event.title) fail(`bad event on ${loc.id}`)
  }
}

const nine = locations.find((loc) => loc.id === 'nine1nine')
if (!nine || nine.name !== 'NINE1NINE' || nine.realName !== 'E11EVEN') {
  fail('NINE1NINE parody mapping missing')
}
if (!nine?.parodyOf?.includes('E11EVEN') || !nine.parodyOf.includes('NINE1NINE')) {
  fail('NINE1NINE parodyOf line missing')
}

const expected = {
  arena: 1,
  stadium: 3,
  art: 3,
  ads: 4,
  beach: 3,
  hotel: 4,
  event: 1,
  blimp: 1,
  cars: 1,
  club: 3,
  restaurant: 7,
  landmark: 7,
  shop: 5,
}
for (const [category, count] of Object.entries(expected)) {
  if (counts[category] !== count) {
    fail(`category ${category}: expected ${count}, found ${counts[category] ?? 0}`)
  }
}
if (Object.keys(counts).length !== Object.keys(expected).length) {
  fail(`unexpected categories: ${Object.keys(counts).join(', ')}`)
}

function venueMatches(loc, venue) {
  const needle = venue.trim().toLowerCase()
  return [loc.name, loc.realName, `${loc.realName} / ${loc.name}`, `${loc.name} / ${loc.realName}`]
    .some((candidate) => candidate.toLowerCase() === needle)
}

for (const row of data.blimp_schedule) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date) || !row.venue || !row.event) {
    fail(`bad schedule row ${JSON.stringify(row)}`)
  }
  const venue = locations.find((loc) => venueMatches(loc, row.venue))
  if (!venue) fail(`schedule venue is not a location: ${row.venue}`)
  else if (!venue.events.some((event) => event.date === row.date)) {
    fail(`schedule date missing from ${row.venue} events: ${row.date}`)
  }
}

const today = '2026-10-29'
const next = [...data.blimp_schedule]
  .sort((a, b) => a.date.localeCompare(b.date))
  .find((stop) => stop.date >= today)
if (!next || next.date !== '2026-11-01' || next.venue !== 'Hard Rock Stadium') {
  fail(`next flyover from ${today} should be 2026-11-01 Hard Rock Stadium`)
}

if (failed) {
  console.error('FAILED')
  process.exit(1)
}
console.log('OK — 43 locations, next blimp 2026-11-01 Hard Rock Stadium')
