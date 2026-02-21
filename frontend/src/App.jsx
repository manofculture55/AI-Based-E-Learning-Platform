import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

// Pages
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Home from './pages/Home.jsx'
import Explainer from './pages/Explainer.jsx'

// Lazy load these (not needed until navigated to):
const McqGenerator = lazy(() => import('./pages/McqGenerator.jsx'))
const History = lazy(() => import('./pages/History.jsx'))

// Layout & route guard
import PrivateRoute from './components/PrivateRoute.jsx'
import Layout from './components/Layout.jsx'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
              <span style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>Loading...</span>
            </div>
          }>
            <Routes>
              {/* Public routes — no sidebar */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected routes — with sidebar layout */}
              <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                  <Route path="/home" element={<Home />} />
                  <Route path="/explainer" element={<Explainer />} />
                  <Route path="/mcq" element={<McqGenerator />} />
                  <Route path="/history" element={<History />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
