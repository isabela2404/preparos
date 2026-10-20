import { useState } from 'preact/hooks';
import { Copy } from 'lucide-preact';
import { instrucoesParaIa, lerRespostaDaIa } from '../dominio/ia.js';
import { Dialogo } from './Dialogo.jsx';

/**
 * Nova receita a partir de um post, vídeo ou foto: copia as instruções (com o
 * catálogo atual) para colar no Claude ou no Gemini e lê o JSON que a IA
 * devolve. `aoPreencher({ form, novos, avisos })`.
 */
export function ReceitaComIa({ aberto, ingredientes, aoPreencher, aoFechar }) {
  return (
    <Dialogo aberto={aberto} aoFechar={aoFechar} rotulo="Receita com IA">
      <Conteudo ingredientes={ingredientes} aoPreencher={aoPreencher} aoFechar={aoFechar} />
    </Dialogo>
  );
}

// Separado para o estado zerar cada vez que o diálogo abre.
function Conteudo({ ingredientes, aoPreencher, aoFechar }) {
  const [resposta, setResposta] = useState('');
  const [erro, setErro] = useState(null);
  const [copia, setCopia] = useState(null); // 'copiado' ou 'falhou'
  const instrucoes = instrucoesParaIa(ingredientes);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(instrucoes);
      setCopia('copiado');
    } catch {
      setCopia('falhou');
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        try {
          aoPreencher(lerRespostaDaIa(resposta, ingredientes));
        } catch (falha) {
          setErro(falha.message);
        }
      }}
    >
      <h2>Receita com IA</h2>

      <div class="campo">
        <span>1. Instruções</span>
        <small>
          Cole no Claude ou no Gemini e mande junto o link, a legenda, os prints ou o vídeo da receita. Elas levam o
          catálogo de ingredientes de agora.
        </small>
        <button type="button" class="botao botao-secundario" onClick={copiar}>
          <Copy size={20} aria-hidden="true" /> Copiar instruções
        </button>
        {copia === 'copiado' && <small role="status">Instruções copiadas.</small>}
        {copia === 'falhou' && (
          <>
            <small role="status">Não deu para copiar sozinho. Selecione o texto abaixo e copie.</small>
            <textarea rows="4" readonly value={instrucoes} aria-label="Instruções para a IA" />
          </>
        )}
      </div>

      <label class="campo">
        <span>2. Resposta da IA</span>
        <small>Copie a resposta inteira e cole aqui.</small>
        <textarea
          rows="6"
          value={resposta}
          autocapitalize="off"
          autocorrect="off"
          spellcheck={false}
          onInput={(e) => {
            const valor = e.currentTarget.value;
            setResposta(valor);
            setErro(null);
          }}
        />
      </label>

      {erro && (
        <p class="mensagem mensagem-erro" role="alert">
          {erro}
        </p>
      )}

      <div class="confirmacao-acoes">
        <button type="button" class="botao botao-secundario" onClick={aoFechar}>
          Cancelar
        </button>
        <button type="submit" class="botao" disabled={!resposta.trim()}>
          Preencher
        </button>
      </div>
    </form>
  );
}
