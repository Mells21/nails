import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { mountToaster } from 'gooey-toast'
import 'gooey-toast/styles.css'
import './index.css'
import App from './App.jsx'

mountToaster({ position: 'top-center' })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
