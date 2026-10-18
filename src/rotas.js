import { useEffect, useState } from 'preact/hooks';

// Rotas por hash (#/receita/x): o GitHub Pages serve um único index.html e
// não sabe redirecionar caminhos desconhecidos para ele.

export function interpretarRota(hash) {
  const [tela, id] = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (tela === 'receita' && id) return { tela: 'receita', id: decodeURIComponent(id) };
  // Link de convite que o outro celular manda: #/entrar/<código do casal>.
  if (tela === 'entrar' && id) return { tela: 'ajustes', convite: id };
  if (tela === 'planejador' || tela === 'lista' || tela === 'ajustes') return { tela };
  return { tela: 'caderno' };
}

export const linkReceita = (id) => `#/receita/${encodeURIComponent(id)}`;

let navegouDentroDoApp = false;

export function useRota() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const aoMudar = () => {
      navegouDentroDoApp = true;
      setHash(location.hash);
    };
    addEventListener('hashchange', aoMudar);
    return () => removeEventListener('hashchange', aoMudar);
  }, []);
  return interpretarRota(hash);
}

/** Volta uma tela; se o app abriu direto num link de receita, vai para o Caderno. */
export function voltar() {
  if (navegouDentroDoApp) history.back();
  else location.replace('#/');
}
