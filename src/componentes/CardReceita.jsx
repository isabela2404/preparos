import { Clock, Users } from 'lucide-preact';
import { linkReceita } from '../rotas.js';
import { CapaReceita } from './CapaReceita.jsx';
import { TagCategoria } from './TagCategoria.jsx';

export function CardReceita({ receita }) {
  return (
    <a class="card" href={linkReceita(receita.id)}>
      <CapaReceita receita={receita} />
      <div class="card-corpo">
        <TagCategoria categoria={receita.categoria} curta />
        <h2 class="card-nome">{receita.nome}</h2>
        <p class="card-meta">
          <span>
            <Clock size={16} aria-hidden="true" /> {receita.tempo}
          </span>
          <span>
            <Users size={16} aria-hidden="true" /> {receita.porcoesPadrao}
            <span class="so-leitor"> porções</span>
          </span>
        </p>
      </div>
    </a>
  );
}
