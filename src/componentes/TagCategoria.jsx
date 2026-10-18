import { CATEGORIA_POR_ID } from '../dominio/categorias.js';

export function TagCategoria({ categoria, curta = false }) {
  const c = CATEGORIA_POR_ID[categoria];
  if (!c) return null;
  return (
    <span class="tag" style={{ '--cor-categoria': c.cor }}>
      {curta ? (c.nomeCurto ?? c.nome) : c.nome}
    </span>
  );
}
