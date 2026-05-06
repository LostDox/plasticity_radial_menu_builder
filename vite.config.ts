import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    base: '/plasticity_radial_menu_builder/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), 
      '@components': path.resolve(__dirname, './src/components')
    }
  },
assetsInclude: ['**/*.svg'],
  plugins: [
      react(),
      tailwindcss(),
  ],
})
