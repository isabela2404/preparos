import { useEffect, useRef } from 'preact/hooks';

/** Janela modal nativa (<dialog>), aberta e fechada pela prop `aberto`. */
export function Dialogo({ aberto, aoFechar, rotulo, class: classe = '', children }) {
  const dialogo = useRef(null);

  useEffect(() => {
    const d = dialogo.current;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);

  return (
    <dialog ref={dialogo} class={`dialogo ${classe}`} onClose={aoFechar} aria-label={rotulo}>
      {aberto && children}
    </dialog>
  );
}
