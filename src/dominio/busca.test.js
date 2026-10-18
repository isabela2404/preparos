import { describe, expect, it } from 'vitest';
import cargaInicial from '../dados/carga-inicial.json';
import { filtrarPorBusca } from './busca.js';

const buscar = (termo) => filtrarPorBusca(cargaInicial.receitas, cargaInicial.ingredientes, termo).map((r) => r.id);

describe('filtrarPorBusca (RF-03)', () => {
  it('sem termo devolve todas', () => {
    expect(buscar('  ')).toHaveLength(cargaInicial.receitas.length);
  });

  it('acha pelo nome, sem ligar para acento e maiúscula', () => {
    expect(buscar('ALMONDEGAS')).toEqual(['almondegas-assadas']);
  });

  it('acha pelo ingrediente do catálogo ou do texto da receita', () => {
    expect(buscar('tahine')).toEqual(['molho-de-tahine-e-limao', 'homus-de-grao-de-bico']);
  });

  it('exige todas as palavras', () => {
    expect(buscar('frango limao')).toEqual(['frango-assado-temperado']);
  });
});
