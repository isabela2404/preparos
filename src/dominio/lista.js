import { SETORES } from './setores.js';
import { arredondarParaCompra, formatarQuantidade } from './unidades.js';

// A lista de compras nunca é gravada: sai sempre do planejador (seção 5).

/**
 * RN-01 e RN-02: para cada código de ingrediente, soma quantidade por porção ×
 * porções de todas as receitas do planejador. Itens "a gosto" entram na lista
 * sem somar quantidade.
 */
export function calcularItens(planejador, receitas, ingredientes) {
  const receitaPorId = new Map(receitas.map((r) => [r.id, r]));
  const itens = new Map();

  for (const [receitaId, porcoes] of Object.entries(planejador)) {
    const receita = receitaPorId.get(receitaId);
    if (!receita || !(porcoes > 0)) continue;

    for (const { ingrediente, qtdPorPorcao, aGosto } of receita.ingredientes) {
      const ing = ingredientes[ingrediente];
      if (!ing) continue;
      let item = itens.get(ingrediente);
      if (!item) {
        item = {
          codigo: ingrediente,
          nome: ing.nome,
          unidade: ing.unidade,
          setor: ing.setor,
          basico: Boolean(ing.basico),
          total: 0,
          aGosto: false,
          receitas: [],
        };
        itens.set(ingrediente, item);
      }
      if (aGosto) item.aGosto = true;
      else item.total += qtdPorPorcao * porcoes;
      if (!item.receitas.includes(receitaId)) item.receitas.push(receitaId);
    }
  }

  return [...itens.values()].map((item) => ({
    ...item,
    // RN-04: a lista mostra a quantidade arredondada para cima.
    qtdCompra: item.total > 0 ? arredondarParaCompra(item.total, item.unidade) : null,
  }));
}

/**
 * RN-07: a marcação guarda a quantidade que estava na lista quando o item foi
 * marcado. Se a quantidade subir depois, o item volta a ficar desmarcado.
 */
export function estaMarcado(item, marcados) {
  const marcada = marcados[item.codigo];
  return marcada != null && marcada >= (item.qtdCompra ?? 0);
}

/** Quantidade gravada ao marcar um item; itens só "a gosto" gravam 0. */
export const quantidadeAoMarcar = (item) => item.qtdCompra ?? 0;

export const GRUPO_DESPENSA = { id: 'despensa', nome: 'Confira na despensa' };

/**
 * RF-22 e RF-23: agrupa por setor na ordem do mercado, com os básicos (RN-10)
 * num grupo final. Dentro de cada grupo, os marcados vão para o fim.
 * Itens avulsos (RF-27) entram no setor escolhido, sem quantidade.
 */
export function agruparLista(itens, marcados, avulsos = {}) {
  const grupos = [...SETORES, GRUPO_DESPENSA].map((s) => ({ id: s.id, nome: s.nome, itens: [] }));
  const grupoPorId = Object.fromEntries(grupos.map((g) => [g.id, g]));

  for (const item of itens) {
    const grupo = item.basico ? grupoPorId.despensa : (grupoPorId[item.setor] ?? grupoPorId.despensa);
    grupo.itens.push({ ...item, marcado: estaMarcado(item, marcados) });
  }
  for (const [id, avulso] of Object.entries(avulsos)) {
    (grupoPorId[avulso.setor] ?? grupoPorId.temperos).itens.push({
      codigo: `avulso:${id}`,
      id,
      nome: avulso.nome,
      avulso: true,
      marcado: Boolean(avulso.marcado),
      qtdCompra: null,
      aGosto: false,
    });
  }

  return grupos
    .filter((g) => g.itens.length)
    .map((g) => ({
      ...g,
      itens: g.itens.sort((a, b) => a.marcado - b.marcado || a.nome.localeCompare(b.nome, 'pt-BR')),
      pendentes: g.itens.filter((i) => !i.marcado).length,
    }));
}

export function textoQuantidade(item) {
  if (item.avulso) return '';
  if (item.qtdCompra == null) return 'a gosto';
  const qtd = formatarQuantidade(item.qtdCompra, item.unidade);
  return item.aGosto ? `${qtd} + a gosto` : qtd;
}

/** RN-09 e RF-25: texto para o WhatsApp, só com os itens que faltam. */
export function textoWhatsApp(grupos) {
  const blocos = grupos
    .map((g) => ({ nome: g.nome, itens: g.itens.filter((i) => !i.marcado) }))
    .filter((b) => b.itens.length)
    .map((b) => [`*${b.nome}*`, ...b.itens.map((i) => `- ${i.nome}${i.avulso ? '' : `: ${textoQuantidade(i)}`}`)].join('\n'));
  return ['*Lista de compras*', ...blocos].join('\n\n');
}
