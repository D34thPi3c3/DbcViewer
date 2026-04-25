import { useSyncExternalStore } from 'react'
import { LoginPage } from './pages/LoginPage'
import { PublicUploadPage } from './pages/PublicUploadPage'

const uploadPath = '/'
const loginPath = '/login'

function subscribeToLocation(onStoreChange: () => void) {
  window.addEventListener('popstate', onStoreChange)

  return () => {
    window.removeEventListener('popstate', onStoreChange)
  }
}

function getLocationSnapshot() {
  return window.location.pathname
}

function navigateTo(path: string) {
  if (window.location.pathname === path) {
    return
  }

  window.history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function App() {
  const pathname = useSyncExternalStore(
    subscribeToLocation,
    getLocationSnapshot,
    getLocationSnapshot,
  )

  if (pathname === loginPath) {
    return <LoginPage onNavigateToUpload={() => navigateTo(uploadPath)} />
  }

  return <PublicUploadPage onNavigateToLogin={() => navigateTo(loginPath)} />
}

export default App
