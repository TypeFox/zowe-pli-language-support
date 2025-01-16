import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({}) => {
    return {
        build: {
            target: 'ES2022',
            rollupOptions: {
                input: {
                    index: path.resolve(__dirname, 'index.html')
                }
            },
            emptyOutDir: false,
            assetsInlineLimit: 0,
            outDir: path.resolve(__dirname, 'out')
        },
        worker: {
            format: 'es'
        },
        esbuild: {
            minifySyntax: false
        }
    };
});
