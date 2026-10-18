import { Search, X } from 'lucide-preact';

// RF-03: filtra enquanto se digita.
export function CampoBusca({ valor, aoMudar }) {
  return (
    <div class="busca">
      <Search size={20} aria-hidden="true" />
      <input
        type="search"
        placeholder="Buscar por nome ou ingrediente"
        aria-label="Buscar receita por nome ou ingrediente"
        enterkeyhint="search"
        value={valor}
        onInput={(e) => aoMudar(e.currentTarget.value)}
      />
      {valor && (
        <button type="button" aria-label="Limpar busca" onClick={() => aoMudar('')}>
          <X size={20} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
