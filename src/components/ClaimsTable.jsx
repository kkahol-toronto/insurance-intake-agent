import { useState, useMemo, useEffect, Component, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import './ClaimsTable.css'

// Lazy load simulator to prevent blocking app load
const ClaimsSimulator = lazy(() => import('./simulator/ClaimsSimulator'))

// Error Boundary for simulator
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Simulator Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '40px', 
          color: '#E6EAF2', 
          textAlign: 'center',
          background: '#151A21',
          borderRadius: '8px',
          margin: '20px',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h3 style={{ color: '#dc3545', marginBottom: '16px' }}>Error loading simulator</h3>
          <p style={{ marginBottom: '16px', wordBreak: 'break-word', maxWidth: '600px' }}>
            {this.state.error?.message || 'Unknown error'}
          </p>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>
            {this.state.error?.stack?.split('\n')[0] || ''}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
            }}
            style={{
              padding: '10px 20px',
              background: '#ECAB23',
              color: '#0B0F14',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              marginRight: '10px'
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => {
              window.location.reload()
            }}
            style={{
              padding: '10px 20px',
              background: '#003946',
              color: '#E6EAF2',
              border: '1px solid #ECAB23',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

function ClaimsTable({ claims }) {
  const { t, i18n } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState('submittedDate')
  const [sortDirection, setSortDirection] = useState('desc')
  const [filterStatus, setFilterStatus] = useState('all')
  const [language, setLanguage] = useState(i18n.language)
  const [selectedClaim, setSelectedClaim] = useState(null)
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedClaim) {
      document.body.classList.add('modal-open')
      return () => {
        document.body.classList.remove('modal-open')
      }
    }
  }, [selectedClaim])
  
  // Listen to language changes to force re-render
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setLanguage(lng)
    }
    // Subscribe to language changes
    i18n.on('languageChanged', handleLanguageChange)
    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [i18n])

  const filteredAndSortedClaims = useMemo(() => {
    const search = searchTerm.toLowerCase()

    let filtered = claims.filter(claim => {
      const integrationKey = claim.integrationType || 'Pega'
      const integrationLabel = t(`dashboard.integrationLabels.${integrationKey}`, integrationKey).toLowerCase()
      const matchesSearch = 
        claim.claimNumber.toLowerCase().includes(search) ||
        claim.patientName.toLowerCase().includes(search) ||
        claim.memberId.toLowerCase().includes(search) ||
        claim.city.toLowerCase().includes(search) ||
        integrationKey.toLowerCase().includes(search) ||
        integrationLabel.includes(search)
      
      const matchesStatus = filterStatus === 'all' || claim.status === filterStatus
      
      return matchesSearch && matchesStatus
    })

    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]
      
      if (sortField === 'submittedDate' || sortField === 'processedDate') {
        aValue = new Date(aValue || 0)
        bValue = new Date(bValue || 0)
      }
      
      if (sortField === 'integrationType') {
        aValue = (a.integrationType || 'Pega').toLowerCase()
        bValue = (b.integrationType || 'Pega').toLowerCase()
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [claims, searchTerm, sortField, sortDirection, filterStatus, language])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Function to get status badge - ensure it uses current language
  const getStatusBadge = (status) => {
    const statusClass = `status-badge status-${status}`
    // Get translation with explicit language dependency
    const statusKey = `dashboard.status.${status}`
    const statusText = t(statusKey)
    return (
      <span className={statusClass}>
        {statusText}
      </span>
    )
  }

  const renderIntegrationBadge = (integrationType) => {
    const key = integrationType || 'Pega'
    const label = t(`dashboard.integrationLabels.${key}`, key)
    const badgeClass = `integration-badge integration-${key.toLowerCase()}`
    return (
      <span className={badgeClass}>
        {label}
      </span>
    )
  }

  return (
    <div className="claims-table-widget">
      <div className="table-header">
        <h2>{t('dashboard.claimsList')}</h2>
        <div className="table-controls">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="all">{t('dashboard.allStatuses')}</option>
            <option value="accepted">{t('dashboard.status.accepted')}</option>
            <option value="pending">{t('dashboard.status.pending')}</option>
            <option value="denied">{t('dashboard.status.denied')}</option>
          </select>
          <input
            type="text"
            placeholder={t('dashboard.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      
      <div className="table-container">
        <table className="claims-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('claimNumber')}>
                {t('dashboard.claimNumber')}
                {sortField === 'claimNumber' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th onClick={() => handleSort('patientName')}>
                {t('dashboard.patientName')}
                {sortField === 'patientName' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th onClick={() => handleSort('memberId')}>
                {t('dashboard.memberId')}
                {sortField === 'memberId' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th onClick={() => handleSort('city')}>
                {t('dashboard.city')}
                {sortField === 'city' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th onClick={() => handleSort('status')}>
                {t('dashboard.status')}
                {sortField === 'status' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th onClick={() => handleSort('integrationType')}>
                {t('dashboard.agentColumn')}
                {sortField === 'integrationType' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th onClick={() => handleSort('amount')}>
                {t('dashboard.amount')}
                {sortField === 'amount' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th onClick={() => handleSort('submittedDate')}>
                {t('dashboard.submittedDate')}
                {sortField === 'submittedDate' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedClaims.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-results">
                  {t('dashboard.noResults')}
                </td>
              </tr>
            ) : (
              filteredAndSortedClaims.map((claim) => {
                // Inline status badge to ensure it updates with language changes
                const statusClass = `status-badge status-${claim.status}`
                // Get translation - use direct resource bundle lookup as fallback
                const statusKey = `dashboard.status.${claim.status}`
                let statusText = t(statusKey)
                
                // If translation returns the key itself, use direct lookup
                if (statusText === statusKey || statusText.includes('DASHBOARD.STATUS') || statusText.includes('dashboard.status')) {
                  // Direct access to translations as fallback
                  try {
                    const translations = i18n.getResourceBundle(i18n.language, 'translation')
                    statusText = translations?.dashboard?.status?.[claim.status] || 
                                  (i18n.language === 'fr' 
                                    ? (claim.status === 'accepted' ? 'Accepté' : claim.status === 'pending' ? 'En Attente' : claim.status === 'denied' ? 'Refusé' : claim.status)
                                    : (claim.status === 'accepted' ? 'Accepted' : claim.status === 'pending' ? 'Pending' : claim.status === 'denied' ? 'Denied' : claim.status))
                  } catch (e) {
                    // Final fallback to hardcoded translations
                    statusText = i18n.language === 'fr' 
                      ? (claim.status === 'accepted' ? 'Accepté' : claim.status === 'pending' ? 'En Attente' : claim.status === 'denied' ? 'Refusé' : claim.status)
                      : (claim.status === 'accepted' ? 'Accepted' : claim.status === 'pending' ? 'Pending' : claim.status === 'denied' ? 'Denied' : claim.status)
                  }
                }
                
                return (
                  <tr 
                    key={`${claim.id}-${language}`}
                    onClick={() => {
                      console.log('Claim clicked:', claim);
                      setSelectedClaim(claim);
                    }}
                    className="claim-row-clickable"
                  >
                    <td>{claim.claimNumber}</td>
                    <td>{claim.patientName}</td>
                    <td>{claim.memberId}</td>
                    <td>{claim.city}</td>
                    <td>
                      <span className={statusClass}>
                        {statusText}
                      </span>
                    </td>
                    <td>{renderIntegrationBadge(claim.integrationType)}</td>
                    <td>${claim.amount.toLocaleString()} {claim.currency}</td>
                    <td>{new Date(claim.submittedDate).toLocaleDateString()}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      
      <div className="table-footer">
        <span>
          {t('dashboard.showing')
            .replace('{{count}}', filteredAndSortedClaims.length)
            .replace('{{total}}', claims.length)}
        </span>
      </div>

      {/* Simulator Modal */}
      {selectedClaim && (
        <div 
          className="simulator-modal" 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              console.log('Modal backdrop clicked');
              setSelectedClaim(null);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setSelectedClaim(null);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="simulator-title"
        >
          <div 
            className="simulator-modal-content" 
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="simulator-modal-header">
              <h2 id="simulator-title">Claims Process Agent</h2>
              <p>Claim: {selectedClaim.claimNumber} - {selectedClaim.patientName}</p>
              <button 
                className="simulator-close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Close button clicked');
                  setSelectedClaim(null);
                }}
                aria-label="Close simulator"
                type="button"
              >
                ✕
              </button>
            </div>
            <div className="simulator-modal-body">
              <ErrorBoundary>
                {selectedClaim && (
                  <Suspense fallback={
                    <div style={{ 
                      padding: '40px', 
                      color: '#E6EAF2', 
                      textAlign: 'center',
                      background: '#151A21',
                      borderRadius: '8px',
                      margin: '20px'
                    }}>
                      <p>Loading simulator for claim: {selectedClaim.claimNumber}...</p>
                    </div>
                  }>
                    <ClaimsSimulator key={selectedClaim.id} claim={selectedClaim} />
                  </Suspense>
                )}
              </ErrorBoundary>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClaimsTable
