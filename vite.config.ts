import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // 這裡將 Vercel 環境變數中的 API_KEY 注入到前端代碼中的 process.env.API_KEY
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
});