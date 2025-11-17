import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { authenticateUser, setAuthToken } from '../utils/auth'
import logo from '../../assets/logo.png'
import './Login.css'

function Login() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    
    const result = authenticateUser(username, password)
    if (result.success) {
      setAuthToken(result.username)
      navigate('/dashboard')
    } else {
      setError(result.message || t('login.error'))
    }
  }

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="language-selector">
          <button
            className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
            onClick={() => handleLanguageChange('en')}
          >
            EN
          </button>
          <button
            className={`lang-btn ${i18n.language === 'de' ? 'active' : ''}`}
            onClick={() => handleLanguageChange('de')}
          >
            DE
          </button>
        </div>

        <div className="logo-container">
          <img src={logo} alt="Munich Re Logo" className="logo" />
        </div>

        <h1 className="login-title">{t('login.title')}</h1>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">{t('login.username')}</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('login.password')}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>{t('login.rememberMe')}</span>
            </label>
          </div>

          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="sign-in-button">
            {t('login.loginButton')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login

