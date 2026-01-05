import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useCallback } from 'react'
import LandingPage3 from './pages/LandingPage3'
import Parallax3DShowcase from './pages/Parallax3DShowcase'
import HolographicShowcasePage from './pages/HolographicShowcasePage'
import ConversationalUI from './components/ConversationalUI'
import './styles/global.css'

function App() {
  const handleNavigate = useCallback((target) => {
    if (target && target.startsWith('#')) {
      const element = document.querySelector(target)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [])

  return (
    <Router>
      <ConversationalUI onNavigate={handleNavigate} />
      <Routes>
        <Route path="/" element={<LandingPage3 />} />
        <Route path="/3d" element={<Parallax3DShowcase />} />
        <Route path="/holographic" element={<HolographicShowcasePage />} />
      </Routes>
    </Router>
  )
}

export default App
