import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    include: ['app/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '~': path.resolve(import.meta.dirname, './app'),
      // Workers 运行时内置模块，测试环境用 stub 顶替，
      // 这样 mail/storage 这些依赖 `cloudflare:workers` 的模块仍能被解析
      'cloudflare:workers': path.resolve(import.meta.dirname, './tests/cloudflare-workers-stub.ts'),
    },
  },
});
