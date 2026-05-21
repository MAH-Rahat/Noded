import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import './styles/animations.css'
import App from './App.tsx'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found. Ensure index.html has a <div id="root">.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
