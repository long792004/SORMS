import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // cố định cổng dev để cookie / token luôn hợp lệ khi khởi động lại
    port: 5173,
    strictPort: false, // tắt strictPort để nếu port bận, vite sẽ tự động tăng lên 5174, 5175...
    proxy: {
      '/api': {
        target: 'http://localhost:5183',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
