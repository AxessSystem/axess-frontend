import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import './index.css'

// בדוק אם יש גרסה חדשה בכל טעינה:
const BUILD_VERSION = import.meta.env.VITE_BUILD_VERSION || Date.now().toString();

const lastVersion = localStorage.getItem('app_version');
if (lastVersion && lastVersion !== BUILD_VERSION) {
  localStorage.setItem('app_version', BUILD_VERSION);
  window.location.reload(); // רענון אוטומטי חד פעמי
} else {
  localStorage.setItem('app_version', BUILD_VERSION);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              window.location.reload()
            }
          })
        })
      })
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
