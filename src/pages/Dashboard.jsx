import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { logout } from '../utils/auth'
import { generateClaimsData, getClaimsStatistics, getCityWiseClaims } from '../utils/claimsData'
import { loadSimulatedData, getTimeSeriesData, getSimulatedCityData } from '../utils/loadSimulatedData'
import StatsWidget from '../components/StatsWidget'
import CityMapWidget from '../components/CityMapWidget'
import ClaimsTable from '../components/ClaimsTable'
import logo from '@assets/small_logo.png'
import './Dashboard.css'

function Dashboard() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [claims, setClaims] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [cityData, setCityData] = useState([])
  const [timeSeriesData, setTimeSeriesData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load claims data
    const claimsData = generateClaimsData()
    setClaims(claimsData)
    
    // Load simulated data for map and time series
    const simulated = loadSimulatedData()
    const simulatedCityData = getSimulatedCityData()
    const timeSeries = getTimeSeriesData()
    setCityData(simulatedCityData.length > 0 ? simulatedCityData : getCityWiseClaims(claimsData))
    setTimeSeriesData(timeSeries)
    
    // Get statistics with time series data for accurate current values
    setStatistics(getClaimsStatistics(claimsData, timeSeries))
    
    setLoading(false)
  }, [])

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <img src={logo} alt="SunLife" className="header-logo" />
          <h1 className="dashboard-title">{t('dashboard.title')}</h1>
        </div>
        <div className="header-right">
          <div className="language-selector">
            <select
              className="lang-select"
              value={i18n.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              <option value="en">EN</option>
              <option value="fr">FR</option>
            </select>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            {t('dashboard.logout')}
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="stats-grid">
          <StatsWidget
            title={t('dashboard.processedToday')}
            value={statistics.processedToday}
            icon="📊"
            dataKey="processed"
            timeSeriesData={timeSeriesData}
            timePeriod="day"
          />
          <StatsWidget
            title={t('dashboard.processedWeek')}
            value={statistics.processedWeek}
            icon="📈"
            dataKey="processed"
            timeSeriesData={timeSeriesData}
            timePeriod="week"
          />
          <StatsWidget
            title={t('dashboard.processedMonth')}
            value={statistics.processedMonth}
            icon="📅"
            dataKey="processed"
            timeSeriesData={timeSeriesData}
            timePeriod="month"
          />
          <StatsWidget
            title={t('dashboard.acceptedClaims')}
            value={statistics.accepted}
            icon="✅"
            color="accepted"
            dataKey="accepted"
            timeSeriesData={timeSeriesData}
            timePeriod="day"
          />
          <StatsWidget
            title={t('dashboard.pendingClaims')}
            value={statistics.pending}
            icon="⏳"
            color="pending"
            dataKey="pending"
            timeSeriesData={timeSeriesData}
            timePeriod="day"
          />
          <StatsWidget
            title={t('dashboard.deniedClaims')}
            value={statistics.denied}
            icon="❌"
            color="denied"
            dataKey="denied"
            timeSeriesData={timeSeriesData}
            timePeriod="day"
          />
        </div>

        <div className="widgets-grid">
          <div className="widget-full">
            <CityMapWidget cityData={cityData} claims={claims} />
          </div>
        </div>

        <div className="table-section">
          <ClaimsTable claims={claims} />
        </div>
      </main>
    </div>
  )
}

export default Dashboard
