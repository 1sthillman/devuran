import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { initializeSecurity } from './utils/security'

// SECURITY: Initialize all security measures before app starts
initializeSecurity().then(() => {
  createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  )
}).catch((error) => {
  // Security initialization failed - show error
  document.body.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>Security Error</h1><p>Application failed to initialize securely.</p></div>';
})
