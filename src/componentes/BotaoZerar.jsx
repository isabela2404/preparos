import { useState } from 'preact/hooks';
import { zerarPlanejador } from '../dados/repositorio.js';
import { Confirmacao } from './Confirmacao.jsx';

// RF-14, RF-26 e RN-08: o mesmo "Zerar" no Planejador e na Lista apaga tudo,
// com confirmação antes.
export function BotaoZerar({ desabilitado = false }) {
  const [confirmando, setConfirmando] = useState(false);
  return (
    <>
      <button
        type="button"
        class="botao botao-secundario"
        disabled={desabilitado}
        onClick={() => setConfirmando(true)}
      >
        Zerar
      </button>
      <Confirmacao
        aberta={confirmando}
        titulo="Zerar tudo?"
        texto="As receitas escolhidas, as porções e os itens marcados serão apagados. A lista de compras fica vazia."
        rotuloConfirmar="Zerar tudo"
        aoConfirmar={() => {
          zerarPlanejador();
          setConfirmando(false);
        }}
        aoCancelar={() => setConfirmando(false)}
      />
    </>
  );
}
