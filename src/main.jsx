import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ToastProvider } from './context/ToastContext'
import './index.css'
import App from './App.jsx'

// Redirect /payment-result pathname to HashRouter path to support external redirects
if (window.location.pathname.includes('/payment-result')) {
  const search = window.location.search;
  window.location.replace(`${window.location.origin}/#/payment-result${search}`);
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
