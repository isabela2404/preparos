import { Dialogo } from './Dialogo.jsx';

// Confirmação antes de apagar (RF-14, RF-26).
export function Confirmacao({ aberta, titulo, texto, rotuloConfirmar, aoConfirmar, aoCancelar }) {
  return (
    <Dialogo aberto={aberta} aoFechar={aoCancelar} rotulo={titulo} class="confirmacao">
      <h2>{titulo}</h2>
      <p>{texto}</p>
      <div class="confirmacao-acoes">
        <button type="button" class="botao botao-secundario" onClick={aoCancelar}>
          Cancelar
        </button>
        <button type="button" class="botao botao-perigo" onClick={aoConfirmar}>
          {rotuloConfirmar}
        </button>
      </div>
    </Dialogo>
  );
}
