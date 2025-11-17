import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './USAMapWidget.css'

// USA cities coordinates
const USA_CITIES = {
  'New York': { coordinates: [-74.006, 40.7128], state: 'NY' },
  'Miami': { coordinates: [-80.1918, 25.7617], state: 'FL' },
  'Seattle': { coordinates: [-122.3321, 47.6062], state: 'WA' },
  'Los Angeles': { coordinates: [-118.2437, 34.0522], state: 'CA' },
  'Dallas': { coordinates: [-96.7970, 32.7767], state: 'TX' },
  'Austin': { coordinates: [-97.7431, 30.2672], state: 'TX' },
  'San Francisco': { coordinates: [-122.4194, 37.7749], state: 'CA' }
}

function USAMapWidget({ cityData = [], cases = [] }) {
  const { t } = useTranslation()
  const [selectedView, setSelectedView] = useState('total')

  const getCityStats = (cityName) => {
    const city = cityData.find(c => c.city === cityName)
    return city || { total: 0, accepted: 0, rejected: 0, pending: 0 }
  }

  const getRadius = (value) => {
    const maxValue = Math.max(...cityData.map(c => c.total || 0), 1)
    const minSize = 8
    const maxSize = 40
    if (maxValue === 0) return minSize
    return minSize + ((value / maxValue) * (maxSize - minSize))
  }

  const getFillColor = (stats) => {
    const { accepted = 0, rejected = 0, pending = 0, total = 0 } = stats
    if (total === 0) return '#e0e0e0'
    
    if (selectedView === 'accepted') {
      return '#28a745'
    } else if (selectedView === 'rejected') {
      return '#dc3545'
    } else if (selectedView === 'pending') {
      return '#FFB347'
    }
    return '#003366'
  }

  return (
    <div className="usa-map-widget">
      <div className="widget-header">
        <h2>{t('dashboard.geographicalDistribution')}</h2>
        <div className="view-selector">
          <button
            className={selectedView === 'total' ? 'active' : ''}
            onClick={() => setSelectedView('total')}
          >
            Total
          </button>
          <button
            className={selectedView === 'accepted' ? 'active' : ''}
            onClick={() => setSelectedView('accepted')}
          >
            Accepted
          </button>
          <button
            className={selectedView === 'rejected' ? 'active' : ''}
            onClick={() => setSelectedView('rejected')}
          >
            Rejected
          </button>
          <button
            className={selectedView === 'pending' ? 'active' : ''}
            onClick={() => setSelectedView('pending')}
          >
            Pending
          </button>
        </div>
      </div>
      
      <div className="map-container">
        <MapContainer
          center={[39.8283, -98.5795]}
          zoom={4}
          minZoom={3}
          maxZoom={8}
          scrollWheelZoom={false}
          className="usa-map"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {Object.entries(USA_CITIES).map(([cityName, cityInfo]) => {
            const stats = getCityStats(cityName)
            const value = selectedView === 'total' ? stats.total || 0 : stats[selectedView] || 0
            const radius = getRadius(value)
            const fillColor = getFillColor(stats)

            if (value === 0) return null

            return (
              <CircleMarker
                key={cityName}
                center={[cityInfo.coordinates[1], cityInfo.coordinates[0]]}
                radius={radius}
                pathOptions={{
                  color: '#ffffff',
                  weight: 2,
                  fillColor,
                  fillOpacity: 0.7
                }}
              >
                <Popup>
                  <div className="city-popup">
                    <strong>{cityName}</strong>
                    <div>Total: {stats.total || 0}</div>
                    <div>Accepted: {stats.accepted || 0}</div>
                    <div>Rejected: {stats.rejected || 0}</div>
                    <div>Pending: {stats.pending || 0}</div>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}

export default USAMapWidget

