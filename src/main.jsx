import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

const syncViewportHeight = () => {
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
}

syncViewportHeight()
window.addEventListener('resize', syncViewportHeight, { passive: true })
window.addEventListener('orientationchange', syncViewportHeight, { passive: true })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
