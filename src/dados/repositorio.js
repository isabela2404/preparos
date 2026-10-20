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
 *   passos: string[], vira: string,
 *   fonte?: string                      // link do post ou de onde veio a receita
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
 *   marcados: Record<string, number>,    // ingrediente → quantidade na lista quando foi marcado (RN-07)
 *   avulsos: Record<string, { nome: string, setor: string, marcado: boolean }>  // RF-27
 * }} Estado
 * @typedef {'local' | 'sincronizado' | 'sincronizando' | 'offline' | 'erro' | 'substituido'} Status
 */

export const sincronizacaoDisponivel = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID);

const CHAVE_ESTADO = 'caderno-de-preparos:estado';
const CHAVE_CODIGO = 'caderno-de-preparos:codigo';
const ESTADO_VAZIO = { planejador: {}, marcados: {}, avulsos: {} };

/** @type {{ caderno: Caderno, estado: Estado, status: Status, codigo: string | null, fotos: Record<string, string> }} */
let atual = {
  caderno: cargaInicial,
  fotos: {},
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
    publicar({ status: 'local', caderno: cargaInicial, fotos: {} });
    return;
  }
  publicar({ status: navigator.onLine ? 'sincronizando' : 'offline' });
  const firestore = await import('./firestore.js');
  conexao = firestore.conectar(atual.codigo, {
    // Categorias e setores ficam no código; do banco vêm receitas e ingredientes.
    aoMudarCaderno: (dados) => publicar({ caderno: { ...cargaInicial, ...dados } }),
    aoMudarEstado: (estado) => publicar({ estado: { ...ESTADO_VAZIO, ...estado } }),
    aoMudarStatus: (status) => publicar({ status }),
    aoMudarFotos: (fotos) => publicar({ fotos }),
  });
}

const podeTrocarStatus = () => conexao && atual.status !== 'substituido';
addEventListener('offline', () => podeTrocarStatus() && publicar({ status: 'offline' }));
addEventListener('online', () => podeTrocarStatus() && publicar({ status: 'sincronizando' }));

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

/**
 * Troca o código do casal, caso o atual tenha vazado. Copia receitas,
 * ingredientes e estado para um código novo e só então esvazia o antigo.
 * O outro celular passa a ver "código trocado" e precisa entrar com o novo.
 */
export async function gerarNovoCodigo() {
  if (!navigator.onLine) throw new Error('Precisa de internet para trocar o código.');
  const antigo = atual.codigo;
  const novo = gerarCodigo();
  const firestore = await import('./firestore.js');
  await firestore.criarCasal(novo, exportarCaderno(), atual.estado);
  await firestore.copiarFotos(antigo, novo);
  await firestore.encerrarCasal(antigo);
  guardar(CHAVE_CODIGO, novo);
  publicar({ codigo: novo });
  await conectar();
}

/** Passa a usar o caderno de outro aparelho. O planejador deste aparelho é substituído pelo de lá. */
export async function entrarNoCasal(texto) {
  const codigo = extrairCodigo(texto);
  if (!codigo) throw new Error('Esse código não parece certo. Ele tem 32 letras e números.');
  if (codigo === atual.codigo && atual.status !== 'substituido') return;
  if (!navigator.onLine) throw new Error('Precisa de internet para entrar com o código.');
  const firestore = await import('./firestore.js');
  const situacao = await firestore.situacaoDoCasal(codigo);
  if (situacao === 'trocado') throw new Error('Esse código foi trocado. Peça o código novo ao outro celular.');
  if (situacao === 'inexistente') throw new Error('Não achei nenhum caderno com esse código.');
  guardar(CHAVE_CODIGO, codigo);
  publicar({ codigo });
  await conectar();
}

// ---------- Planejador e lista ----------
// Cada operação vira uma lista de mudanças de campo: aplica aqui na hora e
// manda o mesmo para o banco.

function mudar(mudancas) {
  publicar({ estado: aplicarMudancas(atual.estado, mudancas) });
  // Código trocado no outro celular: não grava mais no espaço antigo.
  if (atual.status !== 'substituido') conexao?.gravar(mudancas);
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

/** RN-08: o Zerar do Planejador e da Lista apaga receitas, porções, marcações e avulsos. */
export function zerarPlanejador() {
  mudar([
    { campo: ['planejador'], valor: {} },
    { campo: ['marcados'], valor: {} },
    { campo: ['avulsos'], valor: {} },
  ]);
}

/** `quantidade` null desmarca o item. */
export function definirMarcacao(codigo, quantidade) {
  mudar([{ campo: ['marcados', codigo], valor: quantidade }]);
}

// ---------- Itens avulsos (RF-27) ----------

export function adicionarAvulso(nome, setor) {
  const id = `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  mudar([{ campo: ['avulsos', id], valor: { nome: nome.trim(), setor, marcado: false } }]);
}

export function marcarAvulso(id, marcado) {
  mudar([{ campo: ['avulsos', id, 'marcado'], valor: marcado }]);
}

export function removerAvulso(id) {
  mudar([{ campo: ['avulsos', id], valor: null }]);
}

// ---------- Cadastro de receitas e ingredientes ----------
// Só com o caderno compartilhado: as receitas moram no banco (RF-31). As telas
// só oferecem estas operações quando há código do casal.

/** Grava a receita e os ingredientes novos que ela trouxe. */
export function salvarReceita(receita, novosIngredientes = {}) {
  const ordens = atual.caderno.receitas.map((r) => r.ordem ?? 0);
  const anterior = atual.caderno.receitas.find((r) => r.id === receita.id);
  conexao.salvarReceita({ ...receita, ordem: anterior?.ordem ?? Math.max(-1, ...ordens) + 1 }, novosIngredientes);
}

export function apagarReceita(id) {
  if (atual.estado.planejador[id] != null) definirPorcoes(id, 0);
  conexao.apagarReceita(id);
}

/** Foto já reduzida (ver imagem.js). Fica numa coleção própria, fora da receita. */
export function salvarFoto(receitaId, blob) {
  return conexao.salvarFoto(receitaId, blob);
}

export function removerFoto(receitaId) {
  conexao.removerFoto(receitaId);
}

export function salvarIngrediente(id, ingrediente) {
  conexao.salvarIngrediente(id, ingrediente);
}

export function apagarIngrediente(id) {
  conexao.apagarIngrediente(id);
}

/** Cópia de segurança no formato da carga inicial (RNF-08). */
export function exportarCaderno() {
  const { caderno } = atual;
  return {
    versao: cargaInicial.versao,
    categorias: cargaInicial.categorias,
    setores: cargaInicial.setores,
    ingredientes: Object.fromEntries(Object.entries(caderno.ingredientes).sort(([a], [b]) => a.localeCompare(b))),
    receitas: caderno.receitas.map(({ ordem: _, ...receita }) => receita),
  };
}
