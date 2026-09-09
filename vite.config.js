import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        // Keep the SDKs in their own chunks: they change far less often than the
        // app, so a redeploy doesn't invalidate them in everyone's browser cache.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          // Leave Storage and Functions unassigned: they are imported dynamically,
          // and naming them here would drag them back into the eager chunk.
          if (/[@/]firebase\/(storage|functions)/.test(id)) return
          if (id.includes('@firebase') || id.includes('/firebase/')) return 'firebase'
          if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/')) return 'react'
        },
      },
    },
  },
})
