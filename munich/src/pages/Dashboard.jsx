import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { logout } from '../utils/auth'
import { loadFNOLCases, generateFNOLStatistics, getMockFNOLCases } from '../utils/fnolData'
import StatsWidget from '../components/StatsWidget'
import USAMapWidget from '../components/USAMapWidget'
import FNOLTable from '../components/FNOLTable'
import ChatWidget from '../components/ChatWidget'
import EdgeTest from '../components/simulator/EdgeTest'
import logo from '../../assets/logo.png'
import './Dashboard.css'

function Dashboard() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [cases, setCases] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [cityData, setCityData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEdgeTest, setShowEdgeTest] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to load real cases
        const loadedCases = await loadFNOLCases()
        if (loadedCases.length > 0) {
          setCases(loadedCases)
        } else {
          // Fallback to mock data
          setCases(getMockFNOLCases())
        }
      } catch (error) {
        console.warn('Failed to load cases, using mock data:', error)
        setCases(getMockFNOLCases())
      }
      
      // Generate statistics
      const stats = generateFNOLStatistics(cases.length > 0 ? cases : getMockFNOLCases())
      setStatistics(stats)
      setCityData(stats.cityData)
      setLoading(false)
    }
    
    loadData()
  }, [])

  useEffect(() => {
    if (cases.length > 0) {
      const stats = generateFNOLStatistics(cases)
      setStatistics(stats)
      setCityData(stats.cityData)
    }
  }, [cases])

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (loading || !statistics) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <img src={logo} alt="Munich Re" className="header-logo" />
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
              <option value="de">DE</option>
            </select>
          </div>
          <button 
            className="logout-btn" 
            onClick={() => setShowEdgeTest(!showEdgeTest)}
            style={{ marginRight: '10px', background: '#D4AF37' }}
          >
            {showEdgeTest ? 'Hide Edge Test' : 'Show Edge Test'}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {showEdgeTest && (
        <div style={{ padding: '20px', background: '#0a0f1a', minHeight: '600px' }}>
          <h2 style={{ color: 'white', marginBottom: '20px' }}>Edge Test - Two Nodes, One Edge</h2>
          <EdgeTest />
        </div>
      )}
      
      <main className="dashboard-content">
        <div className="stats-grid">
          <StatsWidget
            title={t('dashboard.totalCases')}
            value={statistics.total}
            icon="📊"
            color="default"
          />
          <StatsWidget
            title={t('dashboard.acceptedCases')}
            value={statistics.accepted}
            icon="✅"
            color="accepted"
          />
          <StatsWidget
            title={t('dashboard.rejectedCases')}
            value={statistics.rejected}
            icon="❌"
            color="rejected"
          />
          <StatsWidget
            title={t('dashboard.pendingCases')}
            value={statistics.pending}
            icon="⏳"
            color="pending"
          />
        </div>

        <div className="dashboard-grid">
          <div className="map-widget-container">
            <USAMapWidget cityData={cityData} cases={cases} />
          </div>
          <div className="table-widget-container">
            <FNOLTable cases={cases} />
          </div>
        </div>
      </main>

      <ChatWidget cases={cases} statistics={statistics} cityData={cityData} />
    </div>
  )
}

export default Dashboard

