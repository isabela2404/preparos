import { CATEGORIAS, CATEGORIA_POR_ID } from './categorias.js';
import { SETORES, SETOR_POR_ID } from './setores.js';
import { UNIDADES } from './unidades.js';

// A soma da lista depende de um catálogo limpo (RN-02). Estas checagens pegam
// códigos de ingrediente desconhecidos e outros erros de cadastro antes que
// eles virem linhas duplicadas na lista de compras.

/** @returns {string[]} uma mensagem por problema encontrado; vazio quando a carga está correta */
export function validarCarga({ categorias, setores, ingredientes, receitas }) {
  const erros = [];

  // As cores e a ordem ficam no código; a carga só precisa usar os mesmos códigos.
  compararListas('categorias', categorias, CATEGORIAS, erros);
  compararListas('setores', setores, SETORES, erros);

  for (const [codigo, ing] of Object.entries(ingredientes)) erros.push(...validarIngrediente(codigo, ing));

  const ids = new Set();
  for (const r of receitas) {
    if (ids.has(r.id)) erros.push(`Receita "${r.id}" repetida`);
    ids.add(r.id);
    erros.push(...validarReceita(r, ingredientes));
  }

  return erros;
}

export function validarIngrediente(codigo, ing) {
  const erros = [];
  if (!ing.nome) erros.push(`Ingrediente "${codigo}" sem nome`);
  if (!UNIDADES.includes(ing.unidade)) erros.push(`Ingrediente "${codigo}" com unidade inválida: ${ing.unidade}`);
  if (!SETOR_POR_ID[ing.setor]) erros.push(`Ingrediente "${codigo}" com setor inválido: ${ing.setor}`);
  for (const [medida, fator] of Object.entries(ing.medidas ?? {})) {
    if (!(fator > 0)) erros.push(`Ingrediente "${codigo}" com fator inválido para ${medida}: ${fator}`);
  }
  return erros;
}

export function validarReceita(r, ingredientes) {
  const erros = [];
  const nome = `Receita "${r.id}"`;
  if (!r.nome) erros.push(`${nome} sem nome`);
  if (!CATEGORIA_POR_ID[r.categoria]) erros.push(`${nome} com categoria inválida: ${r.categoria}`);
  if (!Number.isInteger(r.porcoesPadrao) || r.porcoesPadrao < 1 || r.porcoesPadrao > 99) {
    erros.push(`${nome} com porções fora de 1 a 99: ${r.porcoesPadrao}`);
  }
  if (!r.ingredientes?.length) erros.push(`${nome} sem ingredientes`);
  if (!r.passos?.length) erros.push(`${nome} sem passos`);

  for (const item of r.ingredientes ?? []) {
    if (!ingredientes[item.ingrediente]) {
      erros.push(`${nome} usa ingrediente fora do catálogo: ${item.ingrediente}`);
    }
    // Itens "a gosto" (sal, pimenta) não têm quantidade; os demais precisam ter.
    const valido = item.aGosto ? item.qtdPorPorcao == null : item.qtdPorPorcao > 0;
    if (!valido) erros.push(`${nome} com quantidade inválida para ${item.ingrediente}: ${item.qtdPorPorcao}`);
  }
  return erros;
}

function compararListas(rotulo, daCarga, doCodigo, erros) {
  if (!daCarga) return;
  const naCarga = daCarga.map((x) => x.id).sort().join(', ');
  const noCodigo = doCodigo.map((x) => x.id).sort().join(', ');
  if (naCarga !== noCodigo) erros.push(`As ${rotulo} da carga (${naCarga}) não batem com as do app (${noCodigo})`);
}
