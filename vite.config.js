import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Caminhos relativos: funciona em usuario.github.io/<repositorio>/ sem
  // fixar o nome do repositório aqui.
  base: './',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Caderno de Preparos',
        short_name: 'Preparos',
        description: 'Preparos da quinzena, lista de compras e receitas do casal.',
        lang: 'pt-BR',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F1F4EE',
        theme_color: '#2A3A30',
        icons: [
          { src: 'icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icone-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // RNF-03: código, fontes, ícones e fotos ficam em cache para abrir offline.
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
});
