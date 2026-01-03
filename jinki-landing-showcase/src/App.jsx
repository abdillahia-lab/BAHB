import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage3 from './pages/LandingPage3'
import './styles/global.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage3 />} />
      </Routes>
    </Router>
  )
}

export default App
