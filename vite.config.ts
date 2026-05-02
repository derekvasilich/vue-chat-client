import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ command, mode }) => {
  const isWidget = mode === 'widget'

  if (isWidget) {
    return {
      plugins: [vue()],
      build: {
        lib: {
          entry: resolve(__dirname, 'src/index.ts'),
          name: 'AIChatWidget',
          formats: ['iife'],
          fileName: () => 'ai-chat-widget.js',
        },
        rollupOptions: {
          output: {
            inlineDynamicImports: true,
          },
        },
        outDir: 'dist/widget',
      },
    }
  }

  return {
    plugins: [vue()],
    root: 'example',
    envDir: __dirname,
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    build: {
      outDir: resolve(__dirname, 'dist/example'),
      emptyOutDir: true,
    },
    server: {
      port: 5173,
    },
  }
})
