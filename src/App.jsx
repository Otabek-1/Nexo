import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import Dashboard from './Dashboard'
import CreateTest from './pages/CreateTest'
import TestSession from './pages/TestSession'
import ReviewSubmissions from './pages/ReviewSubmissions'
import TestResults from './pages/TestResults'
import PlansPage from './pages/PlansPage'
import { isAuthenticated } from './lib/auth'

// Protected route wrapper
function ProtectedRoute({ element }) {
  if (!isAuthenticated()) {
    return <Navigate to="/auth?tab=login" replace />
  }
  return element
}

// Public route wrapper - redirect to dashboard if already logged in
function PublicRoute({ element }) {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />
  }
  return element
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<PublicRoute element={<AuthPage />} />} />
          <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
          <Route path="/create-test" element={<ProtectedRoute element={<CreateTest />} />} />
          <Route path="/edit-test/:id" element={<ProtectedRoute element={<CreateTest />} />} />
          <Route path="/test/:id" element={<TestSession />} />
          <Route path="/test/:id/review" element={<ProtectedRoute element={<ReviewSubmissions />} />} />
          <Route path="/test/:id/results" element={<TestResults />} />
          <Route path="/plans" element={<ProtectedRoute element={<PlansPage />} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}
