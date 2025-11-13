import { defineConfig } from 'vite'
import { nodeResolve } from '@rollup/plugin-node-resolve'

export default defineConfig({
  build: {
    target: 'node20',
    outDir: 'dist',
    ssr: true,
    lib: {
      entry: 'src/index.ts',
      formats: ['es']
    },
    rollupOptions: {
      external: ['express', 'cors', 'dotenv'],
      output: {
        entryFileNames: 'index.js'
      }
    }
  },
  plugins: [nodeResolve()]
})
