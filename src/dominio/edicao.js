import { normalizar } from './busca.js';

// Conversão entre a receita gravada e o formulário de edição. No formulário,
// as quantidades são da receita inteira e podem estar em medida caseira; na
// receita gravada, ficam por porção e na unidade base (RN-03).

export const NOME_MEDIDA = {
  cs: 'colher de sopa',
  cc: 'colher de chá',
  xic: 'xícara',
  un: 'unidade',
  peq: 'unidade pequena',
  dente: 'dente',
  maco: 'maço',
  punhado: 'punhado',
};

export const NOME_UNIDADE = { g: 'gramas', ml: 'ml', un: 'unidades' };

const arredondar = (n, casas) => Math.round(n * 10 ** casas) / 10 ** casas;
const linhas = (texto) =>
  texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

let ultimaChave = 0;
/** Chave estável para as linhas de ingrediente no formulário. */
export const novaChave = () => ++ultimaChave;

/** Código a partir do nome ("Pão de queijo" → "pao-de-queijo"), sem repetir os existentes. */
export function gerarId(nome, existentes) {
  const base =
    normalizar(nome)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'item';
  let id = base;
  for (let n = 2; existentes.has(id); n++) id = `${base}-${n}`;
  return id;
}

const FRACOES = { '½': ' 1/2', '¼': ' 1/4', '¾': ' 3/4', '⅓': ' 1/3', '⅔': ' 2/3' };

/** Aceita "1,5", "1.5", "1/2", "1 1/2" e "1½". Devolve NaN se não for número. */
export function lerNumero(texto) {
  const t = String(texto)
    .replace(/[½¼¾⅓⅔]/g, (f) => FRACOES[f])
    .replace(',', '.')
    .trim();
  const fracao = t.match(/^(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)$/);
  if (fracao) return Number(fracao[1] ?? 0) + Number(fracao[2]) / Number(fracao[3]);
  return t && /^\d*\.?\d+$/.test(t) ? Number(t) : NaN;
}

const paraCampo = (n) => String(n).replace('.', ',');

export function receitaParaFormulario(receita) {
  if (!receita) {
    return {
      nome: '',
      categoria: null,
      tempo: '',
      porcoes: '4',
      descricaoPorcao: '',
      ingredientesTexto: '',
      passos: '',
      conservacao: '',
      vira: '',
      itens: [],
    };
  }
  return {
    nome: receita.nome,
    categoria: receita.categoria,
    tempo: receita.tempo ?? '',
    porcoes: String(receita.porcoesPadrao),
    descricaoPorcao: receita.descricaoPorcao ?? '',
    ingredientesTexto: (receita.ingredientesTexto ?? []).join('\n'),
    passos: receita.passos.join('\n'),
    conservacao: Object.entries(receita.conservacao ?? {})
      .map(([local, prazo]) => `${local}: ${prazo}`)
      .join('\n'),
    vira: receita.vira ?? '',
    itens: receita.ingredientes.map((i) => ({
      chave: novaChave(),
      ingrediente: i.ingrediente,
      aGosto: Boolean(i.aGosto),
      medida: 'base',
      quantidade: i.aGosto ? '' : paraCampo(arredondar(i.qtdPorPorcao * receita.porcoesPadrao, 2)),
    })),
  };
}

/** Quantidade de uma linha do formulário na unidade base, para a receita inteira. */
export function quantidadeNaBase(item, ingredientes) {
  const fator = item.medida === 'base' ? 1 : ingredientes[item.ingrediente]?.medidas?.[item.medida];
  const qtd = lerNumero(item.quantidade);
  return qtd > 0 && fator ? qtd * fator : NaN;
}

/**
 * Monta a receita a partir do formulário. `original` é a receita em edição
 * (null para uma nova). Devolve { receita, erros } com mensagens para a tela.
 */
export function formularioParaReceita(form, { original, receitas, ingredientes }) {
  const erros = [];
  const porcoes = Number(form.porcoes);
  const porcoesValidas = Number.isInteger(porcoes) && porcoes >= 1 && porcoes <= 99;

  if (!form.nome.trim()) erros.push('Dê um nome para a receita.');
  if (!form.categoria) erros.push('Escolha a categoria.');
  if (!porcoesValidas) erros.push('As porções precisam ser um número inteiro de 1 a 99.');
  if (!linhas(form.ingredientesTexto).length) erros.push('Escreva os ingredientes como aparecem na receita.');
  if (!form.itens.length) erros.push('Adicione pelo menos um ingrediente para a lista de compras.');
  if (!linhas(form.passos).length) erros.push('Escreva pelo menos um passo do modo de preparo.');

  const vistos = new Set();
  const itens = [];
  form.itens.forEach((item, i) => {
    const nomeIng = ingredientes[item.ingrediente]?.nome;
    if (!item.ingrediente) return erros.push(`Escolha o ingrediente da linha ${i + 1} da lista de compras.`);
    if (vistos.has(item.ingrediente)) return erros.push(`${nomeIng} aparece duas vezes na lista de compras.`);
    vistos.add(item.ingrediente);
    if (item.aGosto) return itens.push({ ingrediente: item.ingrediente, qtdPorPorcao: null, aGosto: true });
    const total = quantidadeNaBase(item, ingredientes);
    if (!(total > 0)) return erros.push(`Confira a quantidade de ${nomeIng}.`);
    if (porcoesValidas) itens.push({ ingrediente: item.ingrediente, qtdPorPorcao: arredondar(total / porcoes, 4) });
  });

  const conservacao = Object.fromEntries(
    linhas(form.conservacao).map((linha) => {
      const i = linha.indexOf(':');
      return i > 0 ? [linha.slice(0, i).trim(), linha.slice(i + 1).trim()] : ['Conservação', linha];
    }),
  );

  const receita = {
    tags: [],
    foto: null,
    rendimentoOriginal: porcoesValidas ? `${porcoes} porções` : '',
    ...original,
    id: original?.id ?? gerarId(form.nome, new Set(receitas.map((r) => r.id))),
    nome: form.nome.trim(),
    categoria: form.categoria,
    tempo: form.tempo.trim(),
    porcoesPadrao: porcoes,
    descricaoPorcao: form.descricaoPorcao.trim(),
    conservacao,
    ingredientes: itens,
    ingredientesTexto: linhas(form.ingredientesTexto),
    passos: linhas(form.passos),
    vira: form.vira.trim(),
  };
  return { receita, erros };
}
