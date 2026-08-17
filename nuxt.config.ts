export default defineNuxtConfig({
  compatibilityDate: '2026-08-17',
  modules: ['@nuxt/ui', 'nuxt-auth-utils', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  icon: {
    clientBundle: {
      scan: true,
      icons: [
        'lucide:arrow-down', 'lucide:arrow-left-right', 'lucide:arrow-right', 'lucide:arrow-up', 'lucide:arrow-up-down',
        'lucide:chevron-left', 'lucide:chevron-right', 'lucide:circle-alert', 'lucide:circle-check', 'lucide:clipboard-check',
        'lucide:download', 'lucide:eye', 'lucide:file-chart-column', 'lucide:file-up', 'lucide:handshake', 'lucide:history',
        'lucide:inbox', 'lucide:layout-dashboard', 'lucide:loader-circle', 'lucide:lock', 'lucide:log-out', 'lucide:map-pin',
        'lucide:menu', 'lucide:moon', 'lucide:package', 'lucide:package-check', 'lucide:paperclip', 'lucide:pencil',
        'lucide:plus', 'lucide:qr-code', 'lucide:refresh-cw', 'lucide:rotate-ccw', 'lucide:route', 'lucide:save',
        'lucide:search', 'lucide:send', 'lucide:settings', 'lucide:sun', 'lucide:trash-2', 'lucide:undo-2',
        'lucide:user-check', 'lucide:user-x', 'lucide:users', 'lucide:wrench', 'lucide:x',
      ],
    },
    serverBundle: { collections: ['lucide'] },
  },
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
