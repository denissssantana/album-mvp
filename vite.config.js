import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// HTTPS LOCAL CONFIG
const httpsConfig =
  process.env.NODE_ENV !== 'production'
    ? {
        key: fs.readFileSync('./localhost+1-key.pem'),
        cert: fs.readFileSync('./localhost+1.pem'),
      }
    : undefined

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 4173,
    https: httpsConfig,
  },
})