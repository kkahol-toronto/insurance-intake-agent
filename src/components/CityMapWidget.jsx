import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import GeographicHeatMap from './GeographicHeatMap'
import './CityMapWidget.css'

function CityMapWidget({ cityData, claims }) {
  const { t } = useTranslation()
  const [selectedView, setSelectedView] = useState('total') // total, accepted, pending, denied
  const [selectedCity, setSelectedCity] = useState(null)

  const handleCityClick = (cityName) => {
    setSelectedCity(selectedCity === cityName ? null : cityName)
  }

  return (
    <div className="city-map-widget">
      <div className="widget-header">
        <div className="header-title-section">
          <h2>{t('dashboard.geographicalDistribution')}</h2>
          <p className="data-period-note">{t('dashboard.lastMonthData')}</p>
        </div>
        <div className="view-selector">
          <button
            className={selectedView === 'total' ? 'active' : ''}
            onClick={() => setSelectedView('total')}
          >
            {t('dashboard.total')}
          </button>
          <button
            className={selectedView === 'accepted' ? 'active' : ''}
            onClick={() => setSelectedView('accepted')}
          >
            {t('dashboard.accepted')}
          </button>
          <button
            className={selectedView === 'pending' ? 'active' : ''}
            onClick={() => setSelectedView('pending')}
          >
            {t('dashboard.pending')}
          </button>
          <button
            className={selectedView === 'denied' ? 'active' : ''}
            onClick={() => setSelectedView('denied')}
          >
            {t('dashboard.denied')}
          </button>
        </div>
      </div>
      
      <div className="map-container">
        <GeographicHeatMap 
          cityData={cityData} 
          selectedView={selectedView}
          selectedCity={selectedCity}
          onCitySelect={handleCityClick}
        />
      </div>

      {selectedCity && (
        <div className="city-details">
          {(() => {
            const city = cityData.find(c => c.city === selectedCity)
            if (!city) return null
            return (
              <div className="city-detail-card">
                <h3>{selectedCity}</h3>
                <div className="city-detail-stats">
                  <div className="detail-stat">
                    <span className="detail-label">{t('dashboard.total')}:</span>
                    <span className="detail-value">{city.total}</span>
                  </div>
                  <div className="detail-stat">
                    <span className="detail-label">{t('dashboard.accepted')}:</span>
                    <span className="detail-value accepted">{city.accepted}</span>
                  </div>
                  <div className="detail-stat">
                    <span className="detail-label">{t('dashboard.pending')}:</span>
                    <span className="detail-value pending">{city.pending}</span>
                  </div>
                  <div className="detail-stat">
                    <span className="detail-label">{t('dashboard.denied')}:</span>
                    <span className="detail-value denied">{city.denied}</span>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

export default CityMapWidget
