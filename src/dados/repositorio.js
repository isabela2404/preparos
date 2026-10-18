// Camada de dados (RNF-09). As telas só conversam com este módulo, para que a
// origem dos dados possa trocar de serviço sem mexer no resto do app.
//
// Sem código do casal, tudo fica no aparelho: o caderno vem da carga
// empacotada e o estado vai para o localStorage. Com código, o Firestore
// passa a ser a fonte (./firestore.js) e o localStorage guarda uma cópia
// para o app abrir na hora, mesmo sem internet ou com o banco fora do ar
// (RNF-02).

import { calcularItens } from '../dominio/lista.js';
import cargaInicial from './carga-inicial.json';
import { aplicarMudancas, extrairCodigo, gerarCodigo } from './mudancas.js';

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
 * @typedef {'local' | 'sincronizado' | 'sincronizando' | 'offline' | 'erro'} Status
 */

export const sincronizacaoDisponivel = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID);

const CHAVE_ESTADO = 'caderno-de-preparos:estado';
const CHAVE_CODIGO = 'caderno-de-preparos:codigo';
const ESTADO_VAZIO = { planejador: {}, marcados: {} };

/** @type {{ caderno: Caderno, estado: Estado, status: Status, codigo: string | null }} */
let atual = {
  caderno: cargaInicial,
  estado: { ...ESTADO_VAZIO, ...ler(CHAVE_ESTADO, true) },
  status: 'local',
  codigo: ler(CHAVE_CODIGO),
};
let conexao = null;
const ouvintes = new Set();

function ler(chave, json = false) {
  try {
    const valor = localStorage.getItem(chave);
    return json ? JSON.parse(valor) : valor;
  } catch {
    return null;
  }
}

function guardar(chave, valor) {
  try {
    if (valor == null) localStorage.removeItem(chave);
    else localStorage.setItem(chave, typeof valor === 'string' ? valor : JSON.stringify(valor));
  } catch {
    // Sem armazenamento (navegação privada): vale só nesta sessão.
  }
}

function publicar(parcial) {
  atual = { ...atual, ...parcial };
  if (parcial.estado) guardar(CHAVE_ESTADO, atual.estado);
  ouvintes.forEach((ouvinte) => ouvinte(atual));
}

/** Chama `aoMudar({ caderno, estado, status, codigo })` agora e a cada mudança. Devolve a função que para. */
export function observar(aoMudar) {
  ouvintes.add(aoMudar);
  aoMudar(atual);
  return () => ouvintes.delete(aoMudar);
}

// ---------- Conexão ----------

async function conectar() {
  conexao?.desconectar();
  conexao = null;
  if (!atual.codigo || !sincronizacaoDisponivel) {
    publicar({ status: 'local', caderno: cargaInicial });
    return;
  }
  publicar({ status: navigator.onLine ? 'sincronizando' : 'offline' });
  const firestore = await import('./firestore.js');
  conexao = firestore.conectar(atual.codigo, cargaInicial, {
    // Categorias e setores ficam no código; do banco vêm receitas e ingredientes.
    aoMudarCaderno: (dados) => publicar({ caderno: { ...cargaInicial, ...dados } }),
    aoMudarEstado: (estado) => publicar({ estado }),
    aoMudarStatus: (status) => publicar({ status }),
  });
}

addEventListener('offline', () => conexao && publicar({ status: 'offline' }));
addEventListener('online', () => conexao && publicar({ status: 'sincronizando' }));

// Outra aba do mesmo aparelho mudou o estado (no modo local; com o banco, o Firestore avisa).
addEventListener('storage', (evento) => {
  if (evento.key === CHAVE_ESTADO && !conexao) publicar({ estado: { ...ESTADO_VAZIO, ...ler(CHAVE_ESTADO, true) } });
});

conectar();

// ---------- Código do casal ----------

/** Cria o caderno compartilhado a partir deste aparelho, levando o planejador e a lista atuais. */
export async function criarCasal() {
  if (!navigator.onLine) throw new Error('Precisa de internet para criar o código.');
  const codigo = gerarCodigo();
  const firestore = await import('./firestore.js');
  await firestore.criarCasal(codigo, cargaInicial, atual.estado);
  guardar(CHAVE_CODIGO, codigo);
  publicar({ codigo });
  await conectar();
}

/** Passa a usar o caderno de outro aparelho. O planejador deste aparelho é substituído pelo de lá. */
export async function entrarNoCasal(texto) {
  const codigo = extrairCodigo(texto);
  if (!codigo) throw new Error('Esse código não parece certo. Ele tem 32 letras e números.');
  if (codigo === atual.codigo) return;
  if (!navigator.onLine) throw new Error('Precisa de internet para entrar com o código.');
  const firestore = await import('./firestore.js');
  if (!(await firestore.casalExiste(codigo))) throw new Error('Não achei nenhum caderno com esse código.');
  guardar(CHAVE_CODIGO, codigo);
  publicar({ codigo });
  await conectar();
}

// ---------- Planejador e lista ----------
// Cada operação vira uma lista de mudanças de campo: aplica aqui na hora e
// manda o mesmo para o banco.

function mudar(mudancas) {
  publicar({ estado: aplicarMudancas(atual.estado, mudancas) });
  conexao?.gravar(mudancas);
}

/** RN-06: porções de 1 a 99; 0 tira a receita do planejador. */
export function definirPorcoes(receitaId, porcoes) {
  const valor = porcoes >= 1 ? Math.min(99, Math.round(porcoes)) : null;
  const mudancas = [{ campo: ['planejador', receitaId], valor }];
  if (valor == null) {
    // RN-07: marcações de itens que saem da lista não ficam guardadas.
    const { [receitaId]: _, ...planejador } = atual.estado.planejador;
    const naLista = new Set(
      calcularItens(planejador, atual.caderno.receitas, atual.caderno.ingredientes).map((i) => i.codigo),
    );
    for (const codigo of Object.keys(atual.estado.marcados)) {
      if (!naLista.has(codigo)) mudancas.push({ campo: ['marcados', codigo], valor: null });
    }
  }
  mudar(mudancas);
}

/** Soma `delta` às porções atuais; parte do valor gravado, então toques rápidos não se perdem. */
export function ajustarPorcoes(receitaId, delta) {
  definirPorcoes(receitaId, (atual.estado.planejador[receitaId] ?? 0) + delta);
}

/** RN-08: o Zerar do Planejador e da Lista apaga receitas, porções e marcações. */
export function zerarPlanejador() {
  mudar([
    { campo: ['planejador'], valor: {} },
    { campo: ['marcados'], valor: {} },
  ]);
}

/** `quantidade` null desmarca o item. */
export function definirMarcacao(codigo, quantidade) {
  mudar([{ campo: ['marcados', codigo], valor: quantidade }]);
}
