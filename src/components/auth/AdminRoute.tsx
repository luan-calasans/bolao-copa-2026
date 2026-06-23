import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AdminLayout } from '../layout/AdminLayout'
import { LoadingState } from '../ui/LoadingState'
import { getAdminSession } from '../../services/adminAuthService'

interface AdminRouteProps {
  children: ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const session = await getAdminSession()
        if (!cancelled) {
          setIsAuthenticated(session.authenticated)
        }
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false)
        }
      } finally {
        if (!cancelled) {
          setIsChecking(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  if (isChecking) {
    return (
      <AdminLayout>
        <LoadingState lines={2} />
      </AdminLayout>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  return children
}
