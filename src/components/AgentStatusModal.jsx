import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './AgentStatusModal.css'

const STEP_DELAY = 1200
const EXTENDED_DELAY = 4000

function AgentStatusModal({ type, onClose }) {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(0)

  const steps = useMemo(() => {
    const key = type === 'pega' ? 'pegaSteps' : 'chessSteps'
    const translated = t(`dashboard.agentModal.${key}`, { returnObjects: true })
    if (Array.isArray(translated) && translated.length > 0) {
      return translated
    }

    if (type === 'pega') {
      return [
        'Connecting to Pega Agent...',
        'Connection established ✅',
        '4 new cases identified',
        'Pulling case data...',
        'Cases placed into quality checks queue'
      ]
    }

    return [
      'Connecting to CHESS...',
      'Connection established ✅',
      'Data is up to date'
    ]
  }, [type, t])

  const title = type === 'pega'
    ? t('dashboard.agentModal.pegaTitle', 'Pega Agent Activity')
    : t('dashboard.agentModal.chessTitle', 'CHESS Agent Status')

  useEffect(() => {
    setCurrentStep(0)
    const timers = []
    let accumulatedDelay = 0
    for (let i = 1; i < steps.length; i += 1) {
      const previousText = steps[i - 1].toLowerCase()
      const delay = previousText.includes('pulling') ? EXTENDED_DELAY : STEP_DELAY
      accumulatedDelay += delay
      timers.push(setTimeout(() => setCurrentStep(i), accumulatedDelay))
    }
    return () => {
      timers.forEach(clearTimeout)
    }
  }, [steps])

  return (
    <div className="agent-modal-overlay" role="dialog" aria-modal="true">
      <div className="agent-modal">
        <button
          className="agent-modal-close"
          onClick={onClose}
          aria-label={t('dashboard.agentModal.close', 'Close')}
        >
          ✕
        </button>
        <h2>{title}</h2>
        <div className="agent-modal-step-container">
          <div key={currentStep} className="agent-step-card">
            {steps[currentStep]}
          </div>
        </div>
        <div className="agent-modal-actions">
          <button onClick={onClose} className="agent-modal-btn primary">
            {t('dashboard.agentModal.ok', 'OK')}
          </button>
          <button onClick={onClose} className="agent-modal-btn">
            {t('dashboard.agentModal.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AgentStatusModal

