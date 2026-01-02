import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Directory from './pages/Directory'
import LandingPage1 from './pages/LandingPage1'
import LandingPage2 from './pages/LandingPage2'
import LandingPage3 from './pages/LandingPage3'
import './styles/global.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Directory />} />
        <Route path="/landing-1" element={<LandingPage1 />} />
        <Route path="/landing-2" element={<LandingPage2 />} />
        <Route path="/landing-3" element={<LandingPage3 />} />
      </Routes>
    </Router>
  )
}

export default App
