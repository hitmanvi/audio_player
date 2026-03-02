import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron/simple'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig(({ command }) => {
  const isBuild = command === 'build'

  return {
    plugins: [
      vue(),
      tailwindcss(),
      electron({
        main: {
          entry: 'electron/main/index.js',
          vite: {
            build: {
              outDir: 'dist-electron/main',
              minify: isBuild,
            },
          },
        },
        preload: {
          input: 'electron/preload/index.js',
          vite: {
            build: {
              outDir: 'dist-electron/preload',
              minify: isBuild,
            },
          },
        },
        renderer: {},
      }),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    clearScreen: false,
  }
})
