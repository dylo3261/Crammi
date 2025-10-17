import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './LandingPage/Header.css'
import './index.css'
import './LandingPage/sectionOne.css'
import './LandingPage/sectionTwo.css'
//Dashboard
import './Dashboard/DashboardHeader.css'
import './Dashboard/uploadModal.css'
import './Dashboard/uploadModal.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
