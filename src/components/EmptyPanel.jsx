// Empty state ilustrado: imagem da Copa no fundo + bloco sólido com a mensagem.
// Usado quando uma tela inteira não tem nada a mostrar (Jogos sem matches, Ranking sem pontuação).
export default function EmptyPanel({ titulo, mensagem, imagem = '/empty-hero.webp' }) {
  return (
    <div
      className="relative rounded-xl overflow-hidden min-h-[220px] sm:min-h-[260px] bg-ink bg-cover bg-center flex items-center justify-center p-6 sm:p-8"
      style={{ backgroundImage: `url(${imagem})` }}
    >
      {/* Scrim escuro pra suavizar o gradiente atrás do bloco. */}
      <div className="absolute inset-0 bg-ink/40" aria-hidden="true" />

      {/* Bloco sólido por cima — garante contraste do texto (DESIGN.md §5). */}
      <div className="relative bg-cloud rounded-lg shadow-hard p-6 text-center max-w-sm">
        <h2 className="font-display text-2xl sm:text-3xl tracking-tight text-ink">
          {titulo}
        </h2>
        <p className="mt-2 text-slate text-sm">{mensagem}</p>
      </div>
    </div>
  )
}
