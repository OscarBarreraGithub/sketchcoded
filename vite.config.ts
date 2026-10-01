import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    // Test reports, build output and board data are not app source; writing them must never
    // reload a board someone has open in the dev server.
    watch: {
      ignored: ['**/playwright-report/**', '**/test-results/**', '**/dist/**', '**/.drawcode/**'],
    },
  },
});
