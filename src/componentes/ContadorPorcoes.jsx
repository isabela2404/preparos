import { Minus, Plus, Trash2 } from 'lucide-preact';
import { ajustarPorcoes } from '../dados/repositorio.js';

// RF-12 e RN-06: mínimo 1 porção; tirar a última porção tira a receita do planejador.
export function ContadorPorcoes({ receita, porcoes }) {
  const ultima = porcoes <= 1;
  return (
    <div class="contador" role="group" aria-label={`Porções de ${receita.nome}`}>
      <button
        type="button"
        aria-label={ultima ? 'Tirar do planejador' : 'Uma porção a menos'}
        onClick={() => ajustarPorcoes(receita.id, -1)}
      >
        {ultima ? <Trash2 size={20} aria-hidden="true" /> : <Minus size={22} aria-hidden="true" />}
      </button>
      <output key={porcoes} class="contador-valor" aria-live="polite">
        {porcoes}
      </output>
      <button
        type="button"
        aria-label="Uma porção a mais"
        disabled={porcoes >= 99}
        onClick={() => ajustarPorcoes(receita.id, 1)}
      >
        <Plus size={22} aria-hidden="true" />
      </button>
    </div>
  );
}
