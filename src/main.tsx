import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Global Error Handler for mobile debugging
window.onerror = function (message, source, lineno, colno, error) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; color: red;">
        <h3>Application Error</h3>
        <p>${message}</p>
        <pre>${source}:${lineno}:${colno}</pre>
        <pre>${error?.stack || ''}</pre>
      </div>
    `;
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
