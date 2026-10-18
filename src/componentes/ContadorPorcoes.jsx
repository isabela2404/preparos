import { Minus, Plus, Trash2 } from 'lucide-preact';
import { ajustarPorcoes } from '../dados/repositorio.js';

/** Contador − / + de 1 a 99. `aoMudar(delta)`; `iconeMenos` troca o − (e libera o toque em 1). */
export function Contador({ valor, aoMudar, rotulo, rotuloMenos = 'Uma porção a menos', iconeMenos = null }) {
  return (
    <div class="contador" role="group" aria-label={rotulo}>
      <button type="button" aria-label={rotuloMenos} disabled={valor <= 1 && !iconeMenos} onClick={() => aoMudar(-1)}>
        {iconeMenos ?? <Minus size={22} aria-hidden="true" />}
      </button>
      <output key={valor} class="contador-valor" aria-live="polite">
        {valor}
      </output>
      <button type="button" aria-label="Uma porção a mais" disabled={valor >= 99} onClick={() => aoMudar(1)}>
        <Plus size={22} aria-hidden="true" />
      </button>
    </div>
  );
}

// RF-12 e RN-06: mínimo 1 porção; tirar a última porção tira a receita do planejador.
export function ContadorPorcoes({ receita, porcoes }) {
  const ultima = porcoes <= 1;
  return (
    <Contador
      valor={porcoes}
      rotulo={`Porções de ${receita.nome}`}
      rotuloMenos={ultima ? 'Tirar do planejador' : 'Uma porção a menos'}
      iconeMenos={ultima ? <Trash2 size={20} aria-hidden="true" /> : null}
      aoMudar={(delta) => ajustarPorcoes(receita.id, delta)}
    />
  );
}
