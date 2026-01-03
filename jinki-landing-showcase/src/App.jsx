import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage2 from './pages/LandingPage2'
import './styles/global.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage2 />} />
      </Routes>
    </Router>
  )
}

export default App
