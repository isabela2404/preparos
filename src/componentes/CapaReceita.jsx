import { Beef, Carrot, CookingPot, CupSoda, Sandwich, Wheat } from 'lucide-preact';
import { CATEGORIA_POR_ID } from '../dominio/categorias.js';

const ICONES = {
  proteinas: Beef,
  'bases-graos': Wheat,
  legumes: Carrot,
  molhos: CookingPot,
  lanches: Sandwich,
  sucos: CupSoda,
};

export function IconeCategoria({ categoria, ...props }) {
  const Icone = ICONES[categoria] ?? CookingPot;
  return <Icone aria-hidden="true" {...props} />;
}

/** Foto da receita ou, enquanto não houver foto, o ícone da categoria sobre a cor dela. */
export function CapaReceita({ receita, class: classe = '' }) {
  const cor = CATEGORIA_POR_ID[receita.categoria]?.cor;
  return (
    <div class={`capa ${classe}`} style={{ '--cor-categoria': cor }}>
      {receita.foto ? (
        <img src={receita.foto} alt="" loading="lazy" decoding="async" />
      ) : (
        <IconeCategoria categoria={receita.categoria} class="capa-icone" strokeWidth={1.5} />
      )}
    </div>
  );
}
