import { useMemo, useState } from 'preact/hooks';
import { ArrowLeft, Copy, Download, List, Share2, Smartphone, Users } from 'lucide-preact';
import { renderSVG } from 'uqr';
import { STATUS } from '../componentes/TopoTitulo.jsx';
import { criarCasal, entrarNoCasal, exportarCaderno, sincronizacaoDisponivel } from '../dados/repositorio.js';
import { voltar } from '../rotas.js';

const linkDoConvite = (codigo) => `${location.origin}${location.pathname}#/entrar/${codigo}`;

// Seção 7, "Como funciona sem login": o código do casal é o endereço dos dados.
export function Ajustes({ codigo, status, convite }) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [digitado, setDigitado] = useState('');

  async function executar(acao, sucesso) {
    setOcupado(true);
    setErro(null);
    setAviso(null);
    try {
      await acao();
      setAviso(sucesso);
      if (convite) location.replace('#/ajustes');
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }

  const { Icone, texto } = STATUS[status] ?? STATUS.local;
  const conviteNovo = convite && convite !== codigo;

  return (
    <main class="conteudo ajustes">
      <div class="ajustes-topo">
        <button type="button" class="botao-voltar-simples" onClick={voltar} aria-label="Voltar">
          <ArrowLeft size={24} aria-hidden="true" />
        </button>
        <h1 class="topo-titulo">Ajustes</h1>
      </div>

      <p class={`estado-sync indicador-${status}`}>
        <Icone size={20} aria-hidden="true" /> {texto}
      </p>

      {erro && (
        <p class="mensagem mensagem-erro" role="alert">
          {erro}
        </p>
      )}
      {aviso && (
        <p class="mensagem" role="status">
          {aviso}
        </p>
      )}

      {!sincronizacaoDisponivel ? (
        <section class="cartao">
          <h2>Sincronização</h2>
          <p>A sincronização entre os dois celulares ainda não foi ligada nesta versão do app.</p>
        </section>
      ) : (
        <>
          {conviteNovo && (
            <section class="cartao cartao-destaque">
              <h2>Entrar no caderno compartilhado?</h2>
              <p>
                Este aparelho vai passar a usar o mesmo planejador e a mesma lista do outro celular. O que estiver
                escolhido aqui agora será substituído.
              </p>
              <button
                type="button"
                class="botao"
                disabled={ocupado}
                onClick={() => executar(() => entrarNoCasal(convite), 'Pronto: os dois celulares estão juntos.')}
              >
                <Users size={20} aria-hidden="true" /> Entrar
              </button>
            </section>
          )}

          {codigo ? (
            <CodigoDoCasal codigo={codigo} />
          ) : conviteNovo ? null : (
            <section class="cartao">
              <h2>Usar nos dois celulares</h2>
              <p>
                Crie o código do casal num dos celulares e leve para o outro. As receitas escolhidas aqui vão junto.
              </p>
              <button
                type="button"
                class="botao"
                disabled={ocupado}
                onClick={() => executar(criarCasal, 'Código criado. Agora leve para o outro celular.')}
              >
                <Smartphone size={20} aria-hidden="true" /> Criar código do casal
              </button>
            </section>
          )}

          <details class="cartao" open={!codigo && !conviteNovo}>
            <summary>{codigo ? 'Entrar com outro código' : 'Já temos um código'}</summary>
            <form
              class="entrar"
              onSubmit={(e) => {
                e.preventDefault();
                executar(() => entrarNoCasal(digitado), 'Pronto: os dois celulares estão juntos.');
              }}
            >
              <label for="codigo">Cole o código ou o link que veio do outro celular</label>
              <input
                id="codigo"
                type="text"
                autocomplete="off"
                autocapitalize="off"
                spellcheck={false}
                value={digitado}
                onInput={(e) => setDigitado(e.currentTarget.value)}
              />
              <button type="submit" class="botao" disabled={ocupado || !digitado.trim()}>
                Entrar
              </button>
            </form>
          </details>
        </>
      )}

      <section class="cartao">
        <h2>Receitas</h2>
        <div class="ajustes-acoes">
          <a class="botao botao-secundario" href="#/ingredientes">
            <List size={20} aria-hidden="true" /> Ingredientes
          </a>
          <button type="button" class="botao botao-secundario" onClick={baixarCopia}>
            <Download size={20} aria-hidden="true" /> Baixar cópia
          </button>
        </div>
        <p class="nota">A cópia traz todas as receitas e ingredientes, no formato da carga inicial do app.</p>
      </section>
    </main>
  );
}

function CodigoDoCasal({ codigo }) {
  const [copiado, setCopiado] = useState(null);
  const link = linkDoConvite(codigo);
  const qr = useMemo(() => renderSVG(link, { border: 2, blackColor: '#1D2620', whiteColor: '#FFFFFF' }), [link]);

  async function copiar(texto, rotulo) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(rotulo);
    } catch {
      setCopiado('Não deu para copiar; selecione o código abaixo.');
    }
  }

  return (
    <section class="cartao">
      <h2>Código do casal</h2>
      <p>
        No outro celular, aponte a câmera para o QR code ou abra o link. Se o app já estiver instalado lá, abra
        Ajustes no app e cole o código em "Entrar com outro código".
      </p>
      <div class="qr" role="img" aria-label="QR code com o link do convite" dangerouslySetInnerHTML={{ __html: qr }} />
      <div class="ajustes-acoes">
        {navigator.share && (
          <button
            type="button"
            class="botao"
            onClick={() => navigator.share({ title: 'Caderno de Preparos', url: link }).catch(() => {})}
          >
            <Share2 size={20} aria-hidden="true" /> Enviar link
          </button>
        )}
        <button type="button" class="botao botao-secundario" onClick={() => copiar(codigo, 'Código copiado.')}>
          <Copy size={20} aria-hidden="true" /> Copiar código
        </button>
      </div>
      {copiado && <p role="status">{copiado}</p>}
      <code class="codigo">{codigo}</code>
      <p class="nota">Quem tiver este código vê e altera o caderno. Mande só para o outro celular.</p>
    </section>
  );
}

// Cópia de segurança das receitas (RNF-08).
function baixarCopia() {
  const arquivo = new Blob([JSON.stringify(exportarCaderno(), null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(arquivo);
  link.download = `caderno-de-preparos-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
