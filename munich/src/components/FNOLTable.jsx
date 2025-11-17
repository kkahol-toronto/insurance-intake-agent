import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import FNOLSimulator from './simulator/FNOLSimulator'
import './FNOLTable.css'

function FNOLTable({ cases = [] }) {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState('dateOfLoss')
  const [sortDirection, setSortDirection] = useState('desc')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedCase, setSelectedCase] = useState(null)

  const filteredAndSortedCases = useMemo(() => {
    let filtered = cases.filter(caseItem => {
      const matchesSearch = 
        caseItem.claimId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.reportedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.insuredName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.city?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || caseItem.finalOutcome === filterStatus
      
      return matchesSearch && matchesStatus
    })

    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]
      
      if (sortField === 'dateOfLoss') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [cases, searchTerm, sortField, sortDirection, filterStatus])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getStatusBadge = (outcome) => {
    const statusClass = `status-badge status-${outcome}`
    const statusText = outcome === 'accepted' ? 'Accepted' : 
                      outcome === 'rejected' ? 'Rejected' : 'Pending'
    return <span className={statusClass}>{statusText}</span>
  }

  return (
    <div className="fnol-table-widget">
      <div className="table-header">
        <h2>{t('dashboard.fnolTable')}</h2>
        <div className="table-controls">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="all">{t('dashboard.allStatuses')}</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="pending">Pending</option>
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
        <table className="fnol-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('caseNumber')}>
                {t('dashboard.caseNumber')}
                {sortField === 'caseNumber' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th onClick={() => handleSort('claimId')}>
                {t('dashboard.claimId')}
                {sortField === 'claimId' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th onClick={() => handleSort('reportedBy')}>
                {t('dashboard.reportedBy')}
                {sortField === 'reportedBy' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th onClick={() => handleSort('insuredName')}>
                {t('dashboard.insuredName')}
                {sortField === 'insuredName' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th onClick={() => handleSort('city')}>
                {t('dashboard.city')}
                {sortField === 'city' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th onClick={() => handleSort('dateOfLoss')}>
                {t('dashboard.dateOfLoss')}
                {sortField === 'dateOfLoss' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th onClick={() => handleSort('finalOutcome')}>
                {t('dashboard.outcome')}
                {sortField === 'finalOutcome' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedCases.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-results">
                  {t('dashboard.noResults')}
                </td>
              </tr>
            ) : (
              filteredAndSortedCases.map((caseItem) => (
                <tr 
                  key={caseItem.id}
                  onClick={() => setSelectedCase(caseItem)}
                  className="case-row-clickable"
                >
                  <td>{caseItem.caseNumber}</td>
                  <td>{caseItem.claimId}</td>
                  <td>{caseItem.reportedBy}</td>
                  <td>{caseItem.insuredName}</td>
                  <td>{caseItem.city}, {caseItem.state}</td>
                  <td>{new Date(caseItem.dateOfLoss).toLocaleDateString()}</td>
                  <td>{getStatusBadge(caseItem.finalOutcome)}</td>
                  <td>
                    <button 
                      className="view-details-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCase(caseItem)
                      }}
                    >
                      {t('dashboard.viewDetails')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="table-footer">
        <span>
          {t('dashboard.showing')
            .replace('{{count}}', filteredAndSortedCases.length)
            .replace('{{total}}', cases.length)}
        </span>
      </div>

      {selectedCase && (
        <div 
          className="simulator-modal" 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedCase(null)
            }
          }}
        >
          <div className="simulator-modal-content">
            <div className="simulator-modal-header">
              <h2>FNOL Processing Simulator</h2>
              <p>Case: {selectedCase.claimId} - {selectedCase.insuredName}</p>
              <button 
                className="close-btn"
                onClick={() => setSelectedCase(null)}
              >
                ✕
              </button>
            </div>
            <div className="simulator-modal-body">
              <FNOLSimulator caseData={selectedCase} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FNOLTable

