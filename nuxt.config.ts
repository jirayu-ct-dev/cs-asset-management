export default defineNuxtConfig({
  compatibilityDate: '2026-08-17',
  modules: ['@nuxt/ui', 'nuxt-auth-utils', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  typescript: { strict: true, typeCheck: true },
  runtimeConfig: {
    session: {
      password: '',
      maxAge: 60 * 60 * 8,
      cookie: {
        httpOnly: true,
        secure: process.env.NUXT_SESSION_COOKIE_SECURE === 'true',
        sameSite: 'lax' as const,
      },
    },
    databaseUrl: '',
    uploadDir: './storage/uploads',
    maxUploadSize: 10_485_760,
    trustedProxy: false,
    public: { appBaseUrl: 'http://localhost:3000' },
  },
  nitro: {
    experimental: { database: true },
    routeRules: {
      '/api/**': { headers: { 'Cache-Control': 'no-store' } },
    },
  },
})
