import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
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

/** Fotos do caderno compartilhado: receita → endereço local da imagem. */
export const FotosContext = createContext({});

/** Foto da receita: a enviada pelo app ou, nas antigas, o arquivo do repositório. */
export const useFoto = (receita) => useContext(FotosContext)[receita.id] ?? receita.foto;

export function IconeCategoria({ categoria, ...props }) {
  const Icone = ICONES[categoria] ?? CookingPot;
  return <Icone aria-hidden="true" {...props} />;
}

/**
 * Foto da receita ou, enquanto não houver foto, o ícone da categoria sobre a
 * cor dela. `foto` substitui a do caderno (prévia no editor; null = sem foto).
 */
export function CapaReceita({ receita, foto, class: classe = '' }) {
  const doCaderno = useFoto(receita);
  const exibida = foto === undefined ? doCaderno : foto;
  const cor = CATEGORIA_POR_ID[receita.categoria]?.cor;
  return (
    <div class={`capa ${classe}`} style={{ '--cor-categoria': cor }}>
      {exibida ? (
        <img src={exibida} alt="" loading="lazy" decoding="async" />
      ) : (
        <IconeCategoria categoria={receita.categoria} class="capa-icone" strokeWidth={1.5} />
      )}
    </div>
  );
}
