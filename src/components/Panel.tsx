import { useEffect, type CSSProperties } from 'react'
import type { BlimpStop, FilterId, Location } from '../data/model'
import {
  APP_VERSION,
  FILTERS,
  blimpSchedule,
  countFor,
  disclaimer,
  formatDay,
  formatUpdated,
  isScheduledHere,
  locationForVenue,
  splitEvents,
  updated,
} from '../data/model'
import {
  CATEGORY_COLOR,
  CATEGORY_EMOJI,
  CATEGORY_ICON,
  FILTER_EMOJI,
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  filterAccent,
} from '../map/icons'

interface PanelProps {
  filter: FilterId
  visible: Location[]
  selected: Location | null
  today: string
  next: BlimpStop | null
  expanded: boolean
  onFilter: (filter: FilterId) => void
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  onClose: () => void
  onToggleExpanded: () => void
}

export function Panel({
  filter,
  visible,
  selected,
  today,
  next,
  expanded,
  onFilter,
  onSelect,
  onHover,
  onClose,
  onToggleExpanded,
}: PanelProps) {
  return (
    <aside className={expanded ? 'panel is-expanded' : 'panel'} aria-label="Locations">
      <div className="panel-top">
        <button
          type="button"
          className="sheet-toggle"
          aria-expanded={expanded}
          onClick={onToggleExpanded}
        >
          <span className="grab" aria-hidden="true" />
          {expanded ? 'Hide list' : 'Blimp schedule & stops'}
        </button>
        <header className="mast">
          <p className="eyebrow">
            <span className="mark">Mark 2</span>
            Miami & South Florida
          </p>
          <h1>
            <span className="title-main">Vice City</span>
            <span className="title-sub">IRL — Miami map</span>
          </h1>
          <p className="dek">
            {visible.length} {visible.length === 1 ? 'stop' : 'stops'}
            <span aria-hidden="true"> · </span>
            Updated {formatUpdated(updated)}
          </p>
        </header>
        <div className="filters" role="group" aria-label="Filter locations">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="chip"
              aria-pressed={filter === item.id}
              style={{ '--chip': filterAccent(item.id) } as CSSProperties}
              onClick={() => onFilter(item.id)}
            >
              <span className="chip-ico" aria-hidden="true">{FILTER_EMOJI[item.id]}</span>
              {item.label}
              <span className="chip-n">{countFor(item.id)}</span>
            </button>
          ))}
        </div>
        {filter === 'beach' ? (
          <p className="filter-note">Beach includes the hotel parodies, including Hotel Y.</p>
        ) : null}
        {next ? (
          <p className="peek-next">
            <span className="next-pill">Next up</span>
            <span>
              {formatDay(next.date)} · {next.event}
            </span>
          </p>
        ) : (
          <p className="peek-next">No upcoming blimp dates on the list.</p>
        )}
      </div>

      <div className="panel-scroll">
        {selected ? (
          <Detail location={selected} today={today} next={next} onClose={onClose} />
        ) : null}
        <Schedule today={today} next={next} onSelect={onSelect} />
        <StopList
          locations={visible}
          selectedId={selected?.id ?? null}
          today={today}
          next={next}
          onSelect={onSelect}
          onHover={onHover}
        />
        <ul className="key" aria-label="Map legend">
          {CATEGORY_ORDER.map((category) => (
            <li key={category}>
              <i style={{ background: CATEGORY_COLOR[category] }} />
              <span className="key-ico" aria-hidden="true">{CATEGORY_EMOJI[category]}</span>
              {CATEGORY_LABEL[category]}
            </li>
          ))}
        </ul>
      </div>

      <footer className="colophon">
        <p className="disclaimer">
          Marketing and parody prototypes. Fan and press matches — no story spoilers.
        </p>
        <p className="fine">{disclaimer}</p>
        <p className="fine">
          v{APP_VERSION} · Dates use Miami time · Tiles © Esri
        </p>
      </footer>
    </aside>
  )
}

function Detail({
  location,
  today,
  next,
  onClose,
}: {
  location: Location
  today: string
  next: BlimpStop | null
  onClose: () => void
}) {
  const { upcoming, earlier } = splitEvents(location.events, today)
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`

  useEffect(() => {
    const node = document.getElementById('location-detail')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    node?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
  }, [location.id])

  return (
    <article
      id="location-detail"
      className="detail"
      style={{ '--cat': CATEGORY_COLOR[location.category] } as CSSProperties}
    >
      <div className="detail-top">
        <p className="kicker">
          <span
            className="detail-icon"
            dangerouslySetInnerHTML={{ __html: CATEGORY_ICON[location.category] }}
          />
          {CATEGORY_LABEL[location.category]}
        </p>
        <button type="button" className="text-btn" onClick={onClose}>
          Close
        </button>
      </div>
      <h2 id="detail-title" tabIndex={-1}>
        {location.name}
      </h2>
      {location.realName !== location.name ? (
        <p className="real-name">{location.realName}</p>
      ) : null}
      {location.parodyOf ? <p className="parody">{location.parodyOf}</p> : null}
      <p className="address">{location.address}</p>
      <h3>What’s here</h3>
      <ul className="facts">
        {location.whats_here.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <h3>Upcoming</h3>
      {upcoming.length === 0 ? (
        <p className="empty">
          {earlier.length === 0 ? 'No dated events listed.' : 'No upcoming dates.'}
        </p>
      ) : (
        <EventList events={upcoming} next={next} location={location} />
      )}
      {earlier.length > 0 ? (
        <>
          <h3>Earlier</h3>
          <EventList events={earlier} next={null} location={location} />
        </>
      ) : null}
      <a className="directions" href={mapsHref} target="_blank" rel="noreferrer">
        Open this pin in Google Maps
      </a>
    </article>
  )
}

function EventList({
  events,
  next,
  location,
}: {
  events: Location['events']
  next: BlimpStop | null
  location: Location
}) {
  return (
    <ul className="cal">
      {events.map((event) => {
        const isNext = next?.date === event.date && isScheduledHere(location, next)
        return (
          <li key={`${event.date}-${event.title}`}>
            <time dateTime={event.date}>{formatDay(event.date)}</time>
            <span>
              {event.title}
              {isNext ? <span className="next-pill slim">Next up</span> : null}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function Schedule({
  today,
  next,
  onSelect,
}: {
  today: string
  next: BlimpStop | null
  onSelect: (id: string) => void
}) {
  return (
    <section aria-labelledby="blimp-heading">
      <h2 id="blimp-heading" className="section-label">
        Blimp flyovers
      </h2>
      {next ? (
        <p className="next-lead">
          Next flyover <strong>{formatDay(next.date)}</strong> — {next.event} at {next.venue}.
        </p>
      ) : (
        <p className="next-lead">No upcoming flyovers after today in Miami.</p>
      )}
      <ol className="schedule">
        {blimpSchedule.map((stop) => {
          const venue = locationForVenue(stop.venue)
          const isNext = next?.date === stop.date && next.venue === stop.venue
          const isPast = stop.date < today
          const className = isNext ? 'flyover is-next' : isPast ? 'flyover is-past' : 'flyover'
          return (
            <li key={`${stop.date}-${stop.venue}`}>
              <button
                type="button"
                className={className}
                onClick={() => {
                  if (venue) onSelect(venue.id)
                }}
                disabled={!venue}
              >
                <time dateTime={stop.date}>{formatDay(stop.date)}</time>
                <span className="flyover-copy">
                  <span className="flyover-venue">
                    {stop.venue}
                    {isNext ? <span className="next-pill slim">Next up</span> : null}
                    {isPast ? <span className="past-tag">Flown</span> : null}
                  </span>
                  <span className="flyover-event">{stop.event}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function StopList({
  locations,
  selectedId,
  today,
  next,
  onSelect,
  onHover,
}: {
  locations: Location[]
  selectedId: string | null
  today: string
  next: BlimpStop | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}) {
  return (
    <section aria-labelledby="stops-heading">
      <h2 id="stops-heading" className="section-label">
        Stops
        <span className="section-count">{locations.length}</span>
      </h2>
      {locations.length === 0 ? (
        <p className="empty">No stops in this filter.</p>
      ) : (
        <ul className="stops">
          {locations.map((location) => {
            const soon = splitEvents(location.events, today).upcoming[0]
            const selected = location.id === selectedId
            const isNextVenue = isScheduledHere(location, next)
            const showReal = location.realName !== location.name
            return (
              <li key={location.id}>
                <button
                  type="button"
                  className={selected ? 'stop is-selected' : 'stop'}
                  aria-pressed={selected}
                  style={{ '--cat': CATEGORY_COLOR[location.category] } as CSSProperties}
                  onClick={() => onSelect(location.id)}
                  onMouseEnter={() => onHover(location.id)}
                  onMouseLeave={() => onHover(null)}
                  onFocus={() => onHover(location.id)}
                  onBlur={() => onHover(null)}
                >
                  <span className="swatch" aria-hidden="true" />
                  <span className="stop-copy">
                    <span className="stop-name">
                      {location.name}
                      {isNextVenue ? <span className="next-pill slim">Next blimp</span> : null}
                    </span>
                    <span className="stop-meta">
                      {showReal ? `${location.realName} · ` : ''}
                      {CATEGORY_LABEL[location.category]}
                    </span>
                    {location.parodyOf ? (
                      <span className="stop-parody">{location.parodyOf}</span>
                    ) : (
                      <span className="stop-meta">{location.address}</span>
                    )}
                    {soon ? (
                      <span className="stop-when">
                        {formatDay(soon.date)} · {soon.title}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
