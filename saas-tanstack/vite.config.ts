import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      // Workers 运行时内置模块，打包器不需要（也无法）解析它
      external: [/^cloudflare:/],
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(import.meta.dirname, './app'),
    },
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      srcDirectory: 'app',
    }),
    viteReact(),
  ],
})
