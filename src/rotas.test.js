import { describe, expect, it } from 'vitest';
import { interpretarRota, linkReceita } from './rotas.js';

describe('interpretarRota', () => {
  it('abre o Caderno sem hash ou com hash desconhecido', () => {
    expect(interpretarRota('')).toEqual({ tela: 'caderno' });
    expect(interpretarRota('#/')).toEqual({ tela: 'caderno' });
    expect(interpretarRota('#/qualquer')).toEqual({ tela: 'caderno' });
  });

  it('reconhece planejador e lista', () => {
    expect(interpretarRota('#/planejador')).toEqual({ tela: 'planejador' });
    expect(interpretarRota('#/lista')).toEqual({ tela: 'lista' });
  });

  it('ida e volta do link de receita', () => {
    expect(interpretarRota(linkReceita('almondegas-assadas'))).toEqual({
      tela: 'receita',
      id: 'almondegas-assadas',
    });
  });
});
