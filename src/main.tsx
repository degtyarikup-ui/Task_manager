import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initTelegramApp } from './utils/telegram'
import './index.css'
import App from './App.tsx'

// Immediately signal Telegram that we are ready
initTelegramApp();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
