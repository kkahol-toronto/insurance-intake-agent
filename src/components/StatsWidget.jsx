import { useState, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './StatsWidget.css'

function StatsWidget({ title, value, valueByPeriod, icon, color = 'default', dataKey, timeSeriesData, timePeriod }) {
  const { t } = useTranslation()
  const [selectedPeriod, setSelectedPeriod] = useState(timePeriod || 'day')
  const [showGraph, setShowGraph] = useState(true) // Show graphs by default
  const [chartType, setChartType] = useState('line') // 'line' or 'bar'
  const chartRef = useRef(null)

  const currentValue = useMemo(() => {
    if (valueByPeriod && typeof valueByPeriod === 'object') {
      const periodValue = valueByPeriod[selectedPeriod]
      if (typeof periodValue === 'number') return periodValue
    }
    if (typeof value === 'number') {
      return value
    }
    return 0
  }, [valueByPeriod, selectedPeriod, value])

  const chartData = useMemo(() => {
    if (!timeSeriesData) return []
    
    // Map selected period to data key
    const periodMap = {
      'day': 'daily',
      'week': 'weekly',
      'month': 'monthly',
      'quarter': 'quarterly'
    }
    
    const periodDataKey = periodMap[selectedPeriod] || 'daily'
    const data = timeSeriesData[periodDataKey] || {}
    const entries = Object.entries(data).sort(([a], [b]) => {
      if (selectedPeriod === 'day' || selectedPeriod === 'week') return new Date(a) - new Date(b)
      if (selectedPeriod === 'month') return a.localeCompare(b)
      return a.localeCompare(b)
    })

    // Get last 5 data points
    return entries.slice(-5).map(([date, values]) => ({
      date: selectedPeriod === 'day' 
        ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : selectedPeriod === 'week'
        ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : selectedPeriod === 'month'
        ? date
        : date,
      value: values[dataKey] || 0
    }))
  }, [timeSeriesData, selectedPeriod, dataKey])

  const previousValue = useMemo(() => {
    if (!timeSeriesData) return null
    
    // Map selected period to data key
    const periodMap = {
      'day': 'daily',
      'week': 'weekly',
      'month': 'monthly',
      'quarter': 'quarterly'
    }
    
    const dataKeyForPeriod = periodMap[selectedPeriod] || 'daily'
    const data = timeSeriesData[dataKeyForPeriod] || {}
    const entries = Object.entries(data).sort(([a], [b]) => {
      if (selectedPeriod === 'day' || selectedPeriod === 'week') return new Date(a) - new Date(b)
      if (selectedPeriod === 'month') return a.localeCompare(b)
      return a.localeCompare(b)
    })
    
    if (entries.length < 2) return null
    const prevEntry = entries[entries.length - 2][1]
    return prevEntry[dataKey] || 0
  }, [timeSeriesData, selectedPeriod, dataKey])

  const percentageChange = useMemo(() => {
    if (previousValue === null || previousValue === 0) return null
    const change = ((currentValue - previousValue) / previousValue) * 100
    return change
  }, [currentValue, previousValue])

  const handleDownloadPNG = () => {
    if (!chartRef.current) return
    
    const container = chartRef.current
    const svgElement = container.querySelector('svg')
    if (!svgElement) return
    
    // Get actual rendered dimensions from the SVG element itself
    const svgRect = svgElement.getBoundingClientRect()
    const actualWidth = svgRect.width || parseInt(svgElement.getAttribute('width')) || 800
    const actualHeight = svgRect.height || parseInt(svgElement.getAttribute('height')) || 400
    
    // Clone the SVG to modify it for export
    const clonedSvg = svgElement.cloneNode(true)
    
    // Get viewBox if it exists
    const viewBox = svgElement.getAttribute('viewBox')
    let svgWidth = actualWidth
    let svgHeight = actualHeight
    
    if (viewBox) {
      const viewBoxValues = viewBox.split(/\s+/)
      if (viewBoxValues.length >= 4) {
        // Use viewBox dimensions for aspect ratio
        const vbWidth = parseFloat(viewBoxValues[2])
        const vbHeight = parseFloat(viewBoxValues[3])
        if (vbWidth > 0 && vbHeight > 0) {
          // Maintain aspect ratio
          const aspectRatio = vbWidth / vbHeight
          if (actualWidth / actualHeight > aspectRatio) {
            svgHeight = actualHeight
            svgWidth = actualHeight * aspectRatio
          } else {
            svgWidth = actualWidth
            svgHeight = actualWidth / aspectRatio
          }
        }
      }
      clonedSvg.setAttribute('viewBox', viewBox)
    } else {
      // Create a viewBox from the actual dimensions
      clonedSvg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
    }
    
    // Set full-screen dimensions for export (1920x1080 or similar)
    const exportWidth = 1920
    const exportHeight = 1080
    const padding = 80 // Space for title and padding
    
    // Calculate chart dimensions (leaving space for title)
    const chartHeight = exportHeight - padding * 2
    const chartWidth = exportWidth - padding * 2
    
    // Calculate scale factor to fit the chart in the export area
    const scaleX = chartWidth / svgWidth
    const scaleY = chartHeight / svgHeight
    const scale = Math.min(scaleX, scaleY) * 0.9 // Use 90% to leave some margin
    
    // Create a wrapper SVG with white background and full-screen dimensions
    const wrapperSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    wrapperSvg.setAttribute('width', exportWidth)
    wrapperSvg.setAttribute('height', exportHeight)
    wrapperSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    wrapperSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
    
    // Add white background rectangle
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    bgRect.setAttribute('width', exportWidth)
    bgRect.setAttribute('height', exportHeight)
    bgRect.setAttribute('fill', 'white')
    wrapperSvg.appendChild(bgRect)
    
    // Add title
    const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    titleText.setAttribute('x', exportWidth / 2)
    titleText.setAttribute('y', 50)
    titleText.setAttribute('text-anchor', 'middle')
    titleText.setAttribute('font-size', '36')
    titleText.setAttribute('font-weight', 'bold')
    titleText.setAttribute('fill', '#003946')
    titleText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif')
    titleText.textContent = title
    wrapperSvg.appendChild(titleText)
    
    // Add period label below title
    const periodText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    periodText.setAttribute('x', exportWidth / 2)
    periodText.setAttribute('y', 85)
    periodText.setAttribute('text-anchor', 'middle')
    periodText.setAttribute('font-size', '24')
    periodText.setAttribute('fill', '#666')
    periodText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif')
    periodText.textContent = `${t('dashboard.timePeriods.' + selectedPeriod)} • ${chartType === 'bar' ? t('dashboard.barChart') : t('dashboard.lineChart')}`
    wrapperSvg.appendChild(periodText)
    
    // Create a group for the chart with proper scaling and positioning
    const chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    chartGroup.setAttribute('transform', `translate(${(exportWidth - svgWidth * scale) / 2}, ${padding + 20}) scale(${scale})`)
    
    // Set the cloned SVG dimensions and viewBox
    clonedSvg.setAttribute('width', svgWidth)
    clonedSvg.setAttribute('height', svgHeight)
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
    
    // Remove any inline styles that might interfere
    clonedSvg.removeAttribute('style')
    
    // Append the cloned SVG content to the group
    while (clonedSvg.firstChild) {
      chartGroup.appendChild(clonedSvg.firstChild)
    }
    
    wrapperSvg.appendChild(chartGroup)
    
    // Create canvas for export
    const canvas = document.createElement('canvas')
    canvas.width = exportWidth
    canvas.height = exportHeight
    const ctx = canvas.getContext('2d')
    
    // Convert SVG to image
    const svgData = new XMLSerializer().serializeToString(wrapperSvg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    
    const img = new Image()
    img.onload = () => {
      // Draw white background
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw the SVG
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      // Download as PNG with maximum quality
      canvas.toBlob((blob) => {
        if (blob) {
          const link = document.createElement('a')
          const fileName = `${title.replace(/\s+/g, '_')}_${selectedPeriod}_${chartType}.png`
          link.download = fileName
          link.href = URL.createObjectURL(blob)
          link.click()
          URL.revokeObjectURL(url)
          setTimeout(() => URL.revokeObjectURL(link.href), 100)
        }
      }, 'image/png', 1.0)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      console.error('Failed to load SVG for export')
    }
    img.src = url
  }

  return (
    <div className={`stats-widget stats-widget-${color}`}>
      <div className="stats-widget-header">
        <div className="stats-header-left">
          <span className="stats-icon">{icon}</span>
          <h3 className="stats-title">{title}</h3>
        </div>
        <div className="stats-header-right">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-selector"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="day">{t('dashboard.timePeriods.day')}</option>
            <option value="week">{t('dashboard.timePeriods.week')}</option>
            <option value="month">{t('dashboard.timePeriods.month')}</option>
            <option value="quarter">{t('dashboard.timePeriods.quarter')}</option>
          </select>
        </div>
      </div>
      
      <div className="stats-value-container">
        <div className="stats-value">{currentValue.toLocaleString()}</div>
        {percentageChange !== null && (
          <div className={`percentage-change ${percentageChange >= 0 ? 'positive' : 'negative'}`}>
            {percentageChange >= 0 ? '↑' : '↓'} {Math.abs(percentageChange).toFixed(1)}%
          </div>
        )}
      </div>

      {timeSeriesData && chartData.length > 0 && (
        <div className="stats-graph-container">
          <div className="graph-controls">
            {showGraph && (
              <div className="graph-actions">
                <div className="chart-type-selector">
                  <button
                    className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`}
                    onClick={() => setChartType('line')}
                    title={t('dashboard.lineChart')}
                  >
                    📈
                  </button>
                  <button
                    className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
                    onClick={() => setChartType('bar')}
                    title={t('dashboard.barChart')}
                  >
                    📊
                  </button>
                </div>
                <button
                  className="download-btn"
                  onClick={handleDownloadPNG}
                  title={t('dashboard.downloadGraph')}
                >
                  ⬇️ {t('dashboard.download')}
                </button>
              </div>
            )}
          </div>
          {showGraph && (
            <div className="stats-graph" ref={chartRef}>
              <ResponsiveContainer width="100%" height={120}>
                {chartType === 'bar' ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666"
                      fontSize={10}
                      tick={{ fill: '#666' }}
                    />
                    <YAxis 
                      stroke="#666"
                      fontSize={10}
                      tick={{ fill: '#666' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: '2px 4px',
                        fontSize: '10px',
                        color: '#003946',
                        fontWeight: '600',
                        boxShadow: 'none'
                      }}
                      cursor={{ fill: 'transparent' }}
                      formatter={(value) => value}
                      labelFormatter={() => ''}
                      wrapperStyle={{ outline: 'none' }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill={color === 'accepted' ? '#28a745' : color === 'pending' ? '#ECAB23' : color === 'denied' ? '#dc3545' : '#003946'}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666"
                      fontSize={10}
                      tick={{ fill: '#666' }}
                    />
                    <YAxis 
                      stroke="#666"
                      fontSize={10}
                      tick={{ fill: '#666' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: '2px 4px',
                        fontSize: '10px',
                        color: '#003946',
                        fontWeight: '600',
                        boxShadow: 'none'
                      }}
                      cursor={{ stroke: color === 'accepted' ? '#28a745' : color === 'pending' ? '#ECAB23' : color === 'denied' ? '#dc3545' : '#003946', strokeWidth: 1, strokeDasharray: '3 3', opacity: 0.3 }}
                      formatter={(value) => value}
                      labelFormatter={() => ''}
                      wrapperStyle={{ outline: 'none' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={color === 'accepted' ? '#28a745' : color === 'pending' ? '#ECAB23' : color === 'denied' ? '#dc3545' : '#003946'}
                      strokeWidth={2}
                      dot={{ fill: color === 'accepted' ? '#28a745' : color === 'pending' ? '#ECAB23' : color === 'denied' ? '#dc3545' : '#003946', r: 3 }}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default StatsWidget