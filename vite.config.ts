import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        qrCodeGenerator: resolve(root, 'qr-code-generator/index.html'),
        barcodeGenerator: resolve(root, 'barcode-generator/index.html'),
        batchBarcodeGenerator: resolve(root, 'batch-barcode-generator/index.html'),
        barcodeApi: resolve(root, 'barcode-api/index.html'),
        barcodeTypes: resolve(root, 'barcode-types/index.html'),
        guides: resolve(root, 'guides/index.html'),
      },
    },
  },
})
