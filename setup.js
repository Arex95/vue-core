const fs = require('fs')
const path = require('path')

const projectName = 'my-vue-core'
const basePath = path.join(__dirname, projectName)

const folders = [
    'src',
    'src/composables',
    'src/services',
    'src/components',
    'dist'
]

const files = {
    'package.json': JSON.stringify(
        {
            name: `@tu-usuario/${projectName}`,
            version: '1.0.0',
            description: 'Un core de Vue reutilizable',
            main: 'dist/index.js',
            module: 'dist/index.mjs',
            types: 'dist/index.d.ts',
            files: ['dist'],
            scripts: {
                build: 'vite build',
                prepare: 'npm run build'
            },
            repository: {
                type: 'git',
                url: `https://github.com/tu-usuario/${projectName}.git`
            },
            keywords: ['vue', 'composables', 'core', 'npm'],
            author: 'Tu Nombre',
            license: 'MIT',
            peerDependencies: {
                vue: '^3.0.0'
            },
            devDependencies: {
                vite: '^4.0.0',
                typescript: '^5.0.0',
                vue: '^3.0.0',
                'vite-plugin-dts': '^2.0.0'
            }
        },
        null,
        2
    ),

    'tsconfig.json': JSON.stringify(
        {
            compilerOptions: {
                target: 'ESNext',
                module: 'ESNext',
                moduleResolution: 'Node',
                declaration: true,
                outDir: 'dist',
                strict: true
            },
            include: ['src'],
            exclude: ['node_modules', 'dist']
        },
        null,
        2
    ),

    'vite.config.ts': `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [vue(), dts()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'MyVueCore',
      fileName: (format) => \`my-vue-core.\${format}.js\`
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
})`,

    '.gitignore': `node_modules
dist`,

    '.npmignore': `node_modules
src
vite.config.ts
tsconfig.json`,

    'src/index.ts': `export * from './composables/useExample'
export * from './services/ApiService'`,

    'src/composables/useExample.ts': `import { ref } from 'vue'

export function useExample() {
  const count = ref(0)
  const increment = () => count.value++
  return { count, increment }
}`,

    'src/services/ApiService.ts': `import axios from 'axios'

export const ApiService = {
  async getData(url: string) {
    const { data } = await axios.get(url)
    return data
  }
}`,

    'README.md': `# ${projectName}

Un core reutilizable para Vue 3.

## Instalación

\`\`\`sh
npm install @tu-usuario/${projectName}
\`\`\`

## Uso

\`\`\`ts
import { useExample } from '@tu-usuario/${projectName}'

const { count, increment } = useExample()
\`\`\`

## Licencia

MIT`
}

const createFolders = () => {
    folders.forEach((folder) => {
        const folderPath = path.join(basePath, folder)
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true })
        }
    })
}

const createFiles = () => {
    Object.entries(files).forEach(([fileName, content]) => {
        const filePath = path.join(basePath, fileName)
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, content, 'utf8')
        }
    })
}

createFolders()
createFiles()

console.log(`✅ Proyecto "${projectName}" creado con éxito en ${basePath}`)
console.log('📦 Ahora puedes correr:')
console.log(`   cd ${projectName}`)
console.log('   npm install')
console.log('   npm run build')
