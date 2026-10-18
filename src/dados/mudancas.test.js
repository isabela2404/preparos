import { describe, expect, it } from 'vitest';
import { aplicarMudancas, extrairCodigo, gerarCodigo } from './mudancas.js';

describe('aplicarMudancas', () => {
  const estado = { planejador: { arroz: 6 }, marcados: { sal: 0 } };

  it('define, altera e apaga campos aninhados sem mexer no original', () => {
    const novo = aplicarMudancas(estado, [
      { campo: ['planejador', 'frango'], valor: 4 },
      { campo: ['planejador', 'arroz'], valor: null },
      { campo: ['marcados', 'ovo'], valor: 13 },
    ]);
    expect(novo).toEqual({ planejador: { frango: 4 }, marcados: { sal: 0, ovo: 13 } });
    expect(estado.planejador).toEqual({ arroz: 6 });
  });

  it('troca um mapa inteiro', () => {
    expect(aplicarMudancas(estado, [{ campo: ['marcados'], valor: {} }]).marcados).toEqual({});
  });

  it('cria o mapa quando ele não existe', () => {
    expect(aplicarMudancas({}, [{ campo: ['planejador', 'x'], valor: 1 }])).toEqual({ planejador: { x: 1 } });
  });
});

describe('código do casal', () => {
  it('gera 32 caracteres seguros para URL, diferentes a cada vez', () => {
    const a = gerarCodigo();
    expect(a).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(gerarCodigo()).not.toBe(a);
  });

  it('extrai o código de um link de convite ou de texto colado', () => {
    const codigo = 'AbCdEfGhIjKlMnOpQrStUvWxYz012345';
    expect(extrairCodigo(`https://x.github.io/preparos/#/entrar/${codigo}`)).toBe(codigo);
    expect(extrairCodigo(`  ${codigo}\n`)).toBe(codigo);
    expect(extrairCodigo('curto-demais')).toBeNull();
  });
});
