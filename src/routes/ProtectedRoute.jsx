import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore()

  // Wait for Supabase session restoration
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    )
  }

  // Only redirect after loading completes
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}