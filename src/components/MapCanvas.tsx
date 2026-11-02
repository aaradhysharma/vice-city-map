import { useEffect, useMemo, useState } from 'react'
import { latLngBounds, point, type Map as LeafletMap } from 'leaflet'
import { MapContainer, Marker, TileLayer, Tooltip, ZoomControl, useMap } from 'react-leaflet'
import type { Location } from '../data/model'
import { CATEGORY_LABEL } from '../map/icons'
import { markerIcon } from '../map/icons'

interface MapCanvasProps {
  visible: Location[]
  selectedId: string | null
  hoverId: string | null
  nextVenueId: string | null
  fitTick: number
  sheetExpanded: boolean
  onSelect: (id: string) => void
  onClear: () => void
}

function mapPadding() {
  const panel = document.querySelector('.panel')
  const rect = panel?.getBoundingClientRect()
  if (window.innerWidth < 860) {
    const covered = rect ? Math.min(rect.height + 18, window.innerHeight * 0.72) : 230
    return { left: 18, top: 16, right: 18, bottom: covered }
  }
  const left = rect ? Math.round(rect.right + 24) : 448
  return { left, top: 24, right: 24, bottom: 24 }
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function flyToVisible(map: LeafletMap, lat: number, lng: number, zoom: number) {
  map.invalidateSize()
  const projected = map.project([lat, lng], zoom)
  const size = map.getSize()
  const pad = mapPadding()
  const viewW = Math.max(80, size.x - pad.left - pad.right)
  const viewH = Math.max(80, size.y - pad.top - pad.bottom)
  const viewCx = pad.left + viewW / 2
  const viewCy = pad.top + viewH / 2
  const centerPoint = projected.add(point(size.x / 2 - viewCx, size.y / 2 - viewCy))
  const center = map.unproject(centerPoint, zoom)
  map.flyTo(center, zoom, { duration: reducedMotion() ? 0 : 0.7 })
}

function fitAll(map: LeafletMap, spots: Location[]) {
  if (spots.length === 0) return
  if (spots.length === 1) {
    flyToVisible(map, spots[0].lat, spots[0].lng, 14)
    return
  }
  map.invalidateSize()
  const bounds = latLngBounds(spots.map((spot) => [spot.lat, spot.lng]))
  const pad = mapPadding()
  map.fitBounds(bounds, {
    paddingTopLeft: [pad.left, pad.top],
    paddingBottomRight: [pad.right, pad.bottom],
    maxZoom: 14,
    animate: !reducedMotion(),
  })
}

function MapController({
  visible,
  selected,
  fitTick,
  sheetExpanded,
}: {
  visible: Location[]
  selected: Location | null
  fitTick: number
  sheetExpanded: boolean
}) {
  const map = useMap()

  useEffect(() => {
    const onResize = () => map.invalidateSize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [map])

  useEffect(() => {
    if (!selected) return
    flyToVisible(map, selected.lat, selected.lng, 15)
  }, [map, selected, sheetExpanded])

  useEffect(() => {
    if (selected) return
    fitAll(map, visible)
  }, [map, visible, selected, fitTick, sheetExpanded])

  return null
}

function MapClick({ onClear }: { onClear: () => void }) {
  const map = useMap()
  useEffect(() => {
    map.on('click', onClear)
    return () => {
      map.off('click', onClear)
    }
  }, [map, onClear])
  return null
}

function PlaceMarker({
  location,
  selected,
  hot,
  isNext,
  coarse,
  onSelect,
}: {
  location: Location
  selected: boolean
  hot: boolean
  isNext: boolean
  coarse: boolean
  onSelect: (id: string) => void
}) {
  const icon = useMemo(
    () => markerIcon(location.category, { selected, next: isNext, hot }),
    [location.category, selected, isNext, hot],
  )
  const handlers = useMemo(
    () => ({
      click(event: { originalEvent?: Event }) {
        event.originalEvent?.stopPropagation()
        onSelect(location.id)
      },
    }),
    [location.id, onSelect],
  )

  return (
    <Marker
      position={[location.lat, location.lng]}
      icon={icon}
      zIndexOffset={selected ? 1200 : hot ? 800 : isNext ? 500 : 0}
      riseOnHover
      bubblingMouseEvents={false}
      keyboard
      alt={`${location.name}, ${CATEGORY_LABEL[location.category]}`}
      eventHandlers={handlers}
    >
      {coarse ? null : (
        <Tooltip className="vc-tip" direction="top" offset={[0, -44]} opacity={1}>
          {location.realName !== location.name
            ? `${location.name} · ${location.realName}`
            : location.name}
        </Tooltip>
      )}
    </Marker>
  )
}

export function MapCanvas({
  visible,
  selectedId,
  hoverId,
  nextVenueId,
  fitTick,
  sheetExpanded,
  onSelect,
  onClear,
}: MapCanvasProps) {
  const [tilesReady, setTilesReady] = useState(false)
  const [tileSlow, setTileSlow] = useState(false)
  const [coarse, setCoarse] = useState(false)
  const selected = visible.find((location) => location.id === selectedId) ?? null

  useEffect(() => {
    const media = window.matchMedia('(pointer: coarse)')
    const apply = () => setCoarse(media.matches)
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    if (tilesReady) return
    const timer = window.setTimeout(() => setTileSlow(true), 8000)
    return () => window.clearTimeout(timer)
  }, [tilesReady])

  return (
    <>
      <MapContainer
        className="map"
        center={[25.9, -80.22]}
        zoom={10}
        minZoom={8}
        maxZoom={18}
        zoomControl={false}
        maxBounds={[
          [24.4, -82.2],
          [27.6, -79.2],
        ]}
        maxBoundsViscosity={0.65}
        scrollWheelZoom
      >
        <ZoomControl position="topright" />
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          maxNativeZoom={19}
          eventHandlers={{ load: () => setTilesReady(true) }}
        />
        <MapController
          visible={visible}
          selected={selected}
          fitTick={fitTick}
          sheetExpanded={sheetExpanded}
        />
        <MapClick onClear={onClear} />
        {visible.map((location) => (
          <PlaceMarker
            key={location.id}
            location={location}
            selected={location.id === selectedId}
            hot={location.id === hoverId}
            isNext={location.id === nextVenueId}
            coarse={coarse}
            onSelect={onSelect}
          />
        ))}
      </MapContainer>
      {tilesReady ? null : (
        <p className="tile-status">
          {tileSlow
            ? 'Map tiles are slow. The stop list still works.'
            : 'Loading map tiles…'}
        </p>
      )}
    </>
  )
}
