// Unidades base (RN-03) e arredondamento para compra (RN-04).
export const UNIDADES = ['g', 'ml', 'un'];

// Folga para erros de ponto flutuante: 0,1 × 3 dá 0,30000000000000004.
const EPSILON = 1e-9;

const formatadores = new Map();
function formatarNumero(valor, casas) {
  if (!formatadores.has(casas)) {
    formatadores.set(casas, new Intl.NumberFormat('pt-BR', { maximumFractionDigits: casas }));
  }
  return formatadores.get(casas).format(valor);
}

// Por porção, itens contados viram frações (1 ovo para 8 porções = ⅛).
const FRACOES = [
  [1 / 8, '⅛'], [1 / 6, '⅙'], [1 / 4, '¼'], [1 / 3, '⅓'], [3 / 8, '⅜'], [1 / 2, '½'],
  [5 / 8, '⅝'], [2 / 3, '⅔'], [3 / 4, '¾'], [5 / 6, '⅚'], [7 / 8, '⅞'],
];
// A carga guarda 4 casas (1/3 vira 0,3333), então a comparação é folgada.
const FOLGA_FRACAO = 1e-3;

function formatarContagem(valor) {
  const inteiro = Math.floor(valor + FOLGA_FRACAO);
  const resto = valor - inteiro;
  if (resto < FOLGA_FRACAO) return String(inteiro);
  const fracao = FRACOES.find(([f]) => Math.abs(f - resto) < FOLGA_FRACAO)?.[1];
  if (!fracao) return formatarNumero(valor, 2);
  return inteiro ? `${inteiro}${fracao}` : fracao;
}

// Em kg e L, duas casas arredondadas para cima: 1405 g vira 1,41 kg, nunca 1,4 (RN-04).
const emMilhares = (valor) => formatarNumero(Math.ceil(valor / 10 - EPSILON) / 100, 2);

/** Exibe uma quantidade na unidade base, convertendo g → kg e ml → L a partir de 1000 (RN-03). */
export function formatarQuantidade(valor, unidade) {
  switch (unidade) {
    case 'g':
      return valor >= 1000 ? `${emMilhares(valor)} kg` : `${formatarNumero(valor, 1)} g`;
    case 'ml':
      return valor >= 1000 ? `${emMilhares(valor)} L` : `${formatarNumero(valor, 1)} ml`;
    case 'un':
      return `${formatarContagem(valor)} ${valor < 2 ? 'unidade' : 'unidades'}`;
    default:
      throw new Error(`Unidade desconhecida: ${unidade}`);
  }
}

const MULTIPLO_DE_COMPRA = { g: 5, ml: 10, un: 1 };

/** Arredonda para cima no múltiplo útil da unidade, nunca abaixo do necessário (RN-04). */
export function arredondarParaCompra(valor, unidade) {
  const multiplo = MULTIPLO_DE_COMPRA[unidade];
  if (!multiplo) throw new Error(`Unidade desconhecida: ${unidade}`);
  return Math.ceil(valor / multiplo - EPSILON) * multiplo;
}
