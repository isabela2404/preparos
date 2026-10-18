// Camada de dados (RNF-09). As telas só conversam com este módulo, para que a
// origem dos dados possa trocar de serviço sem mexer no resto do app.
//
// Hoje: o caderno vem da carga inicial empacotada no app, e o estado do
// planejador e da lista fica no aparelho (localStorage).
// Fase 3: os dois passam para o Firestore, com a carga inicial populando o
// banco na primeira vez. As funções abaixo mantêm o mesmo formato.

import cargaInicial from './carga-inicial.json';

/**
 * @typedef {'g' | 'ml' | 'un'} Unidade
 * @typedef {{
 *   nome: string, unidade: Unidade, setor: string,
 *   medidas?: Record<string, number>,  // medida caseira → quantidade na unidade base
 *   basico?: boolean                   // item de despensa, como sal e pimenta
 * }} Ingrediente
 * @typedef {{ ingrediente: string, qtdPorPorcao: number | null, aGosto?: boolean }} ItemReceita
 * @typedef {{
 *   id: string, nome: string, categoria: string, tags: string[], foto: string | null,
 *   porcoesPadrao: number, descricaoPorcao: string, rendimentoOriginal: string, tempo: string,
 *   conservacao: Record<string, string>,  // local → prazo, ex.: { Geladeira: '4 dias' }
 *   ingredientes: ItemReceita[],          // quantidades por porção, para a lista
 *   ingredientesTexto: string[],          // a receita inteira como foi escrita
 *   passos: string[], vira: string
 * }} Receita
 * @typedef {{
 *   versao: number,
 *   categorias: { id: string, nome: string }[],
 *   setores: { id: string, nome: string }[],
 *   ingredientes: Record<string, Ingrediente>,
 *   receitas: Receita[]
 * }} Caderno
 * @typedef {{
 *   planejador: Record<string, number>,  // receita → porções
 *   marcados: Record<string, number>     // ingrediente → quantidade na lista quando foi marcado (RN-07)
 * }} Estado
 */

/** @returns {Promise<Caderno>} */
export async function carregarCaderno() {
  return cargaInicial;
}

// ---------- Estado do planejador e da lista ----------

const CHAVE = 'caderno-de-preparos:estado';
const ESTADO_VAZIO = { planejador: {}, marcados: {} };

let estado = lerDoAparelho();
const ouvintes = new Set();

function lerDoAparelho() {
  try {
    return { ...ESTADO_VAZIO, ...JSON.parse(localStorage.getItem(CHAVE)) };
  } catch {
    return ESTADO_VAZIO;
  }
}

function publicar(novo) {
  estado = novo;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    // Sem armazenamento (navegação privada): o estado vale só nesta sessão.
  }
  ouvintes.forEach((ouvinte) => ouvinte(estado));
}

// Outra aba do mesmo aparelho mudou o estado.
addEventListener('storage', (evento) => {
  if (evento.key !== CHAVE) return;
  estado = lerDoAparelho();
  ouvintes.forEach((ouvinte) => ouvinte(estado));
});

/** Chama `aoMudar` agora e a cada mudança. Devolve a função que para de observar. */
export function observarEstado(aoMudar) {
  ouvintes.add(aoMudar);
  aoMudar(estado);
  return () => ouvintes.delete(aoMudar);
}

// Cada operação mexe num campo só, como será no Firestore (seção 7).

/** RN-06: porções de 1 a 99; 0 tira a receita do planejador. */
export function definirPorcoes(receitaId, porcoes) {
  const { [receitaId]: _, ...outras } = estado.planejador;
  const planejador = porcoes >= 1 ? { ...outras, [receitaId]: Math.min(99, Math.round(porcoes)) } : outras;
  publicar({ ...estado, planejador });
}

/** Soma `delta` às porções atuais; parte do valor gravado, então toques rápidos não se perdem. */
export function ajustarPorcoes(receitaId, delta) {
  definirPorcoes(receitaId, (estado.planejador[receitaId] ?? 0) + delta);
}

/** RN-08: zerar o planejador esvazia a lista, então as marcações também saem. */
export function zerarPlanejador() {
  publicar({ ...estado, planejador: {}, marcados: {} });
}

/** `quantidade` null desmarca o item. */
export function definirMarcacao(codigo, quantidade) {
  const { [codigo]: _, ...outros } = estado.marcados;
  const marcados = quantidade == null ? outros : { ...outros, [codigo]: quantidade };
  publicar({ ...estado, marcados });
}

export function removerMarcacoes(codigos) {
  const marcados = { ...estado.marcados };
  codigos.forEach((codigo) => delete marcados[codigo]);
  publicar({ ...estado, marcados });
}

/** RF-26: limpa as marcações sem mexer no planejador. */
export function zerarMarcacoes() {
  publicar({ ...estado, marcados: {} });
}
