import { addedOnDay, asOf, formatShortDay, locations, timelineDays } from '../data/model'

export function DaySlider({ day, onDay, shown }: { day: string; onDay: (day: string) => void; shown: number }) {
  const index = Math.max(0, timelineDays.indexOf(day))
  const total = asOf(locations, day).length
  const added = addedOnDay(day)
  return (
    <div className="day-slider" role="group" aria-label="Timeline by day">
      <div className="day-slider-label" aria-live="polite">
        <strong>{formatShortDay(day)}</strong>
        <span>
          {shown === total ? total : `${shown}/${total}`}
          {added > 0 ? <em> +{added}</em> : null}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={Math.max(0, timelineDays.length - 1)}
        step={1}
        value={index}
        aria-label="Timeline by day"
        aria-valuetext={`${formatShortDay(day)}, ${total} stops${added > 0 ? `, ${added} new that day` : ''}`}
        disabled={timelineDays.length < 2}
        onChange={(event) => onDay(timelineDays[Number(event.target.value)])}
      />
    </div>
  )
}
