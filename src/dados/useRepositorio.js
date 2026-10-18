import { useEffect, useState } from 'preact/hooks';
import { observar } from './repositorio.js';

/** { caderno, estado, status, codigo }, atualizado a cada mudança. */
export function useRepositorio() {
  const [atual, setAtual] = useState(null);
  useEffect(() => observar(setAtual), []);
  return atual;
}
