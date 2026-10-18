import { describe, expect, it } from 'vitest';
import cargaInicial from '../dados/carga-inicial.json';
import { ingredientesPara, medidaCaseira, textoQuantidadeCozinha } from './porcoes.js';

const { receitas, ingredientes } = cargaInicial;
const receita = (id) => receitas.find((r) => r.id === id);
const comoTexto = (id, porcoes) =>
  Object.fromEntries(ingredientesPara(receita(id), ingredientes, porcoes).map((i) => [i.codigo, i.quantidade]));

describe('ingredientesPara (RF-05)', () => {
  it('almôndegas para 12 em vez de 8', () => {
    expect(comoTexto('almondegas-assadas', 12)).toEqual({
      'carne-moida': '750 g',
      ovo: '1½ unidade',
      aveia: '3 colheres de sopa (30 g)',
      cebola: '1 unidade (150 g)',
      alho: '3 dentes (15 g)',
      salsinha: '1½ colheres de sopa (6 g)',
      sal: 'a gosto',
      pimenta: 'a gosto',
    });
  });

  it('no rendimento padrão, volta às quantidades da receita', () => {
    const texto = comoTexto('almondegas-assadas', 8);
    expect(texto['carne-moida']).toBe('500 g');
    expect(texto.alho).toBe('2 dentes (10 g)');
    expect(texto.cebola).toBe('1 unidade pequena (100 g)');
  });
});

describe('medidaCaseira', () => {
  it('prefere contar a partir de 1 e a medida maior', () => {
    expect(medidaCaseira(26, ingredientes.azeite)).toMatchObject({ medida: 'cs', quantidade: 2 });
    expect(medidaCaseira(170, ingredientes.quinoa)).toMatchObject({ medida: 'xic', quantidade: 1 });
  });

  it('aceita fração de medida quando nada fecha a partir de 1', () => {
    expect(textoQuantidadeCozinha(6.5, ingredientes.azeite)).toBe('½ de colher de sopa (6,5 ml)');
  });

  it('fica na unidade base quando a conta não fecha', () => {
    expect(medidaCaseira(62.5, ingredientes['carne-moida'])).toBeNull();
    expect(textoQuantidadeCozinha(45, ingredientes.cebola)).toBe('45 g');
  });
});
