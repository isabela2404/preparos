// Planejador e Lista chegam na fase 2 do roadmap.
export function EmBreve({ titulo, Icone }) {
  return (
    <main class="conteudo vazio">
      <Icone size={48} strokeWidth={1.5} aria-hidden="true" />
      <h1 class="topo-titulo">{titulo}</h1>
      <p>Chega na próxima fase.</p>
    </main>
  );
}
