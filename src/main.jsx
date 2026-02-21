import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

const vh = window.innerHeight * 0.01
document.documentElement.style.setProperty('--vh', `${vh}px`)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
