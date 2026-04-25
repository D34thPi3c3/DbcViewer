import { createRoute, createRootRoute, createRouter } from '@tanstack/react-router'
import App from './App'
import { LoginPage } from './pages/LoginPage'
import { PublicUploadPage } from './pages/PublicUploadPage'

const rootRoute = createRootRoute({
  component: App,
})

const uploadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: PublicUploadPage,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const routeTree = rootRoute.addChildren([uploadRoute, loginRoute])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
