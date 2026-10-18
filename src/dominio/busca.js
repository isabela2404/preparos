/** Minúsculas e sem acento: "Almôndegas" e "almondegas" se encontram. */
export function normalizar(texto) {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/**
 * RF-03: busca por nome ou ingrediente. Cada palavra digitada precisa
 * aparecer em algum lugar da receita ("frango limao" acha o frango assado).
 */
export function filtrarPorBusca(receitas, ingredientes, termo) {
  const palavras = normalizar(termo).split(/\s+/).filter(Boolean);
  if (!palavras.length) return receitas;
  return receitas.filter((r) => {
    const texto = normalizar(
      [
        r.nome,
        ...r.ingredientes.map((i) => ingredientes[i.ingrediente]?.nome ?? ''),
        ...(r.ingredientesTexto ?? []),
      ].join(' '),
    );
    return palavras.every((p) => texto.includes(p));
  });
}
