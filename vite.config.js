import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Config mínima do Vite — porta padrão 5173, plugin React para JSX/Fast Refresh.
export default defineConfig({
  plugins: [react()],
})
