import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    host: true, // Expose to local network (other devices can access via IP)
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
