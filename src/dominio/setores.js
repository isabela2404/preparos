// Setores do supermercado (RN-05), na ordem em que aparecem na lista de compras.
export const SETORES = [
  { id: 'acougue', nome: 'Açougue e Peixaria' },
  { id: 'hortifruti', nome: 'Hortifrúti' },
  { id: 'mercearia', nome: 'Mercearia e Grãos' },
  { id: 'frios', nome: 'Frios e Laticínios' },
  { id: 'temperos', nome: 'Temperos e Diversos' },
];

export const SETOR_POR_ID = Object.fromEntries(SETORES.map((s) => [s.id, s]));
