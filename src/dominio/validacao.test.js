import { describe, expect, it } from 'vitest';
import cargaInicial from '../dados/carga-inicial.json';
import { validarCarga } from './validacao.js';

const receitaValida = {
  id: 'teste',
  nome: 'Teste',
  categoria: 'proteinas',
  porcoesPadrao: 4,
  ingredientes: [{ ingrediente: 'ovo', qtdPorPorcao: 1 }],
  passos: ['Faça.'],
};
const ingredientes = {
  ovo: { nome: 'Ovo', unidade: 'un', setor: 'frios' },
  sal: { nome: 'Sal', unidade: 'g', setor: 'temperos', basico: true },
};

describe('validarCarga', () => {
  it('aceita a carga inicial do repositório', () => {
    expect(validarCarga(cargaInicial)).toEqual([]);
  });

  it('aponta ingrediente fora do catálogo (RN-02)', () => {
    const receitas = [{ ...receitaValida, ingredientes: [{ ingrediente: 'patinho', qtdPorPorcao: 100 }] }];
    expect(validarCarga({ ingredientes, receitas })).toEqual([
      'Receita "teste" usa ingrediente fora do catálogo: patinho',
    ]);
  });

  it('aceita item a gosto sem quantidade, mas não item comum sem quantidade', () => {
    const receitas = [
      {
        ...receitaValida,
        ingredientes: [
          { ingrediente: 'sal', qtdPorPorcao: null, aGosto: true },
          { ingrediente: 'ovo', qtdPorPorcao: null },
        ],
      },
    ];
    expect(validarCarga({ ingredientes, receitas })).toEqual([
      'Receita "teste" com quantidade inválida para ovo: null',
    ]);
  });

  it('aponta categoria, setor e unidade inválidos', () => {
    const erros = validarCarga({
      ingredientes: { ovo: { nome: 'Ovo', unidade: 'duzia', setor: 'padaria' } },
      receitas: [{ ...receitaValida, categoria: 'cafe-da-manha' }],
    });
    expect(erros).toHaveLength(3);
  });

  it('aponta receita repetida e porções fora de 1 a 99 (RN-06)', () => {
    const erros = validarCarga({
      ingredientes,
      receitas: [receitaValida, { ...receitaValida, porcoesPadrao: 0 }],
    });
    expect(erros).toEqual(['Receita "teste" repetida', 'Receita "teste" com porções fora de 1 a 99: 0']);
  });

  it('aponta categorias da carga diferentes das do app', () => {
    const categorias = cargaInicial.categorias.map((c) => (c.id === 'sucos' ? { ...c, id: 'bebidas' } : c));
    const erros = validarCarga({ ...cargaInicial, categorias });
    expect(erros).toHaveLength(1);
    expect(erros[0]).toMatch(/^As categorias da carga/);
  });
});
