// Camada de dados (RNF-09). As telas só conversam com este módulo, para que a
// origem dos dados possa trocar de serviço sem mexer no resto do app.
//
// Fase 1: lê a carga inicial que vai empacotada no app.
// Fase 3: lê e grava no Firestore, usando a carga inicial para popular o banco
// na primeira vez. O formato devolvido continua o mesmo.

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
 */

/** @returns {Promise<Caderno>} */
export async function carregarCaderno() {
  return cargaInicial;
}
