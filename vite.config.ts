import { defineConfig } from 'vite'
export default defineConfig({
    build: {
        lib: {
            entry: ['src/index.ts'],
            name: 'interceptor',
            formats: ['es', 'cjs', 'umd']
        },
        emptyOutDir: false,
    }
})