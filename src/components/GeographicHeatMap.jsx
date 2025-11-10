import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './GeographicHeatMap.css'

const MAP_CENTER = [56.1304, -106.3468]
const BASEMAP_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const BASEMAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

const CANADA_CITIES = {
  Vancouver: { coordinates: [-123.1207, 49.2827] },
  Victoria: { coordinates: [-123.3656, 48.4284] },
  Calgary: { coordinates: [-114.0719, 51.0447] },
  Edmonton: { coordinates: [-113.4938, 53.5461] },
  Saskatoon: { coordinates: [-106.6700, 52.1332] },
  Regina: { coordinates: [-104.6189, 50.4452] },
  Winnipeg: { coordinates: [-97.1384, 49.8951] },
  Toronto: { coordinates: [-79.3832, 43.6532] },
  Hamilton: { coordinates: [-79.8711, 43.2557] },
  Kitchener: { coordinates: [-80.4925, 43.4516] },
  Ottawa: { coordinates: [-75.6972, 45.4215] },
  Montreal: { coordinates: [-73.5673, 45.5017] },
  'Quebec City': { coordinates: [-71.2080, 46.8139] },
  Halifax: { coordinates: [-63.5752, 44.6488] },
  Fredericton: { coordinates: [-66.6431, 45.9636] },
  Charlottetown: { coordinates: [-63.1311, 46.2382] },
  "St. John's": { coordinates: [-52.7126, 47.5615] }
}

const VIEW_COLORS = {
  total: '#0E7CFF',
  accepted: '#28a745',
  pending: '#ECAB23',
  denied: '#dc3545'
}

function GeographicHeatMap({ cityData = [], selectedView = 'total', selectedCity = null, onCitySelect }) {
  const { t } = useTranslation()

  const cityDataMap = useMemo(() => {
    const map = {}
    cityData.forEach((entry) => {
      map[entry.city] = entry
    })
    return map
  }, [cityData])

  const getCityStats = (cityName) => {
    return cityDataMap[cityName] || { total: 0, accepted: 0, pending: 0, denied: 0 }
  }

  const maxValue = useMemo(() => {
    if (cityData.length === 0) return 1
    return Math.max(
      ...cityData.map((city) => {
        if (selectedView === 'total') return city.total || 0
        return city[selectedView] || 0
      }),
      1
    )
  }, [cityData, selectedView])

  const getRadius = (value) => {
    const minRadius = 8
    const maxRadius = 36
    if (value <= 0) return minRadius
    const ratio = Math.sqrt(value / maxValue) // smooth scaling
    return minRadius + ratio * (maxRadius - minRadius)
  }

  const getFillColor = (cityStats) => {
    const baseColor = VIEW_COLORS[selectedView] || VIEW_COLORS.total
    if (selectedView !== 'total') return baseColor

    const { total = 0, accepted = 0 } = cityStats
    if (total === 0) return baseColor

    const performance = accepted / total
    const opacity = 0.35 + Math.min(performance, 1) * 0.4
    return `${baseColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`
  }

  return (
    <div className="geographic-heatmap-container">
      <div className="map-wrapper">
        <MapContainer
          center={MAP_CENTER}
          zoom={3.6}
          minZoom={3}
          maxZoom={8}
          scrollWheelZoom={false}
          className="claims-map"
        >
          <TileLayer url={BASEMAP_URL} attribution={BASEMAP_ATTRIBUTION} />
          {Object.entries(CANADA_CITIES).map(([cityName, cityInfo]) => {
            const stats = getCityStats(cityName)
            const value = selectedView === 'total' ? stats.total || 0 : stats[selectedView] || 0
            const radius = getRadius(value)
            const fillColor = getFillColor(stats)
            const strokeColor = selectedCity === cityName ? '#ECAB23' : '#ffffff'

            return (
              <CircleMarker
                key={cityName}
                center={[cityInfo.coordinates[1], cityInfo.coordinates[0]]}
                radius={radius}
                pathOptions={{
                  color: strokeColor,
                  weight: selectedCity === cityName ? 3 : 1.5,
                  fillColor: fillColor,
                  fillOpacity: selectedView === 'total' ? 0.7 : 0.55 + Math.min(value / maxValue, 1) * 0.35
                }}
                eventHandlers={{
                  click: () => onCitySelect && onCitySelect(cityName),
                  mouseover: (event) => event.target.setStyle({ weight: selectedCity === cityName ? 3.5 : 2 }),
                  mouseout: (event) => event.target.setStyle({ weight: selectedCity === cityName ? 3 : 1.5 })
                }}
              >
                <LeafletTooltip direction="top" offset={[0, -6]} opacity={1} className="city-tooltip-card">
                  <div className="tooltip-content">
                    <div className="tooltip-heading">
                      <strong>{cityName}</strong>
                      <span className="tooltip-total">
                        {t('dashboard.total')}: <span>{stats.total || 0}</span>
                      </span>
                    </div>
                    <div className="tooltip-metrics">
                      <div>
                        <span className="dot accepted"></span>
                        {t('dashboard.accepted')}: {stats.accepted || 0}
                      </div>
                      <div>
                        <span className="dot pending"></span>
                        {t('dashboard.pending')}: {stats.pending || 0}
                      </div>
                      <div>
                        <span className="dot denied"></span>
                        {t('dashboard.denied')}: {stats.denied || 0}
                      </div>
                    </div>
                  </div>
                </LeafletTooltip>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>

      <div className="heatmap-legend">
        <div className="legend-title">{t('dashboard.heatmapLegend')}</div>
        <div className="legend-explanation">
          <p>
            {selectedView === 'total'
              ? t('dashboard.heatmapExplanation')
              : t('dashboard.heatmapExplanation')}
          </p>
        </div>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: VIEW_COLORS[selectedView] }}></span>
            <span>
              {selectedView === 'total'
                ? t('dashboard.total')
                : t(`dashboard.${selectedView}`)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GeographicHeatMap
