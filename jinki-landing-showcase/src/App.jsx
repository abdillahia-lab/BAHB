import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useCallback, lazy, Suspense } from 'react'
import LandingPage3 from './pages/LandingPage3'
import ConversationalUI from './components/ConversationalUI'
import PageSkeleton from './components/PageSkeleton'
import './styles/global.css'

// PERFORMANCE OPTIMIZATION: Lazy-load 3D showcase pages
// Prevents ~56.7kB of three.js from blocking initial page load
const Parallax3DShowcase = lazy(() => import('./pages/Parallax3DShowcase'))
const HolographicShowcasePage = lazy(() => import('./pages/HolographicShowcasePage'))

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
        <Route
          path="/3d"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <Parallax3DShowcase />
            </Suspense>
          }
        />
        <Route
          path="/holographic"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <HolographicShowcasePage />
            </Suspense>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
