/** @type {import('tailwindcss').Config} */
// Tokens espelham o DESIGN.md (paleta Copa 2026, raios, sombras, tipografia).
// Mudou aqui? Atualizar DESIGN.md junto pra não desincronizar.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],

  // Classes montadas em runtime (ex.: `bg-${cor}` em badges de grupo) precisam
  // estar no safelist — senão o purge do build remove e o estilo somem em produção.
  safelist: [
    'bg-teal',
    'bg-verde',
    'bg-amarelo',
    'bg-laranja',
    'bg-vermelho',
    'bg-vinho',
    'bg-roxo',
    'bg-azul',
  ],

  theme: {
    extend: {
      colors: {
        // Base / neutros
        ink: '#161618',
        paper: '#FAF6EE',
        cloud: '#FFFFFF',
        slate: '#6E6A66',
        line: '#E7E1D6',

        // Marca / destaque (8 cores da Copa)
        verde: { DEFAULT: '#00A859', dark: '#00824A' },
        teal: '#2BD9B0',
        amarelo: '#FFD23F',
        laranja: '#FF7A00',
        vermelho: '#E63329',
        vinho: '#8B1E2D',
        roxo: '#7B2FBE',
        azul: '#2D5BFF',

        // Ouro (exclusivo do 1º lugar / campeão)
        ouro: { DEFAULT: '#C28A1E', text: '#5C3F08' },

        // CazéTV — botão "Assistir". Vinho próprio (cor de AÇÃO), distinto do
        // `vinho` de badge de grupo e do `vermelho` do selo ao vivo, pra não
        // confundir status com ação. `dark` = hover.
        caze: { DEFAULT: '#7C2D3A', dark: '#641F2B' },
      },

      fontFamily: {
        // Display = títulos grandes, placar em destaque, posição no ranking.
        display: ['Anton', 'sans-serif'],
        // UI = corpo, tabelas, formulários.
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
      },

      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        pill: '999px',
      },

      boxShadow: {
        // Card padrão.
        soft: '0 2px 8px rgba(22,22,24,.08)',
        // Assinatura retrô do projeto — usar com moderação (CTAs e badges de destaque).
        hard: '4px 4px 0 #161618',
      },

      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },

      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
      },
    },
  },

  plugins: [],
}
