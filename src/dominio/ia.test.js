import { describe, expect, it } from 'vitest';
import cargaInicial from '../dados/carga-inicial.json';
import { formularioParaReceita } from './edicao.js';
import { extrairJson, instrucoesParaIa, lerRespostaDaIa, procurarIngrediente } from './ia.js';

const { receitas, ingredientes } = cargaInicial;

const resposta = (dados) => JSON.stringify(dados);
const sem = (itens) => itens.map(({ chave: _, ...resto }) => resto);

describe('instrucoesParaIa', () => {
  it('leva categorias, setores e o catálogo com unidade e medidas', () => {
    const texto = instrucoesParaIa(ingredientes);
    expect(texto).toContain('proteinas (Proteínas)');
    expect(texto).toContain('hortifruti (Hortifrúti)');
    expect(texto).toContain('- azeite: Azeite (ml; cs = 13 ml; cc = 4 ml)');
    expect(texto).toContain('- paprica-doce: Páprica doce (g; cs = 7 g; cc = 2,5 g)');
    expect(texto).toContain('- ovo: Ovo (un)');
  });

  it('acompanha o catálogo de agora', () => {
    const texto = instrucoesParaIa({ ...ingredientes, 'leite-coco': { nome: 'Leite de coco', unidade: 'ml', setor: 'mercearia' } });
    expect(texto).toContain('- leite-coco: Leite de coco (ml)');
  });
});

describe('extrairJson', () => {
  it('acha o bloco no meio da conversa e dos ```', () => {
    expect(extrairJson('Aqui está:\n```json\n{ "nome": "Bolo" }\n```\nBom apetite!')).toEqual({ nome: 'Bolo' });
  });

  it('explica quando não há receita ou o JSON está quebrado', () => {
    expect(() => extrairJson('Não consegui abrir o link.')).toThrow(/Não encontrei a receita/);
    expect(() => extrairJson('{ "nome": "Bolo", }')).toThrow(/Não consegui ler/);
    expect(() => extrairJson('{ "nome": "A" } { "nome": "B" }')).toThrow(/uma receita só/);
  });
});

describe('procurarIngrediente', () => {
  it('acha pelo nome sem ligar para acento, maiúsculas e parênteses, ou pelo código', () => {
    expect(procurarIngrediente('pimentao', ingredientes)).toBe('pimentao');
    expect(procurarIngrediente('Carne moída magra', ingredientes)).toBe('carne-moida');
    expect(procurarIngrediente('Grão-de-bico cozido', ingredientes)).toBe('grao-de-bico');
    expect(procurarIngrediente('Abacate', ingredientes)).toBeNull();
  });
});

describe('lerRespostaDaIa', () => {
  it('preenche o formulário, que salva sem erros e divide pelas porções', () => {
    const { form, novos, avisos } = lerRespostaDaIa(
      resposta({
        nome: 'Frango ao curry',
        categoria: 'proteinas',
        tempo: '40 min',
        porcoes: 4,
        descricaoPorcao: '1 concha',
        fonte: 'https://www.instagram.com/p/abc/',
        ingredientesTexto: ['800 g de frango', '2 colheres de azeite', '1 xícara de leite de coco', 'Sal a gosto'],
        ingredientes: [
          { codigo: 'peito-frango', quantidade: 0.8, medida: 'kg' },
          { codigo: 'azeite', quantidade: 2, medida: 'cs' },
          { nome: 'Leite de coco', quantidade: 1, medida: 'xic', unidade: 'ml', valorMedida: 200, setor: 'mercearia' },
          { codigo: 'sal', aGosto: true },
        ],
        passos: ['Doure o frango.', 'Junte o leite de coco.'],
        conservacao: { Geladeira: '3 dias', Freezer: '2 meses' },
        vira: 'Bowl com arroz.',
        observacoes: ['Usei 1 colher de curry.'],
      }),
      ingredientes,
    );

    expect(form.conservacao).toBe('Geladeira: 3 dias\nFreezer: 2 meses');
    expect(form.passos).toBe('Doure o frango.\nJunte o leite de coco.');
    expect(sem(form.itens)).toEqual([
      { ingrediente: 'peito-frango', medida: 'base', quantidade: '800', aGosto: false },
      { ingrediente: 'azeite', medida: 'cs', quantidade: '2', aGosto: false },
      { ingrediente: 'leite-de-coco', medida: 'xic', quantidade: '1', aGosto: false },
      { ingrediente: 'sal', medida: 'base', quantidade: '', aGosto: true },
    ]);
    expect(novos).toEqual({
      'leite-de-coco': { nome: 'Leite de coco', unidade: 'ml', setor: 'mercearia', medidas: { xic: 200 } },
    });
    expect(avisos[0]).toBe('Usei 1 colher de curry.');
    expect(avisos[1]).toMatch(/Leite de coco \(Mercearia e Grãos\)/);

    const { receita, erros } = formularioParaReceita(form, {
      original: null,
      receitas,
      ingredientes: { ...ingredientes, ...novos },
    });
    expect(erros).toEqual([]);
    expect(receita.fonte).toBe('https://www.instagram.com/p/abc/');
    expect(receita.ingredientes).toEqual([
      { ingrediente: 'peito-frango', qtdPorPorcao: 200 },
      { ingrediente: 'azeite', qtdPorPorcao: 6.5 },
      { ingrediente: 'leite-de-coco', qtdPorPorcao: 50 },
      { ingrediente: 'sal', qtdPorPorcao: null, aGosto: true },
    ]);
  });

  it('acha pelo nome quando a IA não manda o código', () => {
    const { form, novos } = lerRespostaDaIa(
      resposta({ ingredientes: [{ nome: 'Páprica Doce', quantidade: 1, medida: 'cc' }] }),
      ingredientes,
    );
    expect(sem(form.itens)).toEqual([{ ingrediente: 'paprica-doce', medida: 'cc', quantidade: '1', aGosto: false }]);
    expect(novos).toEqual({});
  });

  it('converte pela valorMedida quando o catálogo não conhece a medida', () => {
    // Cebola é medida em gramas e o catálogo não tem xícara.
    const { form } = lerRespostaDaIa(
      resposta({ ingredientes: [{ codigo: 'cebola', quantidade: 1.5, medida: 'xic', valorMedida: 110 }] }),
      ingredientes,
    );
    expect(sem(form.itens)).toEqual([{ ingrediente: 'cebola', medida: 'base', quantidade: '165', aGosto: false }]);
  });

  it('deixa a quantidade em branco e avisa quando não há conversão', () => {
    // Limão é contado em unidades; 50 g não tem como virar unidade.
    const { form, avisos } = lerRespostaDaIa(
      resposta({ ingredientes: [{ codigo: 'limao', quantidade: 50, medida: 'g' }] }),
      ingredientes,
    );
    expect(sem(form.itens)).toEqual([{ ingrediente: 'limao', medida: 'base', quantidade: '', aGosto: false }]);
    expect(avisos).toEqual(['Limão: “50 g” não tem conversão para unidades. Preencha a quantidade.']);
  });

  it('não cria o mesmo ingrediente novo duas vezes', () => {
    const { form, novos } = lerRespostaDaIa(
      resposta({
        ingredientes: [
          { nome: 'Abacate', quantidade: 1, medida: 'un', unidade: 'un', setor: 'hortifruti' },
          { nome: 'abacate', quantidade: 1, medida: 'un' },
        ],
      }),
      ingredientes,
    );
    expect(Object.keys(novos)).toEqual(['abacate']);
    expect(form.itens.map((i) => i.ingrediente)).toEqual(['abacate', 'abacate']);
  });

  it('ignora categoria, setor e códigos que o app não conhece', () => {
    const { form, novos } = lerRespostaDaIa(
      resposta({
        categoria: 'sobremesas',
        ingredientes: [{ codigo: 'constructor', nome: 'Cacau', quantidade: 2, medida: 'cs', setor: 'padaria' }],
      }),
      ingredientes,
    );
    expect(form.categoria).toBeNull();
    expect(novos).toEqual({ cacau: { nome: 'Cacau', unidade: 'g', setor: 'mercearia', medidas: {} } });
    expect(sem(form.itens)).toEqual([{ ingrediente: 'cacau', medida: 'base', quantidade: '', aGosto: false }]);
  });
});
