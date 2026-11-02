import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapCanvas } from './components/MapCanvas'
import { Panel } from './components/Panel'
import { DaySlider } from './components/DaySlider'
import {
  locationForVenue,
  locations,
  matchesFilter,
  miamiTodayISO,
  nextFlyover,
  asOf,
  latestDay,
  type FilterId,
} from './data/model'

export function App() {
  const [filter, setFilter] = useState<FilterId>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [day, setDay] = useState(latestDay)
  const [fitTick, setFitTick] = useState(0)
  const today = useMemo(() => miamiTodayISO(), [])
  const next = useMemo(() => nextFlyover(today), [today])
  const visible = useMemo(
    () => asOf(locations, day).filter((location) => matchesFilter(filter, location.category)),
    [filter, day],
  )
  const selected = visible.find((location) => location.id === selectedId) ?? null
  const nextVenueId = next ? (locationForVenue(next.venue)?.id ?? null) : null

  const selectLocation = useCallback((id: string) => {
    const location = locations.find((item) => item.id === id)
    if (!location) return
    setFilter((current) =>
      current !== 'all' && !matchesFilter(current, location.category) ? 'all' : current,
    )
    setSelectedId(id)
    setExpanded(true)
  }, [])

  const chooseFilter = useCallback((nextFilter: FilterId) => {
    setFilter(nextFilter)
    setSelectedId((current) => {
      if (!current) return null
      const location = locations.find((item) => item.id === current)
      if (!location || !matchesFilter(nextFilter, location.category)) return null
      return current
    })
  }, [])

  const showAll = useCallback(() => {
    setFilter('all')
    setSelectedId(null)
    setHoverId(null)
    setExpanded(false)
    setFitTick((tick) => tick + 1)
  }, [])

  const clearSelection = useCallback(() => setSelectedId(null), [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const live = selected
    ? `${selected.name}. ${selected.realName}. ${selected.address}.`
    : `${visible.length} stops shown.`

  return (
    <div className="app">
      <p className="sr-only" aria-live="polite">
        {live}
      </p>
      <div className="map-shell">
        <MapCanvas
          visible={visible}
          selectedId={selectedId}
          hoverId={hoverId}
          nextVenueId={nextVenueId}
          fitTick={fitTick}
          sheetExpanded={expanded}
          onSelect={selectLocation}
          onClear={clearSelection}
        />
        <div className="vignette" aria-hidden="true" />
        <button type="button" className="map-fit" onClick={showAll}>
          All stops
        </button>
        <DaySlider day={day} onDay={setDay} shown={visible.length} />
      </div>
      <Panel
        filter={filter}
        visible={visible}
        selected={selected}
        today={today}
        next={next}
        expanded={expanded}
        onFilter={chooseFilter}
        onSelect={selectLocation}
        onHover={setHoverId}
        onClose={clearSelection}
        onToggleExpanded={() => setExpanded((open) => !open)}
      />
    </div>
  )
}
