import { describe, expect, it } from 'vitest';
import cargaInicial from '../dados/carga-inicial.json';
import { formularioParaReceita, gerarId, lerNumero, receitaParaFormulario } from './edicao.js';

const { receitas, ingredientes } = cargaInicial;
const almondegas = receitas.find((r) => r.id === 'almondegas-assadas');

describe('lerNumero', () => {
  it('aceita vírgula, ponto, frações e frações unicode', () => {
    expect(lerNumero('1,5')).toBe(1.5);
    expect(lerNumero('2.25')).toBe(2.25);
    expect(lerNumero('1/2')).toBe(0.5);
    expect(lerNumero('1 1/2')).toBe(1.5);
    expect(lerNumero('1½')).toBe(1.5);
    expect(lerNumero('¼')).toBe(0.25);
  });

  it('recusa o que não é número', () => {
    expect(lerNumero('')).toBeNaN();
    expect(lerNumero('duas')).toBeNaN();
    expect(lerNumero('1,5,2')).toBeNaN();
  });
});

describe('gerarId', () => {
  it('cria código sem acento e sem repetir', () => {
    expect(gerarId('Pão de Queijo!', new Set())).toBe('pao-de-queijo');
    expect(gerarId('Quinoa', new Set(['quinoa', 'quinoa-2']))).toBe('quinoa-3');
  });
});

describe('ida e volta do formulário', () => {
  it('mostra as quantidades da receita inteira e devolve a mesma receita', () => {
    const form = receitaParaFormulario(almondegas);
    expect(form.itens.find((i) => i.ingrediente === 'carne-moida').quantidade).toBe('500');
    expect(form.conservacao).toBe('Geladeira: 3 a 4 dias\nFreezer: 3 meses');

    const { receita, erros } = formularioParaReceita(form, { original: almondegas, receitas, ingredientes });
    expect(erros).toEqual([]);
    expect(receita).toEqual(almondegas);
  });

  it('converte medida caseira e divide pelas porções', () => {
    const form = {
      ...receitaParaFormulario(null),
      nome: 'Molho novo',
      categoria: 'molhos',
      porcoes: '4',
      ingredientesTexto: '2 colheres de azeite',
      passos: 'Misture.',
      itens: [{ chave: 1, ingrediente: 'azeite', medida: 'cs', quantidade: '2', aGosto: false }],
    };
    const { receita, erros } = formularioParaReceita(form, { original: null, receitas, ingredientes });
    expect(erros).toEqual([]);
    expect(receita.id).toBe('molho-novo');
    expect(receita.ingredientes).toEqual([{ ingrediente: 'azeite', qtdPorPorcao: 6.5 }]); // 2 × 13 ml ÷ 4
  });

  it('explica o que falta preencher', () => {
    const form = {
      ...receitaParaFormulario(null),
      porcoes: '0',
      itens: [
        { chave: 1, ingrediente: 'ovo', medida: 'base', quantidade: 'muitos', aGosto: false },
        { chave: 2, ingrediente: null, medida: 'base', quantidade: '', aGosto: false },
      ],
    };
    const { erros } = formularioParaReceita(form, { original: null, receitas, ingredientes });
    expect(erros).toEqual([
      'Dê um nome para a receita.',
      'Escolha a categoria.',
      'As porções precisam ser um número inteiro de 1 a 99.',
      'Escreva os ingredientes como aparecem na receita.',
      'Escreva pelo menos um passo do modo de preparo.',
      'Confira a quantidade de Ovo.',
      'Escolha o ingrediente da linha 2 da lista de compras.',
    ]);
  });
});
