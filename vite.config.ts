import { defineConfig } from 'vite'

// Use dynamic import to avoid CommonJS/ESM loading errors when @vitejs/plugin-react is ESM-only
export default defineConfig(async () => {
  const react = (await import('@vitejs/plugin-react')).default
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'https://pgeo3.rio.rj.gov.br',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/arcgis/rest/services/Fazenda/ITBI/MapServer/8/query'),
          secure: false
        }
      }
    }
  }
})
