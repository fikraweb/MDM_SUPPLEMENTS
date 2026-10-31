import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  server: { proxy: { '/api': 'http://127.0.0.1:8787' } },
  build: { rollupOptions: { input: { store: fileURLToPath(new URL('./index.html', import.meta.url)), admin: fileURLToPath(new URL('./admin/index.html', import.meta.url)) } } }
});
