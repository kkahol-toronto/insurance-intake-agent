import { useTranslation } from 'react-i18next'
import './StatsWidget.css'

function StatsWidget({ title, value, icon, color = 'default' }) {
  const { t } = useTranslation()

  const colorClass = `stats-widget-${color}`

  return (
    <div className={`stats-widget ${colorClass}`}>
      <div className="stats-widget-header">
        <span className="stats-icon">{icon}</span>
        <h3 className="stats-title">{title}</h3>
      </div>
      <div className="stats-value">{value || 0}</div>
    </div>
  )
}

export default StatsWidget

