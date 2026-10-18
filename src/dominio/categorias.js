// Categorias de receita (seção 8) e suas cores (seção 9).
// Café da manhã faz parte de Lanches Rápidos (decisão 1 da seção 10).
export const CATEGORIAS = [
  { id: 'proteinas', nome: 'Proteínas', cor: '#B3372B' },
  { id: 'bases-graos', nome: 'Bases, Grãos e Tubérculos', nomeCurto: 'Bases', cor: '#8C6A0A' },
  { id: 'legumes', nome: 'Legumes e Acompanhamentos', nomeCurto: 'Legumes', cor: '#2E7A40' },
  { id: 'molhos', nome: 'Molhos e Temperos Base', nomeCurto: 'Molhos', cor: '#BF5A0D' },
  { id: 'lanches', nome: 'Lanches Rápidos', nomeCurto: 'Lanches', cor: '#1F7A7A' },
  { id: 'sucos', nome: 'Sucos e Bebidas', nomeCurto: 'Bebidas', cor: '#A23B72' },
];

export const CATEGORIA_POR_ID = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c]));

const ORDEM = Object.fromEntries(CATEGORIAS.map((c, i) => [c.id, i]));

/** Receitas de uma categoria, ou de todas (null) agrupadas na ordem acima; dentro do grupo vale a ordem da carga. */
export function filtrarPorCategoria(receitas, categoria) {
  return categoria
    ? receitas.filter((r) => r.categoria === categoria)
    : receitas.toSorted((a, b) => ORDEM[a.categoria] - ORDEM[b.categoria]);
}
