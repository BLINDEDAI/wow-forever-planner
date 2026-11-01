import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // Relative base so the same build works at a domain root or under /<repo>/ (GitHub Pages).
  base: './',
  plugins: [vue()],
  test: { environment: 'node' },
})
