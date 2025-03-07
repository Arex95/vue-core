import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import typescript from '@rollup/plugin-typescript'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default {
  input: resolve(__dirname, 'src/index.ts'),
  output: [
    {
      file: 'dist/vue-core.cjs.js',
      format: 'cjs',
      exports: 'named',
    },
    {
      file: 'dist/vue-core.esm.js',
      format: 'esm',
    },
  ],
  plugins: [
    typescript(),
  ],
  external: ['vue', '@tanstack/vue-query', 'axios', '@vueuse/core'],
}