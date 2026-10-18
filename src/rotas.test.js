import { describe, expect, it } from 'vitest';
import { interpretarRota, linkReceita } from './rotas.js';

describe('interpretarRota', () => {
  it('abre o Caderno sem hash ou com hash desconhecido', () => {
    expect(interpretarRota('')).toEqual({ tela: 'caderno' });
    expect(interpretarRota('#/')).toEqual({ tela: 'caderno' });
    expect(interpretarRota('#/qualquer')).toEqual({ tela: 'caderno' });
  });

  it('reconhece planejador, lista e ajustes', () => {
    expect(interpretarRota('#/planejador')).toEqual({ tela: 'planejador' });
    expect(interpretarRota('#/lista')).toEqual({ tela: 'lista' });
    expect(interpretarRota('#/ajustes')).toEqual({ tela: 'ajustes' });
  });

  it('abre os ajustes com o convite do link', () => {
    expect(interpretarRota('#/entrar/AbCdEfGhIjKlMnOpQrStUvWxYz012345')).toEqual({
      tela: 'ajustes',
      convite: 'AbCdEfGhIjKlMnOpQrStUvWxYz012345',
    });
  });

  it('ida e volta do link de receita', () => {
    expect(interpretarRota(linkReceita('almondegas-assadas'))).toEqual({
      tela: 'receita',
      id: 'almondegas-assadas',
    });
  });
});
