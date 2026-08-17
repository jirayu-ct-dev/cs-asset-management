export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return
  const { loggedIn, fetch } = useUserSession()
  await fetch()
  if (!loggedIn.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
