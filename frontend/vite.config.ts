import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/auth': 'http://localhost:3000',
            '/resources': 'http://localhost:3000',
            '/trades': 'http://localhost:3000',
            '/notifications': 'http://localhost:3000',
            '/ws': {
                target: 'ws://localhost:3000',
                ws: true
            }
        }
    }
})
