import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import Dashboard from './Dashboard'
import CreateTest from './pages/CreateTest'
import TestSession from './pages/TestSession'
import ReviewSubmissions from './pages/ReviewSubmissions'
import TestResults from './pages/TestResults'
import PlansPage from './pages/PlansPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path='/dashboard' element={<Dashboard />}/>
          <Route path='/create-test' element={<CreateTest />}/>
          <Route path='/edit-test/:id' element={<CreateTest />}/>
          <Route path='/test/:id' element={<TestSession />}/>
          <Route path='/test/:id/review' element={<ReviewSubmissions />}/>
          <Route path='/test/:id/results' element={<TestResults />}/>
          <Route path='/plans' element={<PlansPage />}/>
          {/* 404 - Must be last */}
          <Route path='*' element={<NotFoundPage />}/>
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}
