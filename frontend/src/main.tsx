import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { startAppUpdates } from './services/appUpdates'
import './index.css'
import './design-system.css'
import './layout-refinements.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (import.meta.env.PROD) startAppUpdates(__APP_VERSION__);
