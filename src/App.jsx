import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import ProtectedRoute from '@/routes/ProtectedRoute'
import HomePage from '@/pages/HomePage'
import DashboardPage from '@/pages/DashboardPage'
import VocabularyPage from '@/pages/VocabularyPage'
import LearningPage from '@/pages/LearningPage'
import ReviewPage from '@/pages/ReviewPage'
import LeaderboardPage from '@/pages/LeaderboardPage'
import LoadingScreen from '@/components/ui/LoadingScreen'

export default function App() {
  const { initialize, loading } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) return <LoadingScreen />

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/vocabulary" element={<VocabularyPage />} />

      {/* Protected routes */}
      <Route path="/dashboard"   element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/learn"       element={<ProtectedRoute><LearningPage /></ProtectedRoute>} />
      <Route path="/review"      element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
