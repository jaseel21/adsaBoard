import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'lenis/dist/lenis.css'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import Context from "./store/AuthContext.jsx"
import { registerServiceWorker } from './utils/pwaManager'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Initialize PWA Service Worker
registerServiceWorker()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Context>
          <App />
        </Context>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
