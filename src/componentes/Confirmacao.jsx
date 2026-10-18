import { useEffect, useRef } from 'preact/hooks';

// RF-14 e RF-26: confirmação antes de apagar.
export function Confirmacao({ aberta, titulo, texto, rotuloConfirmar, aoConfirmar, aoCancelar }) {
  const dialogo = useRef(null);

  useEffect(() => {
    const d = dialogo.current;
    if (aberta && !d.open) d.showModal();
    if (!aberta && d.open) d.close();
  }, [aberta]);

  return (
    <dialog ref={dialogo} class="confirmacao" onClose={aoCancelar} aria-labelledby="confirmacao-titulo">
      <h2 id="confirmacao-titulo">{titulo}</h2>
      <p>{texto}</p>
      <div class="confirmacao-acoes">
        <button type="button" class="botao botao-secundario" onClick={aoCancelar}>
          Cancelar
        </button>
        <button type="button" class="botao botao-perigo" onClick={aoConfirmar}>
          {rotuloConfirmar}
        </button>
      </div>
    </dialog>
  );
}
