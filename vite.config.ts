import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [vue(), dts()],
  resolve: {
    alias: {
      '@': './src',
      '@composables': './src/composables',
      '@config': './src/config',
      '@constants': './src/constants',
      '@rest': './src/rest',
      '@types': './src/types',
      '@utils': './src/utils',
    }
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'ArexVueCore',
      fileName: (format) => `arex-vue-core.${format}.js`
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})