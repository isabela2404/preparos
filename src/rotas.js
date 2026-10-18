import { useEffect, useState } from 'preact/hooks';

// Rotas por hash (#/receita/x): o GitHub Pages serve um único index.html e
// não sabe redirecionar caminhos desconhecidos para ele.

export function interpretarRota(hash) {
  const [tela, id, acao, extra] = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (tela === 'receita' && id) {
    const rota = { tela: 'receita', id: decodeURIComponent(id) };
    if (acao === 'editar') return { ...rota, tela: 'editar' };
    // #/receita/<id>/cozinha/12 abre o modo cozinha com as quantidades para 12 porções (RF-05).
    if (acao === 'cozinha') return { ...rota, tela: 'cozinha', porcoes: Number(extra) || null };
    return rota;
  }
  if (tela === 'nova-receita') return { tela: 'editar', id: null };
  // Link de convite que o outro celular manda: #/entrar/<código do casal>.
  if (tela === 'entrar' && id) return { tela: 'ajustes', convite: id };
  if (['planejador', 'lista', 'ajustes', 'ingredientes'].includes(tela)) return { tela };
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
