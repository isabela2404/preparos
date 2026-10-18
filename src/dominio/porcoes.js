import { NOME_MEDIDA } from './edicao.js';
import { formatarFracao, formatarQuantidade } from './unidades.js';

// RF-05: a receita para um número de porções escolhido, sem mexer no
// planejador. Usa a lista estruturada de ingredientes; o texto original da
// receita é livre e não dá para recalcular com segurança.

const PLURAL = {
  'colher de sopa': 'colheres de sopa',
  'colher de chá': 'colheres de chá',
  xícara: 'xícaras',
  unidade: 'unidades',
  'unidade pequena': 'unidades pequenas',
  dente: 'dentes',
  maço: 'maços',
  punhado: 'punhados',
};

// A conta "fecha" quando dá um múltiplo de ¼ da medida, com até 5% de folga.
const FOLGA = 0.05;

/**
 * Medida caseira do catálogo em que a quantidade fica redonda (15 g de alho
 * = 3 dentes). Prefere contar a partir de 1 ("2 colheres de sopa" em vez de
 * "¼ de xícara") e, entre essas, a medida maior. Null se nenhuma fecha.
 */
export function medidaCaseira(total, ingrediente) {
  const candidatas = Object.entries(ingrediente?.medidas ?? {})
    .filter(([medida]) => NOME_MEDIDA[medida])
    .map(([medida, fator]) => {
      const exata = total / fator;
      return { medida, fator, exata, quantidade: Math.round(exata * 4) / 4 };
    })
    .filter((c) => c.quantidade >= 0.25 && c.quantidade <= 20 && Math.abs(c.exata - c.quantidade) <= FOLGA * c.exata);
  candidatas.sort((a, b) => (b.quantidade >= 1) - (a.quantidade >= 1) || b.fator - a.fator);
  return candidatas[0] ?? null;
}

function textoMedida({ medida, quantidade }) {
  const nome = NOME_MEDIDA[medida];
  if (quantidade < 1) return `${formatarFracao(quantidade)} de ${nome}`;
  return `${formatarFracao(quantidade)} ${quantidade === 1 ? nome : PLURAL[nome]}`;
}

/** "3 dentes (15 g)" quando há medida caseira redonda; senão só a unidade base. */
export function textoQuantidadeCozinha(total, ingrediente) {
  if (total == null) return 'a gosto';
  const base = formatarQuantidade(total, ingrediente.unidade);
  const caseira = medidaCaseira(total, ingrediente);
  return caseira ? `${textoMedida(caseira)} (${base})` : base;
}

/** Ingredientes da receita para `porcoes` porções. */
export function ingredientesPara(receita, ingredientes, porcoes) {
  return receita.ingredientes.map(({ ingrediente, qtdPorPorcao, aGosto }) => {
    const ing = ingredientes[ingrediente];
    const total = aGosto ? null : qtdPorPorcao * porcoes;
    return {
      codigo: ingrediente,
      nome: ing?.nome ?? ingrediente,
      setor: ing?.setor,
      quantidade: ing ? textoQuantidadeCozinha(total, ing) : String(total),
    };
  });
}
