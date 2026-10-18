// Uma mudança é { campo: ['planejador', 'arroz-integral'], valor: 6 }.
// valor null apaga o campo. O mesmo formato vira um updateDoc no Firestore,
// que grava só os campos tocados (seção 7: cada toque grava só o campo alterado).

/** Aplica as mudanças numa cópia do estado. */
export function aplicarMudancas(estado, mudancas) {
  const novo = structuredClone(estado);
  for (const { campo, valor } of mudancas) {
    const pai = campo.slice(0, -1).reduce((objeto, chave) => (objeto[chave] ??= {}), novo);
    const chave = campo.at(-1);
    if (valor == null) delete pai[chave];
    else pai[chave] = valor;
  }
  return novo;
}

// ---------- Código do casal ----------

// 24 bytes aleatórios em base64url: 32 caracteres, impossível de adivinhar.
export function gerarCodigo() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_');
}

/** Aceita o código puro ou o link inteiro de convite. */
export function extrairCodigo(texto) {
  return texto.match(/[A-Za-z0-9_-]{32,64}/g)?.at(-1) ?? null;
}
