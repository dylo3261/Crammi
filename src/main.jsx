import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './Header.css'
import './index.css'
import './sectionOne.css'
import './sectionTwo.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
