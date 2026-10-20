import { normalizar } from './busca.js';
import { CATEGORIAS, CATEGORIA_POR_ID } from './categorias.js';
import { NOME_MEDIDA, NOME_UNIDADE, gerarId, lerNumero, novaChave, receitaParaFormulario } from './edicao.js';
import { SETORES, SETOR_POR_ID } from './setores.js';

// Receita trazida por uma IA (Claude, Gemini…) a partir de um link, vídeo ou
// foto. O app gera as instruções com o catálogo do momento; a IA devolve um
// JSON com as quantidades da receita inteira, na medida em que aparecem, e
// aqui ele vira o formulário de edição, para conferir antes de salvar.

const UNIDADES = ['g', 'ml', 'un'];
const MULTIPLOS = { kg: ['g', 1000], l: ['ml', 1000] };

// O JSON vem de fora: só vale chave própria do objeto (nada de "constructor").
const tem = (objeto, chave) => typeof chave === 'string' && Object.hasOwn(objeto ?? {}, chave);
const numero = (n) => String(Math.round(n * 100) / 100).replace('.', ',');

const EXEMPLO = {
  nome: 'Frango ao curry',
  categoria: 'proteinas',
  tempo: '40 min',
  porcoes: 4,
  descricaoPorcao: '1 concha (250 g)',
  fonte: 'https://www.instagram.com/p/…',
  ingredientesTexto: ['500 g de peito de frango em cubos', '2 colheres (sopa) de azeite', '1 xícara de leite de coco', 'Sal a gosto'],
  ingredientes: [
    { codigo: 'peito-frango', quantidade: 500, medida: 'g' },
    { codigo: 'azeite', quantidade: 2, medida: 'cs' },
    { nome: 'Leite de coco', quantidade: 1, medida: 'xic', unidade: 'ml', valorMedida: 200, setor: 'mercearia' },
    { codigo: 'sal', aGosto: true },
  ],
  passos: ['Doure o frango no azeite.', 'Junte o leite de coco e cozinhe por 15 minutos.'],
  conservacao: { Geladeira: '3 a 4 dias', Freezer: '3 meses' },
  vira: 'Bowl com arroz, recheio de wrap.',
  observacoes: ['O vídeo não diz quanto curry usar; coloquei 1 colher de sopa.'],
};

/** Texto para colar na IA junto com a receita. Leva o catálogo atual. */
export function instrucoesParaIa(ingredientes) {
  const catalogo = Object.entries(ingredientes)
    .sort(([, a], [, b]) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map(([codigo, i]) => {
      const medidas = Object.entries(i.medidas ?? {}).map(([m, fator]) => `${m} = ${numero(fator)} ${i.unidade}`);
      return `- ${codigo}: ${i.nome} (${[i.unidade, ...medidas].join('; ')})`;
    });

  return [
    'Você vai converter uma receita para o meu app de receitas, o Caderno de Preparos. Depois destas instruções eu mando a receita: um link, a legenda de um post, prints ou um vídeo.',
    'Responda só com um bloco JSON no formato abaixo, sem texto antes ou depois. Se não conseguir abrir o link ou ver o vídeo, diga isso em vez de inventar a receita.',
    '',
    'Formato:',
    JSON.stringify(EXEMPLO, null, 2),
    '',
    'Regras:',
    '- Tudo em português do Brasil.',
    `- categoria: um destes códigos: ${CATEGORIAS.map((c) => `${c.id} (${c.nome})`).join(', ')}. Café da manhã entra em lanches.`,
    '- porcoes: número inteiro de porções que a receita rende. Se ela não disser, estime por uma refeição de adulto e conte em observacoes. descricaoPorcao: o que é 1 porção.',
    '- tempo: tempo total, como "40 min" ou "1 h 15 min".',
    '- fonte: o link que eu mandar, se houver.',
    '- ingredientesTexto: os ingredientes como aparecem na receita, um por item, com as quantidades originais.',
    '- ingredientes: o que vai para a lista de compras, com a quantidade da RECEITA INTEIRA (não por porção), na medida em que aparece na receita. Não converta para gramas: copie a quantidade e a medida.',
    '  - Se o ingrediente está no catálogo abaixo, use "codigo". Vale um equivalente próximo (filé de frango → peito-frango).',
    '  - Se não está, use "nome" (simples, como numa lista de compras), "unidade" (g, ml ou un, como ele se compra), "setor" e, para itens de despensa como sal e pimenta, "basico": true.',
    `  - medida: g, kg, ml, l, un ou uma medida caseira: ${Object.entries(NOME_MEDIDA)
      .filter(([m]) => m !== 'un')
      .map(([m, nome]) => `${m} (${nome})`)
      .join(', ')}.`,
    '  - Se a medida não é a unidade do ingrediente e o catálogo não traz o valor dela, informe "valorMedida": quanto 1 dessa medida vale na unidade do ingrediente (1 xícara de leite de coco = 200 ml → "valorMedida": 200).',
    '  - quantidade é um número, com ponto decimal (0.5).',
    '  - Sem quantidade na receita (sal e pimenta a gosto): "aGosto": true, sem quantidade.',
    '  - Cada ingrediente aparece uma vez só; se ele se repete (na massa e no molho), some as quantidades. Água e utensílios não entram.',
    '- passos: um passo por item, curtos, no imperativo.',
    '- conservacao: quanto dura na geladeira e no freezer. Pode estimar; se não congela bem, diga.',
    '- vira: ideias curtas de como aproveitar o preparo em outras refeições.',
    '- observacoes: o que você estimou, assumiu ou não conseguiu ver. Pode ficar vazia.',
    '',
    `Setores do mercado: ${SETORES.map((s) => `${s.id} (${s.nome})`).join(', ')}.`,
    '',
    'Catálogo de ingredientes (código: nome (unidade; medidas conhecidas)):',
    ...catalogo,
  ].join('\n');
}

const NAO_ACHEI = 'Não encontrei a receita no texto. Cole a resposta da IA, com o bloco que começa em { e termina em }.';

/** O JSON dentro do texto colado, mesmo com conversa ou ``` em volta. */
export function extrairJson(texto) {
  const inicio = texto.indexOf('{');
  const fim = texto.lastIndexOf('}');
  if (inicio < 0 || fim < inicio) throw new Error(NAO_ACHEI);
  let dados;
  try {
    dados = JSON.parse(texto.slice(inicio, fim + 1));
  } catch {
    throw new Error(
      'Não consegui ler o bloco colado. Confira se copiou a resposta inteira, com uma receita só, ou peça para a IA gerar o JSON de novo.',
    );
  }
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) throw new Error(NAO_ACHEI);
  return dados;
}

const texto = (valor) =>
  Array.isArray(valor) ? valor.map(String).join('\n') : typeof valor === 'string' || typeof valor === 'number' ? String(valor) : '';

// Para comparar nomes: sem acento, maiúsculas nem o que está entre parênteses.
const chaveNome = (nome) =>
  normalizar(nome.replace(/\(.*?\)/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();

/** Código do ingrediente no catálogo pelo nome ou pelo código; null se não houver. */
export function procurarIngrediente(nome, ingredientes) {
  const alvo = chaveNome(nome);
  const lista = Object.entries(ingredientes);
  const achado =
    lista.find(([, i]) => chaveNome(i.nome) === alvo) ?? lista.find(([codigo]) => codigo === gerarId(nome, new Set()));
  return achado?.[0] ?? null;
}

function ingredienteNovo(item, nome) {
  const medida = String(item.medida ?? '').toLowerCase();
  const unidade = UNIDADES.find((u) => u === item.unidade || u === medida) ?? (tem(MULTIPLOS, medida) ? MULTIPLOS[medida][0] : 'g');
  const novo = { nome, unidade, setor: tem(SETOR_POR_ID, item.setor) ? item.setor : 'mercearia', medidas: {} };
  const valor = Number(item.valorMedida);
  if (tem(NOME_MEDIDA, medida) && medida !== unidade && valor > 0) novo.medidas[medida] = valor;
  if (item.basico === true) novo.basico = true;
  return novo;
}

/**
 * Linha do formulário na medida da IA, quando o catálogo a conhece, ou
 * convertida para a unidade base. Sem conversão possível, a quantidade fica
 * em branco e `pendente` diz o que a IA mandou.
 */
function linhaDoFormulario(item, codigo, ing) {
  const linha = { chave: novaChave(), ingrediente: codigo, medida: 'base', quantidade: '', aGosto: false };
  if (item.aGosto === true || item.quantidade == null || item.quantidade === '') return { ...linha, aGosto: true };

  const qtd = typeof item.quantidade === 'number' ? item.quantidade : lerNumero(item.quantidade);
  const medida = String(item.medida ?? ing.unidade).toLowerCase();
  const [unidadeMultiplo, fator] = tem(MULTIPLOS, medida) ? MULTIPLOS[medida] : [];
  const valor = Number(item.valorMedida);
  const pendente = { ...linha, pendente: `${texto(item.quantidade)} ${medida}`.trim() };

  if (!(qtd > 0)) return pendente;
  if (medida === ing.unidade) return { ...linha, quantidade: numero(qtd) };
  if (unidadeMultiplo === ing.unidade) return { ...linha, quantidade: numero(qtd * fator) };
  if (tem(ing.medidas, medida)) return { ...linha, medida, quantidade: numero(qtd) };
  if (valor > 0 && (item.unidade ?? ing.unidade) === ing.unidade) return { ...linha, quantidade: numero(qtd * valor) };
  return pendente;
}

/**
 * Lê a resposta da IA e devolve { form, novos, avisos }: o formulário no
 * formato de receitaParaFormulario, os ingredientes que não estão no catálogo
 * (criados ao salvar) e o que conferir. Lança Error com a mensagem para a tela.
 */
export function lerRespostaDaIa(resposta, ingredientes) {
  const dados = extrairJson(resposta);
  const novos = {};
  const itens = [];
  const pendentes = [];

  for (const item of Array.isArray(dados.ingredientes) ? dados.ingredientes : []) {
    if (!item || typeof item !== 'object') continue;
    const catalogo = { ...ingredientes, ...novos };
    const nome = texto(item.nome).trim() || texto(item.codigo).replace(/-/g, ' ').trim();
    let codigo = tem(catalogo, item.codigo) ? item.codigo : nome && procurarIngrediente(nome, catalogo);
    if (!codigo && !nome) continue;
    if (!codigo) {
      codigo = gerarId(nome, new Set(Object.keys(catalogo)));
      novos[codigo] = ingredienteNovo(item, nome);
    }
    const ing = catalogo[codigo] ?? novos[codigo];
    const { pendente, ...linha } = linhaDoFormulario(item, codigo, ing);
    if (pendente) pendentes.push(`${ing.nome}: “${pendente}” não tem conversão para ${NOME_UNIDADE[ing.unidade]}.`);
    itens.push(linha);
  }

  const conservacao =
    dados.conservacao && typeof dados.conservacao === 'object' && !Array.isArray(dados.conservacao)
      ? Object.entries(dados.conservacao)
          .map(([local, prazo]) => `${local}: ${texto(prazo)}`)
          .join('\n')
      : texto(dados.conservacao);

  const form = {
    ...receitaParaFormulario(null),
    nome: texto(dados.nome).trim(),
    categoria: tem(CATEGORIA_POR_ID, dados.categoria) ? dados.categoria : null,
    tempo: texto(dados.tempo).trim(),
    porcoes: dados.porcoes != null ? texto(dados.porcoes).trim() : receitaParaFormulario(null).porcoes,
    descricaoPorcao: texto(dados.descricaoPorcao).trim(),
    ingredientesTexto: texto(dados.ingredientesTexto),
    passos: texto(dados.passos),
    conservacao,
    vira: texto(dados.vira).trim(),
    fonte: texto(dados.fonte).trim(),
    itens,
  };

  const avisos = [
    ...(Array.isArray(dados.observacoes) ? dados.observacoes : []).map(texto).filter(Boolean),
    ...pendentes.map((p) => `${p} Preencha a quantidade.`),
  ];
  const nomesNovos = Object.values(novos).map((i) => `${i.nome} (${SETOR_POR_ID[i.setor].nome})`);
  if (nomesNovos.length) {
    avisos.push(
      `Ingredientes novos, criados no catálogo ao salvar: ${nomesNovos.join(', ')}. Para usar um que já existe, toque no nome.`,
    );
  }
  return { form, novos, avisos };
}
