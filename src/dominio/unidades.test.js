import { describe, expect, it } from 'vitest';
import { arredondarParaCompra, formatarQuantidade } from './unidades.js';

describe('formatarQuantidade (RN-03)', () => {
  it('mostra gramas abaixo de 1000 e kg a partir de 1000', () => {
    expect(formatarQuantidade(800, 'g')).toBe('800 g');
    expect(formatarQuantidade(1000, 'g')).toBe('1 kg');
    expect(formatarQuantidade(1400, 'g')).toBe('1,4 kg');
    expect(formatarQuantidade(12500, 'g')).toBe('12,5 kg');
  });

  it('nunca mostra kg ou L abaixo do necessário', () => {
    expect(formatarQuantidade(1405, 'g')).toBe('1,41 kg');
    expect(formatarQuantidade(1001, 'ml')).toBe('1,01 L');
  });

  it('mostra ml abaixo de 1000 e L a partir de 1000', () => {
    expect(formatarQuantidade(250, 'ml')).toBe('250 ml');
    expect(formatarQuantidade(1500, 'ml')).toBe('1,5 L');
  });

  it('usa vírgula decimal em quantidades por porção', () => {
    expect(formatarQuantidade(2.5, 'g')).toBe('2,5 g');
  });

  it('conta unidades sem converter', () => {
    expect(formatarQuantidade(1, 'un')).toBe('1 unidade');
    expect(formatarQuantidade(3, 'un')).toBe('3 unidades');
  });

  it('mostra frações comuns de itens contados como fração', () => {
    expect(formatarQuantidade(0.125, 'un')).toBe('⅛ unidade');
    expect(formatarQuantidade(0.5, 'un')).toBe('½ unidade');
    expect(formatarQuantidade(1 / 3, 'un')).toBe('⅓ unidade');
    expect(formatarQuantidade(2.5, 'un')).toBe('2½ unidades');
  });

  it('reconhece frações gravadas com 4 casas', () => {
    expect(formatarQuantidade(0.1667, 'un')).toBe('⅙ unidade');
    expect(formatarQuantidade(1.3333, 'un')).toBe('1⅓ unidade');
    expect(formatarQuantidade(0.0625, 'un')).toBe('0,06 unidade');
    expect(formatarQuantidade(0.2, 'un')).toBe('0,2 unidade');
  });
});

describe('arredondarParaCompra (RN-04)', () => {
  it('arredonda gramas para cima no múltiplo de 5', () => {
    expect(arredondarParaCompra(801, 'g')).toBe(805);
    expect(arredondarParaCompra(800, 'g')).toBe(800);
  });

  it('arredonda ml para cima no múltiplo de 10', () => {
    expect(arredondarParaCompra(241, 'ml')).toBe(250);
  });

  it('arredonda itens contados para a unidade inteira acima', () => {
    expect(arredondarParaCompra(1.1, 'un')).toBe(2);
    expect(arredondarParaCompra(0.125 * 8, 'un')).toBe(1);
  });

  it('não sobe um múltiplo por erro de ponto flutuante', () => {
    expect(arredondarParaCompra(0.1 * 3 * 100, 'ml')).toBe(30);
  });
});
