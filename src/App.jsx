import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import ProtectedRoute from '@/routes/ProtectedRoute'
import HomePage from '@/pages/HomePage'
import DashboardPage from '@/pages/DashboardPage'
import VocabularyPage from '@/pages/VocabularyPage'
import LearningPage from '@/pages/LearningPage'
import ReviewPage from '@/pages/ReviewPage'
import ExamPage from '@/pages/ExamPage'
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
      <Route path="/"           element={<HomePage />} />
      <Route path="/vocabulary" element={<VocabularyPage />} />

      <Route path="/dashboard"   element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/learn"       element={<ProtectedRoute><LearningPage /></ProtectedRoute>} />
      <Route path="/review"      element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
      <Route path="/exam"        element={<ProtectedRoute><ExamPage /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
