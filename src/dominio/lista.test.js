import { describe, expect, it } from 'vitest';
import { agruparLista, calcularItens, estaMarcado, textoQuantidade, textoWhatsApp } from './lista.js';

const ingredientes = {
  'carne-moida': { nome: 'Carne moída', unidade: 'g', setor: 'acougue' },
  ovo: { nome: 'Ovo', unidade: 'un', setor: 'frios' },
  cenoura: { nome: 'Cenoura', unidade: 'g', setor: 'hortifruti' },
  limao: { nome: 'Limão', unidade: 'un', setor: 'hortifruti' },
  azeite: { nome: 'Azeite', unidade: 'ml', setor: 'mercearia' },
  sal: { nome: 'Sal', unidade: 'g', setor: 'temperos', basico: true },
};

const receitas = [
  {
    id: 'almondegas',
    ingredientes: [
      { ingrediente: 'carne-moida', qtdPorPorcao: 62.5 },
      { ingrediente: 'ovo', qtdPorPorcao: 0.125 },
      { ingrediente: 'sal', qtdPorPorcao: null, aGosto: true },
    ],
  },
  {
    id: 'carne-refogada',
    ingredientes: [
      { ingrediente: 'carne-moida', qtdPorPorcao: 125 },
      { ingrediente: 'cenoura', qtdPorPorcao: 25 },
      { ingrediente: 'azeite', qtdPorPorcao: 3.25 },
    ],
  },
  {
    id: 'frango',
    ingredientes: [
      { ingrediente: 'limao', qtdPorPorcao: 0.25 },
      { ingrediente: 'sal', qtdPorPorcao: 1.5 },
    ],
  },
];

const porCodigo = (itens) => Object.fromEntries(itens.map((i) => [i.codigo, i]));

describe('calcularItens', () => {
  it('soma o mesmo ingrediente de receitas diferentes numa linha (RN-01, RN-02)', () => {
    const itens = porCodigo(calcularItens({ almondegas: 8, 'carne-refogada': 4 }, receitas, ingredientes));
    expect(itens['carne-moida'].total).toBe(1000);
    expect(itens['carne-moida'].receitas).toEqual(['almondegas', 'carne-refogada']);
    expect(textoQuantidade(itens['carne-moida'])).toBe('1 kg');
  });

  it('arredonda para cima ao comprar (RN-04)', () => {
    const itens = porCodigo(calcularItens({ almondegas: 3, 'carne-refogada': 3 }, receitas, ingredientes));
    expect(itens.ovo.qtdCompra).toBe(1); // 0,375 ovo
    expect(itens.azeite.qtdCompra).toBe(10); // 9,75 ml
    expect(itens['carne-moida'].qtdCompra).toBe(565); // 562,5 g
  });

  it('marca item a gosto sem somar quantidade', () => {
    const soAGosto = porCodigo(calcularItens({ almondegas: 8 }, receitas, ingredientes));
    expect(textoQuantidade(soAGosto.sal)).toBe('a gosto');

    const misto = porCodigo(calcularItens({ almondegas: 8, frango: 4 }, receitas, ingredientes));
    expect(textoQuantidade(misto.sal)).toBe('10 g + a gosto') // 6 g arredondados para o múltiplo de 5;
  });

  it('ignora receitas que não existem mais e porções zeradas', () => {
    expect(calcularItens({ sumiu: 4, almondegas: 0 }, receitas, ingredientes)).toEqual([]);
  });
});

describe('agruparLista', () => {
  const itens = calcularItens({ almondegas: 8, 'carne-refogada': 4, frango: 4 }, receitas, ingredientes);

  it('segue a ordem dos setores e manda básicos para a despensa (RF-22, RN-10)', () => {
    const grupos = agruparLista(itens, {});
    expect(grupos.map((g) => g.id)).toEqual(['acougue', 'hortifruti', 'mercearia', 'frios', 'despensa']);
    expect(grupos.at(-1).itens.map((i) => i.codigo)).toEqual(['sal']);
  });

  it('manda marcados para o fim do setor e conta os pendentes (RF-23, RF-24)', () => {
    const hortifruti = agruparLista(itens, { cenoura: 100 }).find((g) => g.id === 'hortifruti');
    expect(hortifruti.itens.map((i) => [i.codigo, i.marcado])).toEqual([
      ['limao', false],
      ['cenoura', true],
    ]);
    expect(hortifruti.pendentes).toBe(1);
  });
});

describe('estaMarcado (RN-07)', () => {
  const item = { codigo: 'carne-moida', qtdCompra: 500 };

  it('continua marcado se a quantidade cair ou ficar igual', () => {
    expect(estaMarcado(item, { 'carne-moida': 500 })).toBe(true);
    expect(estaMarcado({ ...item, qtdCompra: 400 }, { 'carne-moida': 500 })).toBe(true);
  });

  it('volta a ficar desmarcado se a quantidade subir', () => {
    expect(estaMarcado({ ...item, qtdCompra: 600 }, { 'carne-moida': 500 })).toBe(false);
  });

  it('item só a gosto fica marcado com 0', () => {
    expect(estaMarcado({ codigo: 'sal', qtdCompra: null }, { sal: 0 })).toBe(true);
  });
});

describe('textoWhatsApp (RN-09)', () => {
  it('lista setores e itens que faltam, sem os marcados', () => {
    const itens = calcularItens({ almondegas: 8, 'carne-refogada': 4, frango: 16 }, receitas, ingredientes);
    const texto = textoWhatsApp(agruparLista(itens, { azeite: 20, ovo: 1, sal: 25 }));
    expect(texto).toBe(
      [
        '*Lista de compras*',
        '*Açougue e Peixaria*\n- Carne moída: 1 kg',
        '*Hortifrúti*\n- Cenoura: 100 g\n- Limão: 4 unidades',
      ].join('\n\n'),
    );
  });
});

describe('itens avulsos (RF-27)', () => {
  const itens = calcularItens({ frango: 4 }, receitas, ingredientes);
  const avulsos = {
    a1: { nome: 'Papel toalha', setor: 'temperos', marcado: false },
    a2: { nome: 'Pão', setor: 'mercearia', marcado: true },
    a3: { nome: 'Pilhas', setor: 'outros', marcado: false },
  };

  it('entram no setor escolhido, com marcação própria', () => {
    const grupos = agruparLista(itens, {}, avulsos);
    expect(grupos.map((g) => g.id)).toEqual(['hortifruti', 'mercearia', 'temperos', 'outros', 'despensa']);
    const temperos = grupos.find((g) => g.id === 'temperos');
    expect(temperos.itens.map((i) => [i.nome, i.avulso, i.marcado])).toEqual([['Papel toalha', true, false]]);
    expect(grupos.find((g) => g.id === 'mercearia').pendentes).toBe(0);
  });

  it('vão para o WhatsApp sem quantidade, só os que faltam', () => {
    const texto = textoWhatsApp(agruparLista(itens, { limao: 1, sal: 10 }, avulsos));
    expect(texto).toBe('*Lista de compras*\n\n*Temperos e Diversos*\n- Papel toalha\n\n*Outros*\n- Pilhas');
  });

  it('setor desconhecido vai para Outros', () => {
    const grupos = agruparLista([], {}, { a1: { nome: 'Vela', setor: 'papelaria', marcado: false } });
    expect(grupos.map((g) => [g.id, g.itens[0].nome])).toEqual([['outros', 'Vela']]);
  });
});

