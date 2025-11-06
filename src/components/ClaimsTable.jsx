import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './ClaimsTable.css'

function ClaimsTable({ claims }) {
  const { t, i18n } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState('submittedDate')
  const [sortDirection, setSortDirection] = useState('desc')
  const [filterStatus, setFilterStatus] = useState('all')
  const [language, setLanguage] = useState(i18n.language)
  
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
    let filtered = claims.filter(claim => {
      const matchesSearch = 
        claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.city.toLowerCase().includes(searchTerm.toLowerCase())
      
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
      
      if (typeof aValue === 'string') {
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
                <td colSpan="7" className="no-results">
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
                  <tr key={`${claim.id}-${language}`}>
                    <td>{claim.claimNumber}</td>
                    <td>{claim.patientName}</td>
                    <td>{claim.memberId}</td>
                    <td>{claim.city}</td>
                    <td>
                      <span className={statusClass}>
                        {statusText}
                      </span>
                    </td>
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
    </div>
  )
}

export default ClaimsTable
